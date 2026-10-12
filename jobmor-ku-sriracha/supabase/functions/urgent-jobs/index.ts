// Native Push was intentionally stopped for the Expo Go university demo.
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization,x-client-info,apikey,content-type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Content-Type': 'application/json',
};
Deno.serve((request: Request) => request.method === 'OPTIONS'
  ? new Response(null, { status: 204, headers })
  : new Response(JSON.stringify({ error: 'featureDisabled', message: 'Use the existing job application flow.' }), { status: 410, headers }));
