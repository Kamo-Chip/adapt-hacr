import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req) {
  const { to, name, dateStr, timeStr } = await req.json();

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const msg = await client.messages.create({
    contentSid: "HXb5b62575e6e4ff6129ad7c8efe1f983e",
    contentVariables: JSON.stringify({ 1: dateStr, 2: timeStr }),
    from: `whatsapp:+14155238886`,
    to: `whatsapp:${to}`, // e.g. "whatsapp:+27XXXXXXXXX"
  });

  return NextResponse.json({ sid: msg.sid });
}
