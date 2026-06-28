import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const IMGFLIP_TEMPLATES: Record<string, { id: string; name: string; lines: number }> = {
  drake: { id: "181913649", name: "Drake Pointing", lines: 2 },
  distracted: { id: "112126428", name: "Distracted Boyfriend", lines: 3 },
  "two-buttons": { id: "87743020", name: "Two Buttons", lines: 2 },
  "change-my-mind": { id: "129242436", name: "Change My Mind", lines: 1 },
  "this-is-fine": { id: "55311130", name: "This Is Fine", lines: 1 },
  "galaxy-brain": { id: "93895088", name: "Expanding Brain", lines: 4 },
  "success-kid": { id: "61544", name: "Success Kid", lines: 2 },
  "one-does-not-simply": { id: "61579", name: "One Does Not Simply", lines: 2 },
  "gru-plan": { id: "131940431", name: "Gru's Plan", lines: 4 },
  "disaster-girl": { id: "97984", name: "Disaster Girl", lines: 2 },
};

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    if (!topic) return NextResponse.json({ error: "Topic required" }, { status: 400 });

    const templateList = Object.entries(IMGFLIP_TEMPLATES)
      .map(([key, t]) => `${key}: "${t.name}" (${t.lines} text boxes)`)
      .join("\n");

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `Create a funny meme about: "${topic}"

Available meme templates:
${templateList}

Pick the best template and write the text. Be witty and punchy — great memes are short.

Respond ONLY with valid JSON, no markdown:
{
  "template": "<template key from list above>",
  "texts": ["<text0>", "<text1>", ...],
  "explanation": "<one sentence on why this is funny>"
}`
      }]
    });

    const raw = (msg.content[0] as { type: string; text: string }).text.trim();
    const json = JSON.parse(raw.replace(/```json\n?|\n?```/g, ""));
    const template = IMGFLIP_TEMPLATES[json.template];
    if (!template) return NextResponse.json({ error: "Invalid template" }, { status: 400 });

    const params = new URLSearchParams({
      template_id: template.id,
      username: "imgflip_hubot",
      password: "imgflip_hubot",
    });
    json.texts.forEach((t: string, i: number) => params.append(`boxes[${i}][text]`, t));

    const imgflipRes = await fetch("https://api.imgflip.com/caption_image", {
      method: "POST",
      body: params,
    });
    const imgflipData = await imgflipRes.json();

    if (!imgflipData.success) {
      return NextResponse.json({ error: imgflipData.error_message }, { status: 500 });
    }

    return NextResponse.json({
      url: imgflipData.data.url,
      template: template.name,
      texts: json.texts,
      explanation: json.explanation,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
