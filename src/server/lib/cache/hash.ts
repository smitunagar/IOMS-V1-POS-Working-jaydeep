import crypto from 'crypto';

export function contentHash(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

export default { contentHash };