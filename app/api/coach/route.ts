import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { role, network, amount, description } = await req.json();

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: `You are a chargeback expert with deep knowledge of ${network} dispute rules.

Scenario:
- Role: ${role === "merchant" ? "Merchant fighting a chargeback" : "Cardholder filing a dispute"}
- Network: ${network}
- Amount: ${amount ? `$${amount}` : "not specified"}
- Description: ${description}

Return ONLY valid JSON, no markdown:
{
  "reasonCode": "e.g. 13.1 or 4853",
  "reasonCodeName": "e.g. Merchandise/Services Not Received",
  "network": "${network}",
  "winProbability": 72,
  "winAssessment": "One sentence assessment of the situation and what determines the outcome",
  "evidenceNeeded": ["specific item 1", "specific item 2", "specific item 3", "specific item 4"],
  "script": "Full ready-to-send representment letter or dispute letter text, professional tone, 150-250 words",
  "timeLimit": "e.g. 30 days from chargeback notification date",
  "tips": ["specific actionable tip 1", "specific actionable tip 2"]
}

Win probability should be realistic (not always high). Evidence should be specific to this case.`
      }]
    });

    const raw = (msg.content[0] as { type: string; text: string }).text.trim()
      .replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    return NextResponse.json(JSON.parse(raw));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
