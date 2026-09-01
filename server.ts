import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Gemini Client
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

// Priority list of Gemini Free Tier models (Fastest & Highest Quality)
const CANDIDATE_MODELS = [
  "gemini-3.7-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-flash-latest",
];

// ==========================================
// STUDENT SAFETY & CONTENT MODERATION ENGINE
// ==========================================
interface SafetyCheckResult {
  isSafe: boolean;
  reason?: "mature_content" | "violence" | "gambling" | "substances" | "inappropriate";
}

const MATURE_PATTERNS = [
  /\b(porn|porno|pornography|hentai|nsfw|xxx|erotic|erotica|sex\s*chat|blowjob|handjob|dildo|vibrator|stripper|strip\s*club|onlyfans|horny|nude|nudes|nudity|naked\s*pics|dick\s*pic|penis\s*size|boobs|tits|orgasm|intercourse|masturbat\w*|cybersex|bdsm|milf|escort\s*service|sugar\s*daddy|brothel|hookup|hooking\s*up)\b/i,
  /\b(pretend to be my (girlfriend|boyfriend|lover|mistress)|erotic roleplay|sexy story|write (erotica|smut|adult content))\b/i,
  /\b(dating app|tinder hookup|sex positions?|sexual fantasy)\b/i,
];

const VIOLENCE_PATTERNS = [
  /\b(how to (make|build|assemble) (a bomb|an explosive|pipe\s*bomb|molotov|a weapon|a gun|poison))\b/i,
  /\b(how to (kill|murder|shoot|stab|choke|strangle|assassinate|torture|behead|execute)\b)/i,
  /\b(how to (commit suicide|kill myself|slit wrists?|hang myself|overdose|cut myself|self-harm)|suicide methods?|ways to end (my life|it all))\b/i,
  /\b(mass shooting|school shooting|terrorist attack|how to join a gang|snuff video|gore video|torture video)\b/i,
];

const GAMBLING_PATTERNS = [
  /\b(online casino|slot\s*machines?|sports\s*betting|bet\s*on\s*(sports|games|football|nba|ufc)|stake\.com|roobet|bovada|bet365|draftkings|fanduel|poker\s*for\s*real\s*money|real\s*money\s*(poker|blackjack|slots)|roulette\s*strategy|blackjack\s*card\s*counting|how to win (the lottery|jackpot|slots?|roulette|baccarat|mega\s*millions)|sports\s*bookie|underground\s*poker|cockfighting\s*bets?|sabong\s*betting|gambling\s*addiction\s*sites?|betting\s*odds\s*prediction\s*for\s*money)\b/i,
  /\b(how to (gamble|bet and win|hack casino|cheat at poker|rig slot))\b/i,
];

const SUBSTANCE_PATTERNS = [
  /\b(how to (make|cook|synthesize|buy|smuggle|inject) (meth|methamphetamine|cocaine|heroin|fentanyl|mdma|ecstasy|weed|crack|lsd|pcp|narcotics))\b/i,
  /\b(where to buy (illegal drugs|drugs|weed|narcotics|cocaine|vapes?|e-cig|alcohol online))\b/i,
  /\b(how to get high on (household|cough syrup|glue|paint|lean))\b/i,
  /\b(underage (drinking|smoking|vaping|buying alcohol))\b/i,
];

const INAPPROPRIATE_PATTERNS = [
  /\b(how to (hack into|steal passwords?|ddos|phish|carding|doxx|swat someone))\b/i,
];

function checkStudentSafety(text: string): SafetyCheckResult {
  if (!text || typeof text !== "string") return { isSafe: true };

  const cleanText = text.trim();

  // 1. Check mature content
  for (const pattern of MATURE_PATTERNS) {
    if (pattern.test(cleanText)) {
      return { isSafe: false, reason: "mature_content" };
    }
  }

  // 2. Check violence and self-harm
  for (const pattern of VIOLENCE_PATTERNS) {
    if (pattern.test(cleanText)) {
      return { isSafe: false, reason: "violence" };
    }
  }

  // 3. Check gambling
  for (const pattern of GAMBLING_PATTERNS) {
    if (pattern.test(cleanText)) {
      return { isSafe: false, reason: "gambling" };
    }
  }

  // 4. Check substances
  for (const pattern of SUBSTANCE_PATTERNS) {
    if (pattern.test(cleanText)) {
      return { isSafe: false, reason: "substances" };
    }
  }

  // 5. Check other malicious/inappropriate requests
  for (const pattern of INAPPROPRIATE_PATTERNS) {
    if (pattern.test(cleanText)) {
      return { isSafe: false, reason: "inappropriate" };
    }
  }

  return { isSafe: true };
}

