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
    const { topic, gradeLevel = "high_school", count = 4 } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const ai = getGeminiClient();
    const prompt = `Create an interactive, student-friendly ${count}-question multiple choice quiz on the educational topic: "${topic}".
Target level: ${gradeLevel}.
Make the questions educational, engaging, with one clear correct answer, 3 plausible distractors, a helpful hint, and a comprehensive explanation.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a specialized school assessment generator. Only generate educational, classroom-appropriate quizzes. Provide high quality, accurate questions formatted strictly as valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  hint: { type: Type.STRING },
                },
                required: ["id", "question", "options", "correctIndex", "explanation"],
              },
            },
          },
          required: ["topic", "questions"],
        },
      },
    });

    const quizData = JSON.parse(response.text || "{}");
    return res.status(200).json(quizData);
  } catch (err: any) {
    console.error("Vercel quiz generation error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate quiz" });
  }
}
