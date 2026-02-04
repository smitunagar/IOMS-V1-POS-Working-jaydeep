import iconv from 'iconv-lite';

// Normalize arbitrary buffer to UTF-8 string, stripping nulls and control chars (except \n, \r, \t)
export function normalizeBufferToUtf8(buf: Buffer): string {
  try {
    // Try UTF-8 decode first
    let s = buf.toString('utf8');
    // If contains lots of replacement chars, try latin1
    const replCount = (s.match(/\uFFFD/g) || []).length;
    if (replCount > Math.max(10, Math.floor(s.length * 0.01))) {
      s = iconv.decode(buf, 'latin1');
    }
    // Strip nulls and C0 controls except common whitespace
    s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    return s;
  } catch {
    return buf.toString('utf8').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  }
}

// Normalize a label to safe display/storage form
export function safeLabel(s: string): string {
  if (!s) return '';
  // NFKC normalize
  let out = s.normalize('NFKC');
  // Remove non-printables and restrict to letters, numbers, whitespace and a few punctuation
  out = out.replace(/[^\p{L}\p{N}\s\-&\/.(),'+:]/gu, '');
  // Collapse whitespace
  out = out.replace(/\s{2,}/g, ' ').trim();
  if (out.length > 120) out = out.slice(0, 120);
  return out || 'Uncategorized';
}

export default { normalizeBufferToUtf8, safeLabel };