function getSafetyRefusalResponse(reason?: string) {
  let specificNotice = "questions involving mature content, violence, gambling, or non-educational topics";
  if (reason === "mature_content") {
    specificNotice = "mature, adult, romantic, or sexually explicit content";
  } else if (reason === "violence") {
    specificNotice = "violence, weapons, self-harm, or dangerous activities";
  } else if (reason === "gambling") {
    specificNotice = "gambling, casino games, sports betting, or wagering";
  } else if (reason === "substances") {
    specificNotice = "drugs, alcohol, vaping, or illicit substances";
  } else if (reason === "inappropriate") {
    specificNotice = "cyberattacks, hacking, or harmful non-educational activities";
  }

  return {
    content: `🛡️ **Student Safety & Educational Integrity Notice**\n\nI am **RYLI**, your dedicated educational study companion. To keep our learning environment safe, respectful, and focused for all students, I do not respond to ${specificNotice}.\n\nI am built strictly for **educational and school purposes**, including:\n- 📐 **STEM & Math**: Step-by-step math problem solving, calculus, algebra, and physics\n- 📝 **Writing & English**: Essay structuring (PEEL/CER), thesis refinement, literature analysis, and grammar\n- 🧪 **Science & History**: Biology, Chemistry, Environmental Science, and World/Philippine History\n- 🗂️ **Study Tools**: Practice quizzes, flashcard active recall decks, and school schedule planning\n\n*What academic subject, homework question, or school topic would you like to explore today?*`,
    suggestedFollowUps: [
      "Help me solve a math problem step-by-step",
      "Explain a science concept with simple analogies",
      "Review my essay thesis statement",
      "Create a 4-question study quiz on biology"
    ],
  };
}

async function generateWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
) {
  const primaryModel = params.preferredModel || "gemini-3.7-flash";
  const modelsToTry = [
    primaryModel,
    ...CANDIDATE_MODELS.filter((m) => m !== primaryModel),
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const configCopy = { ...params.config };
        // thinkingConfig is supported on Gemini 3 series models
        if (!model.startsWith("gemini-3")) {
          delete configCopy.thinkingConfig;
        }

        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: configCopy,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTransient =
          errMsg.includes("503") ||
          errMsg.includes("429") ||
          errMsg.includes("high demand") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("RESOURCE_EXHAUSTED");

        if (isTransient && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }
        break; // try next candidate model in list
      }
    }
  }

  throw lastError;
}

