import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req) {
  const {
    to,
    name,
    dateStr,
    type,
    hospital_name,
    hospital_address_line1,
    hospital_city,
  } = await req.json();

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const body =
    type === "initial"
      ? `Hi ${name}, your referral has been created for ${dateStr}. We will notify you once the receiving hospital confirms.`
      : type === "confirmed"
      ? `Hi ${name}, your referral has been confirmed for ${dateStr} at ${hospital_name}, ${hospital_address_line1}, ${hospital_city}. Please come at 09:00 AM.`
      : type === "completed"
      ? `Hi ${name}, your referral has been completed. We wish you health!`
      : "";

  const msg = await client.messages.create({
    body: body,
    from: `+15176843823`,
    to: `${to}`,
  });

  return NextResponse.json({ sid: msg.sid });
}
