const MODEL = "@cf/openai/whisper";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ status: "ok", model: MODEL });
    }

    if (url.pathname === "/analyze" && request.method === "POST") {
      return analyze(request, env);
    }

    return json({ error: "Not found" }, 404);
  },
};

async function analyze(request, env) {
  try {
    const form = await request.formData();
    const audio = form.get("audio");

    if (!(audio instanceof File)) {
      return json({ success: false, error: "audio file is required" }, 400);
    }

    const bytes = [...new Uint8Array(await audio.arrayBuffer())];
    const result = await env.AI.run(MODEL, { audio: bytes });
    const transcript = (result.text || "").trim();

    return json({
      success: true,
      transcript,
      language: result.language || "ta",
      intent: detectIntent(transcript),
      fields: extractFields(transcript),
    });
  } catch (error) {
    console.error("AI analysis failed", error);
    return json({
      success: false,
      error: "Unable to transcribe the recording",
    }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function detectIntent(text) {
  if (/(அனுப்பு|சமர்ப்பி|submit|send)/i.test(text)) return "submit_form";
  if (/(அழி|துடை|clear|reset)/i.test(text)) return "clear_form";
  if (/(மாற்று|திருத்து|change|edit|update)/i.test(text)) return "edit_form";
  return text ? "fill_form" : "unknown";
}

function extractFields(text) {
  const fields = {};
  add(fields, "name", /(?:என் பெயர்|பெயர்|my name is|name)\s*[:=]?\s*([^,.\n]+)/i, text);
  add(fields, "age", /(?:வயது|age)\s*[:=]?\s*(\d{1,3})/i, text);
  add(fields, "phone", /(?:தொலைபேசி|மொபைல்|phone|mobile)\s*[:=]?\s*([\d\s-]{10,})/i, text);
  add(fields, "email", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, text);
  add(fields, "city", /(?:ஊர்|நகரம்|city|town)\s*[:=]?\s*([^,.\n]+)/i, text);
  add(fields, "address", /(?:முகவரி|address)\s*[:=]?\s*([^.\n]+)/i, text);
  return fields;
}

function add(fields, key, pattern, text) {
  const match = text.match(pattern);
  if (match) fields[key] = (match[1] || match[0]).trim().replace(/[.,]+$/, "");
}