const getSystemInstruction = (gradeLevel: string, studyMode: string, currentDateStr: string) => {
  let gradeContext = "High school student level (grades 9-12)";
  if (gradeLevel === "middle_school") gradeContext = "Middle school student level (grades 6-8), use friendly analogies, clear terms, and engaging pacing.";
  if (gradeLevel === "elementary") gradeContext = "Elementary school student (grades 3-5), keep explanations simple, positive, encouraging, and easy to read.";
  if (gradeLevel === "ap_college") gradeContext = "Advanced Placement (AP) & College level, rigorous analytical rigor, precise terminology, deep conceptual context.";

  let modeInstruction = "Act as an encouraging, knowledgeable personal tutor.";
  
  if (studyMode === "socratic") {
    modeInstruction = `CRITICAL SOCRATIC TUTOR INSTRUCTION:
- DO NOT simply give the final answer or write the complete solution right away!
- Instead, guide the student step-by-step.
- Break the problem down, explain the underlying concept, ask 1 or 2 targeted guiding questions, and invite the student to take the next step.
- Praise constructive attempts and correct misconceptions gently.`;
  } else if (studyMode === "essay_coach") {
    modeInstruction = `WRITING & ESSAY COACH INSTRUCTION:
- Help the student sharpen their writing, strengthen thesis statements, structure paragraphs (PEEL/CER format), and fix grammar or stylistic issues.
- Provide constructive critique: highlight what is working well, then point out 2-3 specific areas for improvement.
- Help generate outline frameworks, transition words, and proper citations (MLA, APA, Chicago) without doing the assignment for them.`;
  } else if (studyMode === "stem_solver") {
    modeInstruction = `STEM & MATH TUTOR INSTRUCTION:
- Format all mathematical equations and formulas cleanly using standard LaTeX notation ($...$ for inline or $$...$$ for block math).
- Always show clear, step-by-step working.
- Explain the 'Why' behind every operation, identify any potential edge cases or tricky steps to watch out for.`;
  } else if (studyMode === "summarizer") {
    modeInstruction = `STUDY NOTES SUMMARIZER INSTRUCTION:
- Transform the user's input notes or topic into a structured, high-yield study sheet.
- Include: 📌 3 Key Takeaways, 🔑 Core Definitions / Vocabulary, 💡 Mnemonics or Memory Tricks, and ❓ 2 Quick Check-For-Understanding Questions.`;
  }

  return `You are RYLI, an intelligent, empathetic, and student-safe AI learning companion created by Ryda AI, designed exclusively for educational and academic purposes in schools and classrooms worldwide.

Current Reference Date: ${currentDateStr}

STRICT STUDENT SAFETY & CONTENT POLICY (MANDATORY & NON-NEGOTIABLE):
- You MUST ONLY assist with educational, academic, school, homework, revision, and study topics.
- You are STRICTLY FORBIDDEN from answering, engaging in, or generating content for:
  1. Mature, adult, sexually explicit, dating, erotic roleplay, or NSFW topics.
  2. Violence, gore, weapons, firearms, explosives, self-harm, suicide, fighting, cruelty, or illegal actions.
  3. Gambling, casino games, slot machines, sports betting, odds wagering, or betting strategies.
  4. Tobacco, vaping, alcohol, illicit drugs, narcotics, or substance abuse.
  5. Profanity, harassment, hate speech, bullying, or non-student-appropriate materials.
- If a user prompt asks for or attempts to discuss any of the prohibited categories above, REFUSE immediately and politely in 1-2 friendly sentences. Explain that you are RYLI, an educational tutor for school subjects, and offer to help them with their math, science, history, or writing studies instead.

Target Audience & Tone:
- Audience Level: ${gradeContext}
- Primary Mode: ${modeInstruction}
- Always maintain positive, encouraging, respectful school-safe standards.
- Use clear formatting with Markdown headings, bullet points, and bold terms for readability.
- When explaining complex scientific or mathematical concepts, include relatable real-world examples.

MULTIMODAL & STUDENT ATTACHMENT INSTRUCTIONS:
- Students frequently upload photos of textbook pages, handwritten math solutions on paper, homework worksheets, science diagrams, charts, essay drafts, or PDF documents.
- When an image or document is attached:
  1. Carefully inspect and transcribe the problem statement, math formulas, equations, or questions shown in the image.
  2. Explicitly acknowledge what you see in the student's image (e.g., "Looking at your worksheet / equation on the page...").
  3. Provide complete, accurate, step-by-step guidance, formulas, explanations, or solutions appropriate for their grade level.
  4. If the image is slightly blurry or has multiple problems, identify the problems clearly (e.g. Problem #1, Problem #2) and provide structured answers.

CALENDAR & SCHEDULE DETECTION:
If the user asks to schedule, remind, save a date, log a task, deadline, homework, exam, quiz, study session, or school event (e.g. "Save a date for my science project on next Monday", "Remind me to study physics on Friday at 4pm", "Schedule math exam on Sept 15 at 9am", "Add school sports fest on Oct 12-14"):
1. Acknowledge and encourage them warmly in your response text (e.g. "I've scheduled that for you in your calendar! 📅 Here are some study tips to prepare...").
2. Compute the exact date formatted strictly as YYYY-MM-DD based on the Current Reference Date (${currentDateStr}).
3. Embed a structured block formatted exactly like this:
[CALENDAR_EVENT]
{
  "title": "Clear concise event or task title",
  "date": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD", (only if multi-day event, otherwise omit or null)
  "time": "HH:MM", (24-hour format e.g. "16:00" or "09:30", if specified, otherwise null)
  "endTime": "HH:MM", (if specified, otherwise null)
  "category": "school_event" | "assignment" | "exam" | "project" | "study_session" | "personal" | "extracurricular",
  "priority": "high" | "medium" | "low",
  "subject": "Subject name if applicable e.g. Mathematics, Science, English, etc.",
  "location": "Location if specified (e.g. Science Lab, Room 204, Gym, Online)",
  "description": "Short helpful description or preparation tip"
}
[/CALENDAR_EVENT]

At the very end of your response, provide 2 to 3 short, relevant follow-up study questions or exploration prompts for the student, formatted as:
[FOLLOWUPS]
- Question 1
- Question 2
- Question 3
[/FOLLOWUPS]`;
};

