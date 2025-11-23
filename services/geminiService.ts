
import { GoogleGenAI } from "@google/genai";
import type { GenerationParams, Presentation, Slide } from '../types';

export async function generatePresentation(params: GenerationParams): Promise<Presentation> {
  // enhanced-env-check
  let apiKey = process.env.API_KEY;
  
  if (!apiKey && typeof import.meta !== 'undefined' && (import.meta as any).env) {
    apiKey = (import.meta as any).env.VITE_API_KEY;
  }

  if (!apiKey) {
    throw new Error(
      "API Key is missing. If you are hosted on Vercel, please rename your environment variable to 'VITE_API_KEY' in the project settings and redeploy."
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const { topic, style, fileContext, slideCount } = params;

  // Enforce a hard limit on slide count for stability
  const safeSlideCount = Math.min(slideCount, 15);

  const prompt = `
    ROLE: You are an Elite Academic Professor and World-Class Information Designer (ex-McKinsey/Nature Journal).
    TASK: Create a structurally rigorous, visually stunning, and fact-dense presentation deck.
    
    INPUT CONTEXT:
    - TOPIC: "${topic}"
    - STYLE: ${style}
    - TARGET LENGTH: ${safeSlideCount} Slides
    ${fileContext ? `- SOURCE MATERIAL (CRITICAL): The user has provided a document/file. You MUST extract the EXACT structure, definitions, formulas, and key points from this text below. Do not summarize loosely; convert the actual content into slides.\n\nSOURCE TEXT START:\n${fileContext.substring(0, 30000)}\nSOURCE TEXT END.` : ''}

    ---------------------------------------------------------
    CONTENT STRATEGY (MIMIC TEXTBOOK QUALITY):
    1. **Structure**: 
       - Slide 1: Title (Impactful).
       - Slide 2: Foundations/Definitions (Etymology, Core Concept).
       - Slide 3-4: The "How" (Mechanisms, Formulas, Ratios - use 'process' or 'content' layouts).
       - Slide 5: Visual Diagram logic (Explain a diagram in bullet points).
       - Slide 6: Real World Application (Where is this used?).
       - Slide 7: Example/Case Study (Step-by-step problem solving).
       - Last Slide: Summary/References.

    2. **Depth**: 
       - NEVER use generic fluff like "Unlock the potential". 
       - ALWAYS use specific dates, names, formulas (write Math like 'a^2 + b^2 = c^2'), and hard facts.
       - If the topic is technical (Math/Science), use the 'process' slide type to show step-by-step solving.

    3. **Visuals (Crucial)**: 
       - For 'imagePrompt', do not write generic descriptions. Write EXACT instructions for a renderer.
       - Example: "A clean white background technical diagram of a right-angled triangle with sides labeled Hypotenuse, Opposite, and Adjacent, vector style, education".
       - Example: "Photorealistic 8k macro shot of a CPU silicon die, dramatic blue lighting".

    4. **Speaker Notes**: Write a script that teaches the slide, not just reads it.

    ---------------------------------------------------------
    JSON OUTPUT RULES:
    - Return ONLY valid JSON.
    - 'type' options: 'title' | 'content' | 'chart' | 'table' | 'process'.
    - 'layout' options: 'left' | 'right' | 'center' | 'split'.
    - Use 'process' type for any timeline, step-by-step guide, or logical flow.
    - Use 'chart' type if there is any numerical data mentioned.

    JSON TEMPLATE:
    {
      "title": "String",
      "author": "Lakshya Studio AI",
      "slides": [
        {
          "id": "1",
          "type": "title",
          "title": "Main Title",
          "subtitle": "Compelling Subtitle",
          "imagePrompt": "Detailed visual description",
          "speakerNotes": "Script"
        },
        {
          "id": "2",
          "type": "content",
          "title": "Headline",
          "bulletPoints": ["Fact 1", "Fact 2", "Fact 3"],
          "imagePrompt": "Diagram description",
          "layout": "split"
        },
        {
          "id": "3",
          "type": "process",
          "title": "How it Works / Steps",
          "processSteps": [
            {"title": "Step 1", "description": "Details"},
            {"title": "Step 2", "description": "Details"}
          ]
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      config: {
        maxOutputTokens: 8192, 
        responseMimeType: "application/json",
      }
    });

    let jsonString = response.text;
    
    if (!jsonString) {
       throw new Error("AI returned empty response.");
    }

    // Clean Markdown Code Blocks
    jsonString = jsonString.replace(/^```json\s*/, "").replace(/```\s*$/, "");

    try {
      const parsed = JSON.parse(jsonString);
      
      // Post-processing to ensure stability
      if (!parsed.slides || !Array.isArray(parsed.slides)) {
          throw new Error("Invalid structure");
      }

      return {
        ...parsed,
        topic,
        style
      };
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      throw new Error("The AI response was too complex to parse. Try reducing the slide count to 8.");
    }

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    throw new Error(error.message || "Failed to generate presentation.");
  }
}
