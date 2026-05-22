/** Redact sensitive content before LLM calls (Phase B agent overlay). */

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}/g;
const ABS_PATH_RE = /(?:\/Users\/|\/home\/|C:\\|D:\\)[^\s"'<>]+/g;
const LARGE_AMOUNT_RE = /\$[\d,]+(?:\.\d{2})?/g;

export interface RedactionOptions {
  stripEmails?: boolean;
  stripPhones?: boolean;
  stripPaths?: boolean;
  stripLargeAmounts?: boolean;
  amountThreshold?: number;
}

const DEFAULT_OPTS: Required<RedactionOptions> = {
  stripEmails: true,
  stripPhones: true,
  stripPaths: true,
  stripLargeAmounts: true,
  amountThreshold: 1000,
};

export function redactForLlm(text: string, opts: RedactionOptions = {}): string {
  const o = { ...DEFAULT_OPTS, ...opts };
  let out = text;
  if (o.stripEmails) out = out.replace(EMAIL_RE, "[REDACTED_EMAIL]");
  if (o.stripPhones) out = out.replace(PHONE_RE, "[REDACTED_PHONE]");
  if (o.stripPaths) out = out.replace(ABS_PATH_RE, "[REDACTED_PATH]");
  if (o.stripLargeAmounts) {
    out = out.replace(LARGE_AMOUNT_RE, (match) => {
      const num = Number(match.replace(/[$,]/g, ""));
      return num >= o.amountThreshold ? "[REDACTED_AMOUNT]" : match;
    });
  }
  return out;
}