// Helper to convert any attachment (image, pdf, text file) into Gemini Part
function parseAttachmentToPart(att: any) {
  if (!att || !att.data || typeof att.data !== "string") return null;

  try {
    if (att.data.startsWith("data:")) {
      const commaIndex = att.data.indexOf(",");
      if (commaIndex === -1) return null;

      const header = att.data.substring(0, commaIndex);
      // Clean base64 string by removing all whitespace/newlines
      const base64Data = att.data.substring(commaIndex + 1).replace(/\s+/g, "");
      if (!base64Data) return null;

      const mimeMatch = header.match(/data:([^;,]+)/);
      let mimeType = mimeMatch ? mimeMatch[1].toLowerCase().trim() : (att.type || "image/jpeg").toLowerCase().trim();

      // Normalize image MIME types
      if (mimeType === "image/jpg") mimeType = "image/jpeg";

      if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
        return {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        };
      } else if (mimeType.startsWith("text/") || mimeType.includes("json") || mimeType.includes("markdown")) {
        try {
          const decodedText = Buffer.from(base64Data, "base64").toString("utf-8");
          return {
            text: `[Attached File: ${att.name || "student_notes.txt"}]\n${decodedText}\n[End of File]`,
          };
        } catch {
          return {
            inlineData: {
              mimeType: "text/plain",
              data: base64Data,
            },
          };
        }
      } else {
        // Default to image/jpeg or inline data fallback
        return {
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: base64Data,
          },
        };
      }
    }
  } catch (err) {
    console.error("Error parsing attachment to part:", err);
  }
  return null;
}

