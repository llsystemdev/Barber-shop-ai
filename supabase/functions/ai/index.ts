// supabase/functions/ai/index.ts
// Supabase Edge Function: Face Shape Analysis & Gemini-Powered Style Generation
// Run with: supabase functions deploy ai

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
    const { action, base64Image, conversationHistory, customPrompt } = await req.json();

    console.log(`[Edge Function - AI] Invoking model action: ${action}`);

    let responseData = {};

    switch (action) {
      case "analyze_face":
        // TODO: Pass image stream to Gemini API for diagnostic face-mapping and product recommendation
        responseData = {
          faceShape: "Oval",
          confidence: 0.94,
          recommendations: ["Classic Pompadour", "Modern Fade", "Taper Cut"],
          explanation: "Tu rostro ovalado es muy versátil. Los cortes con volumen arriba y lados limpios resaltarán tu estructura."
        };
        break;
      case "chat_assistant":
        // TODO: Orchestrate chatbot reply using system prompt & history
        responseData = {
          reply: "¡Hola! Analizando tu solicitud, sugiero mantener los laterales cortos para estilizar tus facciones.",
          suggestedServiceId: "srv_placeholder_123"
        };
        break;
      default:
        throw new Error(`Unsupported AI action: ${action}`);
    }

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
