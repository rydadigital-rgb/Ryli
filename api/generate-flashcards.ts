import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
  if (apiKey) {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });
  }
  return new GoogleGenAI({});
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { topic, gradeLevel = "high_school", count = 6 } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const ai = getGeminiClient();
    const prompt = `Create a deck of ${count} high-yield active recall flashcards for studying the educational topic: "${topic}".
Target level: ${gradeLevel}.
Each card must have a clear Front (question, term, or prompt), an accurate concise Back (definition, formula, or answer), and a memory Hint.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert study aid and active-recall flashcard creator for students. Always respond with strict valid JSON matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  hint: { type: Type.STRING },
                  subject: { type: Type.STRING },
                },
                required: ["id", "front", "back"],
              },
            },
          },
          required: ["topic", "cards"],
        },
      },
    });

    const flashcardsData = JSON.parse(response.text || "{}");
    return res.status(200).json(flashcardsData);
  } catch (err: any) {
    console.error("Vercel flashcard generation error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate flashcards" });
  }
}