// Main Chat Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, gradeLevel = "high_school", studyMode = "study_buddy", attachments = [], currentDate } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // Safety pre-check on the latest user message
    const latestUserMessage = messages.filter((m: any) => m.role === "user").slice(-1)[0];
    if (latestUserMessage && latestUserMessage.content) {
      const safetyResult = checkStudentSafety(latestUserMessage.content);
      if (!safetyResult.isSafe) {
        const refusal = getSafetyRefusalResponse(safetyResult.reason);
        return res.json(refusal);
      }
    }

    const ai = getGeminiClient();
    const referenceDate = currentDate || new Date().toISOString().split("T")[0];
    const systemInstruction = getSystemInstruction(gradeLevel, studyMode, referenceDate);

    // Format conversation history for Gemini API
    const formattedContents: any[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const isLast = i === messages.length - 1;
      const parts: any[] = [];

      // Process attachments for this message (from msg.attachments or fallback to top-level attachments on last message)
      const msgAttachments = (msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0)
        ? msg.attachments
        : (isLast && attachments && Array.isArray(attachments) ? attachments : []);

      let hasAttachment = false;
      if (msgAttachments && msgAttachments.length > 0) {
        for (const att of msgAttachments) {
          const part = parseAttachmentToPart(att);
          if (part) {
            parts.push(part);
            hasAttachment = true;
          }
        }
      }

      // Add text content
      const textContent = (msg.content || "").trim();
      if (textContent) {
        parts.push({ text: textContent });
      } else if (hasAttachment && msg.role === "user") {
        // If the student uploaded an image/file without typing any text, give Gemini a clear prompt to inspect & solve it
        parts.push({
          text: "Please carefully analyze the attached student image/file. Transcribe and identify the homework questions, math problems, equations, diagrams, or notes shown, and provide clear, step-by-step educational explanations and answers.",
        });
      }

      if (parts.length > 0) {
        formattedContents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: parts,
        });
      }
    }

    if (formattedContents.length === 0) {
      return res.status(400).json({ error: "No valid message contents found" });
    }

    const response = await generateWithFallback(ai, {
      preferredModel: "gemini-3.7-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        temperature: studyMode === "socratic" ? 0.7 : 0.4,
      },
    });

    const rawText = response.text || "I apologize, but I could not generate a response. Please try asking again!";
    
    // Parse calendar events if present
    let cleanedText = rawText;
    const calendarEvents: any[] = [];
    const calendarEventMatches = rawText.matchAll(/\[CALENDAR_EVENT\]([\s\S]*?)\[\/CALENDAR_EVENT\]/gi);
    
    for (const match of calendarEventMatches) {
      if (match[1]) {
        try {
          const parsed = JSON.parse(match[1].trim());
          if (parsed && parsed.title && parsed.date) {
            // Check calendar event title & description for safety
            const titleSafety = checkStudentSafety(`${parsed.title} ${parsed.description || ""}`);
            if (titleSafety.isSafe) {
              calendarEvents.push({
                id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                title: parsed.title,
                date: parsed.date,
                endDate: parsed.endDate || undefined,
                time: parsed.time || undefined,
                endTime: parsed.endTime || undefined,
                category: parsed.category || "study_session",
                priority: parsed.priority || "medium",
                subject: parsed.subject || undefined,
                location: parsed.location || undefined,
                description: parsed.description || undefined,
                isCompleted: false,
                source: "ai_assistant",
                createdAt: Date.now(),
              });
            }
          }
        } catch (e) {
          console.error("Failed to parse calendar event JSON:", e);
        }
      }
    }

    cleanedText = cleanedText.replace(/\[CALENDAR_EVENT\][\s\S]*?\[\/CALENDAR_EVENT\]/gi, "").trim();

    // Parse follow-ups if present
    let followUps: string[] = [];
    const followUpMatch = cleanedText.match(/\[FOLLOWUPS\]([\s\S]*?)\[\/FOLLOWUPS\]/i);
    if (followUpMatch && followUpMatch[1]) {
      cleanedText = cleanedText.replace(/\[FOLLOWUPS\][\s\S]*?\[\/FOLLOWUPS\]/i, "").trim();
      followUps = followUpMatch[1]
        .split("\n")
        .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
        .filter((line) => line.length > 3)
        .slice(0, 3);
    }

    res.json({
      content: cleanedText,
      suggestedFollowUps: followUps,
      calendarEvents: calendarEvents.length > 0 ? calendarEvents : undefined,
    });
  } catch (err: any) {
    console.error("Chat error:", err);
    // Return friendly student recovery message if all models are momentarily unavailable
    res.status(200).json({
      content: `I am currently experiencing a brief spike in traffic from classroom study sessions. 📚\n\n**Here's how to continue:**\n- Try resending your question or breaking it into a simpler sub-question.\n- Try switching between **Socratic Guide** or **Study Buddy** mode below.`,
      suggestedFollowUps: [
        "Explain the key concept step-by-step",
        "Can you summarize this simply?",
        "Give me an example problem",
      ],
    });
  }
});

