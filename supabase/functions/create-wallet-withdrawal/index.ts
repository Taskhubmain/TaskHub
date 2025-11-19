import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  console.log("=== Withdrawal request received ===");

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Stripe configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      console.error("User authentication failed:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authenticated:", user.id);

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { amount, currency } = requestBody;

    if (!amount || amount <= 0) {
      console.error("Invalid amount:", amount);
      return new Response(
        JSON.stringify({ error: "Invalid amount. Must be greater than 0." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Withdrawal amount:", amount, "currency:", currency);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, balance, stripe_account_id, stripe_payouts_enabled")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to fetch profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch profile: " + profileError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile) {
      console.error("Profile not found for user:", user.id);
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Profile found. Stripe account:", profile.stripe_account_id, "Payouts enabled:", profile.stripe_payouts_enabled);

    if (!profile.stripe_account_id) {
      console.error("Stripe account not connected");
      return new Response(
        JSON.stringify({ error: "Stripe account not connected. Please connect your Stripe account first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile.stripe_payouts_enabled) {
      console.error("Payouts not enabled");
      return new Response(
        JSON.stringify({ error: "Payouts not enabled on your Stripe account. Please complete onboarding." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id, balance, currency, total_withdrawn")
      .eq("user_id", user.id)
      .maybeSingle();

    if (walletError) {
      console.error("Failed to fetch wallet:", walletError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch wallet: " + walletError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!wallet) {
      console.error("Wallet not found for user:", user.id);
      return new Response(
        JSON.stringify({ error: "Wallet not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Wallet found. Balance:", wallet.balance);

    const currentBalance = parseFloat(wallet.balance);
    if (currentBalance < amount) {
      console.error("Insufficient balance. Current:", currentBalance, "Requested:", amount);
      return new Response(
        JSON.stringify({ error: `Insufficient balance. Available: $${currentBalance.toFixed(2)}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const withdrawalCurrency = currency || wallet.currency || "usd";
    console.log("Creating transaction record...");

    const { data: transaction, error: txInsertError } = await supabase
      .from("transactions")
      .insert({
        wallet_id: wallet.id,
        type: "withdrawal",
        amount: amount,
        status: "pending",
        description: `Вывод средств $${amount.toFixed(2)} на Stripe аккаунт`,
        provider: "stripe_connect",
        provider_status: "pending",
      })
      .select()
      .single();

    if (txInsertError) {
      console.error("Failed to create transaction:", txInsertError);
      console.error("Error details:", JSON.stringify(txInsertError));
      return new Response(
        JSON.stringify({
          error: "Failed to create transaction",
          details: txInsertError.message,
          code: txInsertError.code
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!transaction) {
      console.error("Transaction insert succeeded but no data returned");
      return new Response(
        JSON.stringify({ error: "Transaction creation failed - no data returned" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Transaction created successfully:", transaction.id);

    try {
      console.log("Creating Stripe transfer...");
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: withdrawalCurrency.toLowerCase(),
        destination: profile.stripe_account_id,
        metadata: {
          user_id: user.id,
          wallet_id: wallet.id,
          transaction_id: transaction.id,
          type: "wallet_withdrawal",
        },
      });

      console.log("Stripe transfer created:", transfer.id);

      const { error: txUpdateError } = await supabase
        .from("transactions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          provider_payment_id: transfer.id,
          provider_status: transfer.status || "completed",
        })
        .eq("id", transaction.id);

      if (txUpdateError) {
        console.error("Failed to update transaction status:", txUpdateError);
      }

      const newWalletBalance = currentBalance - amount;
      const newTotalWithdrawn = parseFloat(wallet.total_withdrawn || 0) + amount;

      console.log("Updating wallet balance from", currentBalance, "to", newWalletBalance);

      const { error: walletUpdateError } = await supabase
        .from("wallets")
        .update({
          balance: newWalletBalance,
          total_withdrawn: newTotalWithdrawn,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wallet.id);

      if (walletUpdateError) {
        console.error("Failed to update wallet:", walletUpdateError);
      }

      const newProfileBalance = parseFloat(profile.balance) - amount;

      console.log("Updating profile balance from", profile.balance, "to", newProfileBalance);

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          balance: newProfileBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileUpdateError) {
        console.error("Failed to update profile balance:", profileUpdateError);
      }

      console.log("=== Withdrawal completed successfully ===");

      return new Response(
        JSON.stringify({
          success: true,
          transaction_id: transaction.id,
          transfer_id: transfer.id,
          amount: amount,
          currency: withdrawalCurrency,
          status: "completed",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (stripeError: any) {
      console.error("=== Stripe transfer failed ===");
      console.error("Stripe error:", stripeError);
      console.error("Error message:", stripeError.message);
      console.error("Error type:", stripeError.type);

      const { error: txFailError } = await supabase
        .from("transactions")
        .update({
          status: "failed",
          provider_status: "error",
          description: `Вывод средств $${amount.toFixed(2)} (ошибка: ${stripeError.message})`,
        })
        .eq("id", transaction.id);

      if (txFailError) {
        console.error("Failed to mark transaction as failed:", txFailError);
      }

      return new Response(
        JSON.stringify({
          error: "Transfer failed",
          message: stripeError.message,
          type: stripeError.type,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (error: any) {
    console.error("=== Unexpected error in create-wallet-withdrawal ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message || "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
