import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, stripe-signature",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  console.log("Webhook received:", req.method);

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey) {
      console.error("Missing STRIPE_SECRET_KEY");
      return new Response(
        JSON.stringify({ error: "Missing STRIPE_SECRET_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!webhookSecret) {
      console.error("Missing STRIPE_WEBHOOK_SECRET");
      return new Response(
        JSON.stringify({ error: "Missing STRIPE_WEBHOOK_SECRET" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Stripe keys configured");

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("Missing stripe-signature header");
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Stripe signature header present");

    const body = await req.text();
    console.log("Request body length:", body.length);

    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log("Webhook signature verified successfully");
      console.log("Event type:", event.type);
      console.log("Event ID:", event.id);
    } catch (err) {
      console.error("Webhook signature verification failed:");
      console.error("Error message:", err.message);
      console.error("Error type:", err.type);
      return new Response(
        JSON.stringify({
          error: "Webhook signature verification failed",
          message: err.message
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (event.type === "checkout.session.completed") {
      console.log("Processing checkout.session.completed event");
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("Session ID:", session.id);
      console.log("Payment status:", session.payment_status);
      console.log("Metadata:", JSON.stringify(session.metadata));

      const { user_id, wallet_id, transaction_id } = session.metadata || {};

      if (!user_id || !wallet_id || !transaction_id) {
        console.error("Missing metadata in checkout session");
        console.error("user_id:", user_id);
        console.error("wallet_id:", wallet_id);
        console.error("transaction_id:", transaction_id);
        return new Response(
          JSON.stringify({ error: "Missing metadata" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      console.log("Fetching transaction:", transaction_id);

      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", transaction_id)
        .maybeSingle();

      if (txError || !transaction) {
        console.error("Transaction not found:", txError?.message);
        return new Response(
          JSON.stringify({ error: "Transaction not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Transaction found. Current status:", transaction.status);

      if (transaction.status === "completed") {
        console.log("Transaction already completed:", transaction.id);
        return new Response(
          JSON.stringify({ received: true, message: "Already completed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (transaction.status === "failed" || transaction.status === "cancelled") {
        console.log("Transaction was failed/cancelled, ignoring:", transaction.id);
        return new Response(
          JSON.stringify({ received: true, message: "Transaction was failed or cancelled" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const amount = parseFloat(transaction.amount);
      console.log("Processing amount:", amount);

      const wasExpired = transaction.status === "expired";
      let newDescription = transaction.description;

      if (wasExpired) {
        console.log("Transaction was expired, but payment completed - accepting late payment");
        newDescription = transaction.description
          ? `${transaction.description} (оплачено после истечения 20-минутного ожидания)`
          : "Stripe пополнение кошелька (оплачено после истечения 20-минутного ожидания)";
      }

      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          provider_status: "succeeded",
          description: newDescription,
        })
        .eq("id", transaction_id);

      if (updateError) {
        console.error("Failed to update transaction:", updateError.message);
        throw updateError;
      }

      console.log("Transaction status updated to completed");

      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("balance, total_earned")
        .eq("id", wallet_id)
        .single();

      if (walletError) {
        console.error("Failed to fetch wallet:", walletError.message);
        throw walletError;
      }

      if (wallet) {
        const newBalance = parseFloat(wallet.balance) + amount;
        const newTotalEarned = parseFloat(wallet.total_earned) + amount;

        console.log("Updating wallet balance from", wallet.balance, "to", newBalance);

        const { error: walletUpdateError } = await supabase
          .from("wallets")
          .update({
            balance: newBalance,
            total_earned: newTotalEarned,
            updated_at: new Date().toISOString(),
          })
          .eq("id", wallet_id);

        if (walletUpdateError) {
          console.error("Failed to update wallet:", walletUpdateError.message);
          throw walletUpdateError;
        }

        console.log("Wallet updated successfully");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", user_id)
        .single();

      if (profileError) {
        console.error("Failed to fetch profile:", profileError.message);
        throw profileError;
      }

      if (profile) {
        const newProfileBalance = parseFloat(profile.balance) + amount;

        console.log("Updating profile balance from", profile.balance, "to", newProfileBalance);

        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({
            balance: newProfileBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user_id);

        if (profileUpdateError) {
          console.error("Failed to update profile:", profileUpdateError.message);
          throw profileUpdateError;
        }

        console.log("Profile updated successfully");
      }

      console.log("Successfully processed deposit for user", user_id, "amount:", amount);
    } else if (event.type === "checkout.session.expired") {
      console.log("Processing checkout.session.expired event");
      const session = event.data.object as Stripe.Checkout.Session;
      const { transaction_id } = session.metadata || {};

      if (transaction_id) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await supabase
          .from("transactions")
          .update({
            status: "expired",
            provider_status: "expired",
          })
          .eq("id", transaction_id)
          .eq("status", "pending");

        console.log("Transaction marked as expired:", transaction_id);
      }
    } else if (event.type === "payment_intent.payment_failed") {
      console.log("Processing payment_intent.payment_failed event");
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { transaction_id } = paymentIntent.metadata || {};

      if (transaction_id) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await supabase
          .from("transactions")
          .update({
            status: "failed",
            provider_status: "payment_failed",
          })
          .eq("id", transaction_id)
          .eq("status", "pending");

        console.log("Transaction marked as failed:", transaction_id);
      }
    } else if (event.type === "charge.dispute.created") {
      console.log("Processing charge.dispute.created event");
      const dispute = event.data.object as Stripe.Dispute;

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase
        .from("transactions")
        .update({
          status: "disputed",
          provider_status: "dispute_created",
        })
        .eq("provider_payment_id", dispute.charge)
        .in("status", ["completed", "processing"]);

      console.log("Transaction marked as disputed for charge:", dispute.charge);
    } else if (event.type === "transfer.failed") {
      console.log("Processing transfer.failed event");
      const transfer = event.data.object as Stripe.Transfer;
      const { transaction_id } = transfer.metadata || {};

      if (transaction_id) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await supabase
          .from("transactions")
          .update({
            status: "failed",
            provider_status: transfer.failure_code || "transfer_failed",
          })
          .eq("id", transaction_id);

        console.log("Withdrawal marked as failed:", transaction_id);
      }
    } else {
      console.log("Event type not handled:", event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    console.error("Error stack:", error.stack);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        type: error.type || "unknown"
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