// Quick Natural Language Schedule Parser Endpoint
app.post("/api/parse-schedule", async (req, res) => {
  try {
    const { prompt, currentDate } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Safety pre-check
    const safetyCheck = checkStudentSafety(prompt);
    if (!safetyCheck.isSafe) {
      return res.status(400).json({ error: "Scheduling is only available for school and academic events." });
    }

    const referenceDate = currentDate || new Date().toISOString().split("T")[0];
    const ai = getGeminiClient();

    const response = await generateWithFallback(ai, {
      preferredModel: "gemini-3.1-flash-lite",
      contents: `Parse this student scheduling request into a structured event.
Today's date is: ${referenceDate}.
Student input: "${prompt}"

Determine the exact date (YYYY-MM-DD), time (HH:MM in 24-hr format if mentioned), category, priority, subject, and clean title.`,
      config: {
        systemInstruction: "You are a smart student calendar parsing engine. Only parse school, academic, extracurricular, and student-safe personal study events. Extract accurate dates, calculate relative terms ('tomorrow', 'this Friday', 'next week') based strictly on today's reference date, and output valid JSON matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            date: { type: Type.STRING },
            endDate: { type: Type.STRING },
            time: { type: Type.STRING },
            endTime: { type: Type.STRING },
            category: { 
              type: Type.STRING,
              enum: ["school_event", "assignment", "exam", "project", "study_session", "personal", "extracurricular"]
            },
            priority: {
              type: Type.STRING,
              enum: ["high", "medium", "low"]
            },
            subject: { type: Type.STRING },
            location: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["title", "date", "category", "priority"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    const event = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: parsedData.title || "Study Task",
      date: parsedData.date || referenceDate,
      endDate: parsedData.endDate || undefined,
      time: parsedData.time || undefined,
      endTime: parsedData.endTime || undefined,
      category: parsedData.category || "study_session",
      priority: parsedData.priority || "medium",
      subject: parsedData.subject || undefined,
      location: parsedData.location || undefined,
      description: parsedData.description || undefined,
      isCompleted: false,
      source: "ai_assistant",
      createdAt: Date.now(),
    };

    res.json({ event });
  } catch (err: any) {
    console.error("Parse schedule error:", err);
    res.status(500).json({ error: err.message || "Failed to parse schedule" });
  }
});

// Interactive Quiz Generation Endpoint
app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { topic, gradeLevel = "high_school", count = 4 } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    // Safety pre-check on quiz topic
    const safetyCheck = checkStudentSafety(topic);
    if (!safetyCheck.isSafe) {
      return res.status(400).json({ error: "Quiz topics must be educational and student-appropriate." });
    }

    const ai = getGeminiClient();
    const prompt = `Create an interactive, student-friendly ${count}-question multiple choice quiz on the educational topic: "${topic}".
Target level: ${gradeLevel}.
Make the questions educational, engaging, with one clear correct answer, 3 plausible distractors, a helpful hint, and a comprehensive explanation.`;

    const response = await generateWithFallback(ai, {
      preferredModel: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a specialized school assessment generator. Only generate educational, classroom-appropriate quizzes. Provide high quality, accurate questions formatted strictly as valid JSON according to the schema.",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
    res.json(quizData);
  } catch (err: any) {
    console.error("Quiz generation error:", err);
    res.status(500).json({ error: err.message || "Failed to generate quiz" });
  }
});

// Flashcard Generation Endpoint
app.post("/api/generate-flashcards", async (req, res) => {
  try {
    const { topic, gradeLevel = "high_school", count = 6 } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    // Safety pre-check on flashcards topic
    const safetyCheck = checkStudentSafety(topic);
    if (!safetyCheck.isSafe) {
      return res.status(400).json({ error: "Flashcard topics must be educational and student-appropriate." });
    }

    const ai = getGeminiClient();
    const prompt = `Create a deck of ${count} high-yield active recall flashcards for studying the educational topic: "${topic}".
Target level: ${gradeLevel}.
Each card must have a clear Front (question, term, or prompt), an accurate concise Back (definition, formula, or answer), and a memory Hint.`;

    const response = await generateWithFallback(ai, {
      preferredModel: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert study aid and active-recall flashcard creator for students. Only generate educational, student-safe flashcards. Always respond with strict valid JSON matching the schema.",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
    res.json(flashcardsData);
  } catch (err: any) {
    console.error("Flashcards generation error:", err);
    res.status(500).json({ error: err.message || "Failed to generate flashcards" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "RYLI by Ryda AI", version: "1.0.0" });
});

// Start Server and mount Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const isHmrDisabled = process.env.DISABLE_HMR === "true" || true;
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: !isHmrDisabled,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RYLI Student AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
