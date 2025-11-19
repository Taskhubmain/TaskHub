import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ModerationRequest {
  content: string;
  contentType: 'proposal' | 'message' | 'order' | 'task';
  contentId?: string;
}

interface ModerationResult {
  flagged: boolean;
  reasons: string[];
  confidence: number;
  action: 'none' | 'warning' | 'blocked';
  message?: string;
}

// Pre-compiled regex patterns for better performance
const PATTERNS = {
  profanityRu: /хуй|пизд|еба|ебл|бля|сука|мудак|гандон|пидор|дерьмо/i,
  profanityEn: /fuck|shit|bitch|asshole|damn|crap|bastard|dick|pussy/i,
  externalPlatform: /telegram|телеграм|телега|whatsapp|ватсап|вотсап|viber|вайбер|skype|скайп|discord|дискорд/i,
  username: /@[a-zA-Z0-9_]{3,}/,
  externalPlatformAction: /(переходи|перейди|пиши|напиши|звони|позвони)\s+(в|на|мне)\s+(telegram|телеграм|whatsapp|viber|skype|discord)/i,
  phone1: /\+?[78][-\s]?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  phone2: /\+?\d{10,15}/g,
  phone3: /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/g,
  phone4: /\b\d{5}[-\s]?\d{5}\b/g,
  externalPayment1: /(оплат|плат|деньг|перевод|перевести|переведи)\w*\s+(мимо|вне|напрямую|через|на)\s+(платформ|сайт|карту|счет|киви|qiwi|paypal|пейпал)/i,
  externalPayment2: /(cash|кэш|наличн|карт|счет|перевод)\w*\s+(напрямую|мимо|вне)\s+(платформ|сайт)/i,
  externalPayment3: /paypal|пейпал|qiwi|киви|webmoney|вебмани|яндекс\.деньги|yandex\.money/i,
  sexualContent1: /секс|sex|интим|intimate|голая|голый|nude|naked|порно|porn|xxx|эротик|erotic/i,
  sexualContent2: /минет|blowjob|оральн|oral|анал|anal|вагин|vagina|член|penis|грудь|breast|сиськ|tits|жопа|ass|попа|butt/i,
  sexualContent3: /проститут|prostitut|эскорт|escort|секс[-\s]?услуг|sex[-\s]?service|интим[-\s]?услуг/i,
  sexualContent4: /(познаком|встреч|свидан|date|relationship)\w*\s+(для|за|с)\s+(секс|интим|ночь|постел)/i,
  drugs1: /кокаин|cocaine|героин|heroin|мефедрон|mephedrone|амфетамин|amphetamine|спайс|spice|марихуана|marijuana|гашиш|hashish|lsd|экстази|ecstasy|mdma/i,
  drugs2: /наркотик|drug|дурь|трава|план|stuff|weed|joint/i,
  drugs3: /курительн|смеси|миксы|закладк|закладки/i,
  drugs4: /\b(соль|альфа|мет|бошки|шишки|твердый|мягкий)\b/i,
};

