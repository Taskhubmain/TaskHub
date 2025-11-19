const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
const TELEGRAM_REGEX = /(@[a-zA-Z0-9_]{5,}|t\.me\/[a-zA-Z0-9_]+)/gi;

export interface ContentFilterResult {
  isClean: boolean;
  violations: string[];
  cleanedText?: string;
}

export function filterContent(text: string): ContentFilterResult {
  const violations: string[] = [];
  
  if (EMAIL_REGEX.test(text)) violations.push('Email');
  if (PHONE_REGEX.test(text)) violations.push('Phone');
  if (URL_REGEX.test(text)) violations.push('URL');
  if (TELEGRAM_REGEX.test(text)) violations.push('Contact');
  
  return {
    isClean: violations.length === 0,
    violations,
    cleanedText: violations.length > 0 ? text
      .replace(EMAIL_REGEX, '[REMOVED]')
      .replace(PHONE_REGEX, '[REMOVED]')
      .replace(URL_REGEX, '[REMOVED]')
      .replace(TELEGRAM_REGEX, '[REMOVED]') : undefined
  };
}

export function checkProposalLimit(user: any): { allowed: boolean; reason?: string } {
  if (user.proposalBlockedUntil && user.proposalBlockedUntil > new Date()) {
    return { allowed: false, reason: 'Account temporarily blocked' };
  }
  if (user.proposalLimitUsed >= user.proposalLimitMax) {
    return { allowed: false, reason: 'Monthly limit reached' };
  }
  return { allowed: true };
}
