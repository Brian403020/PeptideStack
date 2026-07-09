import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Express middleware
app.use(express.json());

// Lazy-initialized Gemini Client helper
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not configured in Secrets. Please configure it in your Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Route: AI Research Assistant Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format. Expected an array." });
    }

    const ai = getAiClient();
    
    // Convert client messages to Gemini content parts
    // We expect messages in format: { role: 'user'|'model', content: string }
    // We will use the chat API or a simple multi-turn generation.
    // Let's format them as contents:
    const contents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const systemInstruction = `You are a high-fidelity Peptide AI Research Assistant inside PeptideStack. 
Your objective is to provide highly accurate, objective, and safe research information about therapeutic peptides.
Peptides are strictly for laboratory research and clinical studies. Always state details scientifically.

Provide information on:
- Chemical structure and sequence (if known)
- Scientific mechanisms of action
- Standard research dosage ranges in micrograms (mcg) or milligrams (mg)
- Reconstitution guidelines (e.g. Bacteriostatic Water volumes, temperature guidelines)
- Storage best practices (refrigeration, freezing, stability)
- Potential side effects and safety considerations
- Molecular weight and half-life

Provide answers in clear, well-structured Markdown, utilizing subheadings and bullet points. Never give diagnostic or clinical medical advice, but explain research protocols, storage, and pharmacology with maximum clarity.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ content: response.text });
  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    res.status(500).json({ error: error.message || "Failed to communicate with AI Assistant." });
  }
});

// API Route: AI Stack Analyzer
app.post("/api/analyze-stack", async (req, res) => {
  try {
    const { stack } = req.body;
    if (!stack || !stack.peptides || !Array.isArray(stack.peptides)) {
      return res.status(400).json({ error: "Invalid stack data. Expected a stack object with peptides." });
    }

    const ai = getAiClient();

    const prompt = `Analyze the following research peptide stack and provide a detailed scientific evaluation.
Stack Name: "${stack.name}"
Description: "${stack.description || 'No description provided.'}"

Peptides in Stack:
${stack.peptides.map((p: any, idx: number) => `
${idx + 1}. Peptide: ${p.name}
   - Vial Size: ${p.vialSizeMg} mg
   - Reconstitution: ${p.bacWaterMl} mL Bacteriostatic Water
   - Planned Dosage: ${p.dosageMcg} mcg (${p.calculatedUnits} Units / ${p.calculatedTicks} Ticks in a ${p.syringeSize} Units syringe)
   - Schedule: ${p.scheduleType} (Days: ${p.customDays ? p.customDays.join(", ") : "N/A"})
   - Times: ${p.timesOfDay ? p.timesOfDay.join(", ") : "N/A"}
`).join("\n")}

Please write a comprehensive, publication-grade Scientific Stack Analysis Report in Markdown with the following structured sections:
1. **Executive Summary**: Overview of the stack's research theme and overall feasibility.
2. **Pathways & Synergy**: Detail how these peptides interact at the cellular level. Highlight any metabolic or tissue-repair synergies (e.g., GH secretion combinations like CJC-1295 + Ipamorelin, or healing pairs like BPC-157 + TB-500).
3. **Protocol & Schedule Evaluation**: Assess the injection timing and frequency. Note if GHRHs/GHRPs are correctly scheduled on empty stomach (2 hours post-meal, 30 min pre-meal) and other scheduling optimizations.
4. **Reconstitution & Dosage Calibration Checks**: Verify if reconstitution concentrations are safe and standard, and whether the calculated syringe units are standard research dosages.
5. **Precautions, Half-Lives & Safe Cycle Durations**: Detail the estimated half-lives of each agent, necessary off-cycle/resting periods (e.g. 5 days on / 2 days off, 8-12 week maximum cycle lengths), and critical scientific precautions or side effects.

Do not use conversational fluff. Write in a precise, professional, objective laboratory tone.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
      }
    });

    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error("Gemini Stack Analyzer Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate stack analysis." });
  }
});

// Serve frontend with Vite middleware or static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
