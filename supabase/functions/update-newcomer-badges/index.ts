import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all profiles to check their registration dates
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, created_at')
      .eq('role', 'FREELANCER');

    if (profilesError) {
      throw profilesError;
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let updatedCount = 0;
    let checkedCount = 0;

    for (const profile of profiles || []) {
      checkedCount++;
      const createdAt = new Date(profile.created_at);

      // This profile is older than 7 days, no action needed
      // The badge logic is handled in the frontend based on created_at
      // This function serves as a verification and could trigger other actions if needed

      if (createdAt < sevenDaysAgo) {
        // Profile is older than 7 days
        // In the future, you could add logic here to send notifications,
        // update statistics, or perform other actions
        updatedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Badge verification completed',
        stats: {
          checkedCount,
          updatedCount,
          timestamp: now.toISOString()
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error updating newcomer badges:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});
