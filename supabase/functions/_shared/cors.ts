const allowedOrigins = [
  'https://pool-league-manager.com',
  'https://www.pool-league-manager.com',
  ...(Deno.env.get('ALLOWED_ORIGINS')?.split(',').map(s => s.trim()) || []),
].filter(Boolean);

export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get('origin') || '';
  const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || '';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

// Backwards-compatible export for existing code
export const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigins[0] || 'https://pool-league-manager.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
