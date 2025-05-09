import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// IMPORTANT: Set these in your Supabase project\'s Edge Function settings
// 1. REAL_SUPABASE_URL: Your project\'s Supabase URL (e.g., https://uznkkjczakyyinzhmoll.supabase.co)
// 2. REAL_SUPABASE_ANON_KEY: Your project\'s anon key (the one starting with eyJ...)
const REAL_SUPABASE_URL = Deno.env.get("REAL_SUPABASE_URL");
const REAL_SUPABASE_ANON_KEY = Deno.env.get("REAL_SUPABASE_ANON_KEY");

const corsHeaders = {
  \'Access-Control-Allow-Origin\': \'https://sandersonfan.github.io\', // Your GitHub Pages site origin
  \'Access-Control-Allow-Methods\': \'GET, POST, PATCH, DELETE, OPTIONS\',
  \'Access-Control-Allow-Headers\': \'apikey, authorization, content-type, prefer, x-client-info\', // Headers your client sends
};

Deno.serve(async (req: Request) => {
  // Handle OPTIONS preflight request
  if (req.method === \'OPTIONS\') {
    return new Response(\'ok\', { headers: corsHeaders });
  }

  if (!REAL_SUPABASE_URL || !REAL_SUPABASE_ANON_KEY) {
    console.error("Supabase URL or Anon Key not configured in Edge Function environment variables.");
    return new Response(
      JSON.stringify({ error: "Server configuration error. Please contact support." }),
      { status: 500, headers: { ...corsHeaders, \'Content-Type\': \'application/json\' } }
    );
  }

  try {
    const requestUrl = new URL(req.url);
    
    // Extract the path intended for the Supabase API
    // e.g., if client calls /cors-proxy/rest/v1/members, we need /rest/v1/members
    const supabaseApiPathStartIndex = requestUrl.pathname.indexOf(\'/rest/v1/\');
    if (supabaseApiPathStartIndex === -1) {
      return new Response(
        JSON.stringify({ error: "Invalid API path. Path must include /rest/v1/." }),
        { status: 400, headers: { ...corsHeaders, \'Content-Type\': \'application/json\' } }
      );
    }
    const supabaseApiPath = requestUrl.pathname.substring(supabaseApiPathStartIndex);
    const targetSupabaseUrl = \`\${REAL_SUPABASE_URL}\${supabaseApiPath}\${requestUrl.search}\`;

    // Prepare headers to forward to the actual Supabase API
    const headersToSupabase = new Headers();
    
    // Use the Edge Function\'s environment variable for the apikey to the real Supabase
    headersToSupabase.set(\'apikey\', REAL_SUPABASE_ANON_KEY);

    // Forward relevant headers from the client\'s request
    if (req.headers.has(\'Authorization\')) { // User\'s JWT if logged in
      headersToSupabase.set(\'Authorization\', req.headers.get(\'Authorization\'));
    }
    if (req.headers.has(\'Content-Type\')) {
      headersToSupabase.set(\'Content-Type\', req.headers.get(\'Content-Type\'));
    } else if (req.method === "POST" || req.method === "PATCH" || req.method === "PUT") {
      headersToSupabase.set(\'Content-Type\', \'application/json\'); // Default for mutations
    }
    
    if (req.headers.has(\'Prefer\')) {
      headersToSupabase.set(\'Prefer\', req.headers.get(\'Prefer\'));
    } else {
      headersToSupabase.set(\'Prefer\', \'return=representation\'); // Default if not sent
    }

    if (req.headers.has(\'X-Client-Info\')) { // Supabase SDKs might send this
        headersToSupabase.set(\'X-Client-Info\', req.headers.get(\'X-Client-Info\'));
    }

    const supabaseResponse = await fetch(targetSupabaseUrl, {
      method: req.method,
      headers: headersToSupabase,
      body: req.body, // Pass through the body from the original request
    });

    // Prepare response headers to send back to the client
    const responseHeadersToClient = new Headers(supabaseResponse.headers); // Start with Supabase\'s response headers
    
    // Override/add our CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeadersToClient.set(key, value);
    });

    return new Response(supabaseResponse.body, {
      status: supabaseResponse.status,
      statusText: supabaseResponse.statusText,
      headers: responseHeadersToClient,
    });

  } catch (error) {
    console.error("Error proxying request in Edge Function:", error.message);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred while proxying the request." }),
      { status: 500, headers: { ...corsHeaders, \'Content-Type\': \'application/json\' } }
    );
  }
});
