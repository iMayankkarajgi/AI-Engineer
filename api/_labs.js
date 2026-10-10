// Where the build hides the lab code. The folder name is a fingerprint of a
// server secret, so it cannot be guessed and never appears in the browser. The
// build script (scripts/protect-labs.mjs) and the lab function both call this.
import { createHmac } from 'node:crypto';

export function labsFolder() {
  const secret = process.env.LABS_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return secret ? createHmac('sha256', secret).update('modern-ai-engineering:labs:v1').digest('hex').slice(0, 40) : '';
}
