import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
  if (apiKey) {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return new GoogleGenAI({});
};

const CANDIDATE_MODELS = [
  "gemini-3.7-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-flash-latest",
];

const generateWithGeminiFallback = async (params: any) => {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        ...params,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Fallback] Model ${model} failed, trying next available model... Error: ${err?.message || err}`);
    }
  }

  throw lastError || new Error("All Gemini candidate models failed to generate content.");
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages = [], gradeLevel = "high_school", studyMode = "study_buddy", attachments = [], currentDate } = req.body;

    const formattedMessages = messages.map((m: any) => {
      const role = m.role === "user" ? "user" : "model";
      return `${role.toUpperCase()}: ${m.content}`;
    }).join("\n\n");

    const systemInstruction = `You are RYLI, an encouraging, patient, and highly intelligent AI study companion and personal academic tutor created by Ryda AI.
Grade Level: ${gradeLevel}
Study Mode: ${studyMode}
Current Date: ${currentDate || "today"}

Provide clear, helpful, educational answers suitable for the student's grade level. Format mathematical or scientific formulas clearly with KaTeX/LaTeX ($ or $$). Keep explanations engaging.`;

    const contents: any[] = [];
    contents.push({ text: `System Context: ${systemInstruction}\n\nChat History:\n${formattedMessages}` });

    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.dataUrl && att.dataUrl.includes(",")) {
          const parts = att.dataUrl.split(",");
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
          const base64Data = parts[1];
          contents.push({
            inlineData: {
              mimeType,
              data: base64Data,
            },
          });
        }
      }
    }

    const response = await generateWithGeminiFallback({
      contents,
      config: {
        temperature: 0.7,
      },
    });

    return res.status(200).json({
      content: response.text || "I was unable to generate a response. Please try again.",
      suggestedFollowUps: [
        "Can you explain that with an example?",
        "Quiz me on this topic!",
        "Give me a step-by-step summary",
      ],
    });
  } catch (error: any) {
    console.error("Vercel /api/chat error:", error);
    return res.status(500).json({ error: error.message || "Failed to process chat request" });
  }
}
