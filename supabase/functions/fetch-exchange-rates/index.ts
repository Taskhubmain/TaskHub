import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ExchangeRateResponse {
  success: boolean;
  base: string;
  rates: Record<string, number>;
  timestamp?: number;
}

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

    // Get base currency from query params (default USD)
    const url = new URL(req.url);
    const baseCurrency = url.searchParams.get('base') || 'USD';
    const targetCurrency = url.searchParams.get('target');

    // Fetch exchange rates from API
    // Using exchangerate-api.com free tier (1500 requests/month)
    const apiUrl = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
    }

    const data: ExchangeRateResponse = await response.json();

    if (!data.rates) {
      throw new Error('Invalid response from exchange rate API');
    }

    // Store rates in database
    const fetchedAt = new Date().toISOString();
    const rateInserts = [];

    for (const [toCurrency, rate] of Object.entries(data.rates)) {
      rateInserts.push({
        from_currency: baseCurrency,
        to_currency: toCurrency,
        rate: rate,
        fetched_at: fetchedAt,
      });
    }

    // Insert rates in batches
    const batchSize = 100;
    for (let i = 0; i < rateInserts.length; i += batchSize) {
      const batch = rateInserts.slice(i, i + batchSize);
      const { error } = await supabase
        .from('exchange_rates')
        .insert(batch);

      if (error) {
        console.error('Error inserting exchange rates:', error);
      }
    }

    // Return requested rate or all rates
    const result = targetCurrency
      ? {
          success: true,
          base: baseCurrency,
          target: targetCurrency,
          rate: data.rates[targetCurrency] || null,
          timestamp: Date.now(),
        }
      : {
          success: true,
          base: baseCurrency,
          rates: data.rates,
          timestamp: Date.now(),
        };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in fetch-exchange-rates function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
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