function moderateContent(content: string): ModerationResult {
  const contentLower = content.toLowerCase();
  const reasons: string[] = [];
  let maxConfidence = 0;

  if (PATTERNS.profanityRu.test(contentLower)) {
    reasons.push('profanity');
    maxConfidence = Math.max(maxConfidence, 0.95);
  }

  if (PATTERNS.profanityEn.test(contentLower)) {
    reasons.push('profanity');
    maxConfidence = Math.max(maxConfidence, 0.95);
  }

  if (PATTERNS.externalPlatform.test(contentLower)) {
    reasons.push('external_platform');
    maxConfidence = Math.max(maxConfidence, 0.90);
  }

  if (PATTERNS.username.test(content)) {
    reasons.push('external_platform');
    maxConfidence = Math.max(maxConfidence, 0.85);
  }

  if (PATTERNS.externalPlatformAction.test(contentLower)) {
    reasons.push('external_platform');
    maxConfidence = Math.max(maxConfidence, 0.95);
  }

  // Check phone patterns
  const phonePatterns = [PATTERNS.phone1, PATTERNS.phone2, PATTERNS.phone3, PATTERNS.phone4];
  for (const pattern of phonePatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      const hasEnoughDigits = matches.some(m => {
        const digits = m.replace(/\D/g, '');
        return digits.length >= 10;
      });
      if (hasEnoughDigits) {
        reasons.push('phone_number');
        maxConfidence = Math.max(maxConfidence, 0.95);
        break;
      }
    }
  }

  if (PATTERNS.externalPayment1.test(contentLower)) {
    reasons.push('external_payment');
    maxConfidence = Math.max(maxConfidence, 0.85);
  }

  if (PATTERNS.externalPayment2.test(contentLower)) {
    reasons.push('external_payment');
    maxConfidence = Math.max(maxConfidence, 0.85);
  }

  if (PATTERNS.externalPayment3.test(contentLower)) {
    reasons.push('external_payment');
    maxConfidence = Math.max(maxConfidence, 0.85);
  }

  if (PATTERNS.sexualContent1.test(contentLower)) {
    reasons.push('sexual_content');
    maxConfidence = Math.max(maxConfidence, 0.95);
  }

  if (PATTERNS.sexualContent2.test(contentLower)) {
    reasons.push('sexual_content');
    maxConfidence = Math.max(maxConfidence, 0.95);
  }

  if (PATTERNS.sexualContent3.test(contentLower)) {
    reasons.push('sexual_content');
    maxConfidence = Math.max(maxConfidence, 0.95);
  }

  if (PATTERNS.sexualContent4.test(contentLower)) {
    reasons.push('sexual_content');
    maxConfidence = Math.max(maxConfidence, 0.95);
  }

  if (PATTERNS.drugs1.test(contentLower)) {
    reasons.push('drugs');
    maxConfidence = Math.max(maxConfidence, 0.95);
  }

  if (PATTERNS.drugs2.test(contentLower)) {
    reasons.push('drugs');
    maxConfidence = Math.max(maxConfidence, 0.95);
  }

  if (PATTERNS.drugs3.test(contentLower)) {
    reasons.push('drugs');
    maxConfidence = Math.max(maxConfidence, 0.95);
  }

  if (PATTERNS.drugs4.test(contentLower)) {
    reasons.push('drugs');
    maxConfidence = Math.max(maxConfidence, 0.95);
  }

  const flagged = reasons.length > 0;
  let action: 'none' | 'warning' | 'blocked' = 'none';
  let message = '';

  if (flagged) {
    if (reasons.includes('drugs')) {
      action = 'blocked';
      message = 'Объявление содержит запрещённый контент связанный с наркотиками. Пожалуйста, измените его содержание или напишите в поддержку.';
    }

    if (reasons.includes('sexual_content')) {
      action = 'blocked';
      message = 'Объявление содержит запрещённый контент сексуального характера. Пожалуйста, измените его содержание или напишите в поддержку.';
    }

    if (reasons.includes('profanity')) {
      action = 'blocked';
      message = 'Объявление содержит ненормативную лексику. Пожалуйста, измените его содержание или напишите в поддержку.';
    }

    if (reasons.includes('external_payment')) {
      action = 'blocked';
      message = 'Объявление содержит запрещённый контент. Запрещена оплата вне платформы. Пожалуйста, измените его содержание или напишите в поддержку.';
    }

    if (reasons.includes('external_platform') || reasons.includes('phone_number')) {
      action = 'blocked';
      message = 'Объявление содержит запрещённый контент. Запрещены контактные данные и ссылки на другие платформы. Пожалуйста, измените его содержание или напишите в поддержку.';
    }
  }

  return {
    flagged,
    reasons: Array.from(new Set(reasons)),
    confidence: maxConfidence,
    action,
    message,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ModerationRequest = await req.json();
    const { content, contentType, contentId } = body;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = moderateContent(content);

    await supabase.from('moderation_logs').insert({
      user_id: user.id,
      content_type: contentType,
      content_id: contentId,
      original_content: content,
      flagged: result.flagged,
      flag_reasons: result.reasons,
      confidence_score: result.confidence,
      action_taken: result.action,
    });

    if (result.flagged && result.action !== 'none') {
      const severity = result.action === 'blocked' ? 3 : result.action === 'warning' ? 2 : 1;

      await supabase.from('user_warnings').insert({
        user_id: user.id,
        warning_type: result.reasons.join(', '),
        description: result.message || 'Content violates platform guidelines',
        severity,
      });

      const { data: profile } = await supabase
        .from('profiles')
        .select('warning_count')
        .eq('id', user.id)
        .single();

      await supabase
        .from('profiles')
        .update({ warning_count: (profile?.warning_count || 0) + 1 })
        .eq('id', user.id);
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Moderation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', flagged: false, reasons: [], confidence: 0, action: 'none' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
