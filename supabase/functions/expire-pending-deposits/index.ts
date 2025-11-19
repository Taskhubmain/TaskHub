import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

  console.log("=== Expire Pending Deposits: Starting cleanup ===");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    console.log("Checking for deposits older than:", twentyMinutesAgo);

    const { data: pendingDeposits, error: selectError } = await supabase
      .from("transactions")
      .select("id, created_at, amount, description")
      .eq("type", "deposit")
      .eq("status", "pending")
      .lte("created_at", twentyMinutesAgo);

    if (selectError) {
      console.error("Error fetching pending deposits:", selectError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch pending deposits",
          details: selectError.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const foundCount = pendingDeposits?.length || 0;
    console.log(`Found ${foundCount} pending deposits older than 20 minutes`);

    if (foundCount === 0) {
      console.log("No expired deposits to process");
      return new Response(
        JSON.stringify({
          processed: 0,
          updated: 0,
          message: "No expired deposits found",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    pendingDeposits.forEach((deposit: any) => {
      console.log(`- Deposit ${deposit.id}: $${deposit.amount}, created ${deposit.created_at}`);
    });

    const { error: updateError, count } = await supabase
      .from("transactions")
      .update({
        status: "expired",
        provider_status: "timeout",
        updated_at: new Date().toISOString(),
      })
      .eq("type", "deposit")
      .eq("status", "pending")
      .lte("created_at", twentyMinutesAgo);

    if (updateError) {
      console.error("Error updating expired deposits:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update expired deposits",
          details: updateError.message,
          processed: foundCount,
          updated: 0,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const updatedCount = count || 0;
    console.log(`Successfully updated ${updatedCount} deposits to expired status`);
    console.log("=== Expire Pending Deposits: Cleanup completed ===");

    return new Response(
      JSON.stringify({
        processed: foundCount,
        updated: updatedCount,
        message: `Updated ${updatedCount} expired deposits`,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("=== Unexpected error in expire-pending-deposits ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message || "Unknown error",
        processed: 0,
        updated: 0,
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