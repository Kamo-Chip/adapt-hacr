// app/api/referrals/summarize/route.js
export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient as createSb } from "@supabase/supabase-js";

const sb = createSb(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildPrompt(r) {
  return [
    "You are a clinical handover assistant.",
    "Draft a single, concise referral summary as one continuous paragraph (~100 words).",
    "Do not include headings, labels, bullet points, or markdown formatting.",
    "Stay factual, neutral, and professional. Avoid speculation.",
    "Exclude all personally identifiable information (names, contact details, IDs, dates of birth, etc.).",
    "Cover only the following in narrative form: presenting problem, relevant history and findings, current treatment/medications, allergies, urgency and risks, requested department and rationale, and next steps for the receiving team.",
    "",
    `Department: ${r.department ?? "N/A"}`,
    `Urgency: ${r.urgency ?? "N/A"}`,
    `Medical Condition: ${r.condition_description ?? "N/A"}`,
    `Reason for Referral: ${r.reason_for_referral ?? "N/A"}`,
    `Current Treatment: ${r.current_medications ?? "N/A"}`,
    `Allergies: ${r.known_allergies ?? "N/A"}`,
    `Preferred Date: ${r.preferred_referral_date ?? "N/A"}`,
  ].join("\n");
}

export async function POST(req) {
  try {
    const { referralId } = await req.json();
    if (!referralId)
      return NextResponse.json(
        { error: "Missing referralId" },
        { status: 400 }
      );

    // 1) Load the referral row (needs document_urls + the key fields you want in the prompt)
    const { data: r, error } = await sb
      .from("referrals")
      .select(
        `
          id,
          department,
          urgency,
          condition_description,
          known_allergies,
          current_medications,
          preferred_referral_date,
          consent_medical_info,
          consent_whatsapp,
          ai_summary,
          document_urls
        `
      )
      .eq("id", referralId)
      .single();

    if (error || !r) throw error || new Error("Referral not found");

    const urls = Array.isArray(r.document_urls) ? r.document_urls : [];

    // 2) Create a vector store for this referral and upload docs to OpenAI
    const vectorStore = await openai.vectorStores.create({
      name: `referral_${referralId}`,
    });

    // Helper: download + wrap as File for OpenAI
    async function urlToFile(u) {
      const res = await fetch(u);
      if (!res.ok) throw new Error(`Failed to fetch ${u}`);
      const ab = await res.arrayBuffer();
      const contentType =
        res.headers.get("content-type") || "application/octet-stream";
      const name = decodeURIComponent(u.split("/").pop() || "document");
      return new File([Buffer.from(ab)], name, { type: contentType });
    }

    if (urls.length) {
      // Upload files to OpenAI and attach to this vector store
      for (const u of urls) {
        const file = await urlToFile(u);
        const uploaded = await openai.files.create({
          file,
          purpose: "assistants",
        });
        await openai.vectorStores.files.create(vectorStore.id, {
          file_id: uploaded.id,
        });
      }
    }

    // 3) Build prompt and run Responses API with file_search
    const prompt = buildPrompt(r);

    const resp = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
      temperature: 0.2,
      tools: [{ type: "file_search", vector_store_ids: [vectorStore.id] }],
    });

    const ai_summary = resp.output_text ?? "";

    // 4) Save result
    await sb.from("referrals").update({ ai_summary }).eq("id", referralId);

    return NextResponse.json({ ok: true, referralId });
  } catch (e) {
    console.error("summarize error", e);
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
