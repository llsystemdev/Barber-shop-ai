// supabase/functions/emails/index.ts
// Supabase Edge Function: Transactional Emails & Confirmations
// Run with: supabase functions deploy emails

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, templateName, variables } = await req.json();

    console.log(`[Edge Function - Emails] Sending '${templateName}' email to ${to}`);

    // TODO: Connect to Resend or SendGrid to dispatch beautiful HTML templates
    const responseData = {
      sent: true,
      messageId: `msg_${crypto.randomUUID()}`
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
