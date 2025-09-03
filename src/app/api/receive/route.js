import twilio from "twilio";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { Body, From } = await req.formData().then((data) => {
    return {
      Body: data.get("Body"),
      From: data.get("From"),
    };
  });

  console.log(`Received message from ${From}: ${Body}`);
  if (Body.trim() === "Confirm") {
    // Handle confirmation
    
  } else {
    // Handle cancellation
  }

  // Respond to the incoming message
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message("Message received. Thank you!");

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
