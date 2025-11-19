import { createClient } from 'npm:@supabase/supabase-js@2';

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

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('id, chat_id, freelancer_id, client_id, last_progress_update, progress_reminder_sent')
      .eq('status', 'in_progress')
      .or(`last_progress_update.is.null,last_progress_update.lt.${twoDaysAgo.toISOString()}`)
      .eq('progress_reminder_sent', false);

    if (dealsError) {
      throw dealsError;
    }

    let remindersSent = 0;

    for (const deal of deals || []) {
      const reminderMessage = `⏰ Напоминание: Прошло 2 дня с последнего обновления прогресса. Пожалуйста, обновите статус выполнения работы.`;

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: deal.chat_id,
          sender_id: deal.client_id,
          content: reminderMessage,
          text: reminderMessage,
          type: 'system'
        });

      if (messageError) {
        console.error('Error sending reminder message:', messageError);
        continue;
      }

      await supabase
        .from('deals')
        .update({ progress_reminder_sent: true })
        .eq('id', deal.id);

      remindersSent++;
    }

    return new Response(
      JSON.stringify({ success: true, remindersSent }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});