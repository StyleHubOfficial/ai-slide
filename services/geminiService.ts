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
  const safeSlideCount = Math.min(slideCount, 12);

  const prompt = `
    Act as a world-class high-tech presentation designer. 
    Create a detailed presentation about "${topic}".
    Style: ${style}.
    Target Slide Count: ${safeSlideCount}.
    
    ${fileContext ? `Context from uploaded file: ${fileContext.slice(0, 3000)}...` : ''}

    Generate a valid JSON object representing the presentation. 
    For each slide, generate an 'imagePrompt' that describes a cinematic, high-quality, abstract or literal visual background/illustration for that slide. The image prompt should be optimized for an AI image generator (e.g., "futuristic glowing data nodes, neon blue and purple, 8k render, cinematic lighting").

    CRITICAL OUTPUT CONSTRAINTS (To prevent JSON truncation):
    1. **Speaker Notes**: Max 2 short sentences per slide.
    2. **Bullet Points**: Max 4 items per slide. Max 10 words per item.
    3. **Process Steps**: Max 4 steps.
    4. **Chart Data**: Max 5 data points.
    5. **Process**: Keep descriptions under 15 words.
    6. **Image Prompts**: Keep under 20 words.
    
    Return ONLY the JSON object with this structure:
    {
      "title": "String",
      "author": "String",
      "slides": [
        {
          "id": "String",
          "type": "title|content|chart|table|process",
          "title": "String",
          "subtitle": "String (optional)",
          "bulletPoints": ["String"],
          "imagePrompt": "String (AI visual description)",
          "speakerNotes": "String",
          "chartData": { "labels": [], "datasets": [{ "label": "", "data": [] }] },
          "tableData": { "headers": [], "rows": [] },
          "processSteps": [{ "title": "", "description": "" }]
        }
      ]
    }
    
    DO NOT wrap in markdown code blocks. Just raw JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      config: {
        // Maximize output tokens to prevent cut-off
        maxOutputTokens: 8192, 
        responseMimeType: "application/json",
      }
    });

    let jsonString = response.text;
    
    if (!jsonString) {
       throw new Error("AI returned empty response.");
    }

    // Clean Markdown Code Blocks (just in case)
    jsonString = jsonString.replace(/^```json\s*/, "").replace(/```\s*$/, "");

    try {
      const parsed = JSON.parse(jsonString);
      return {
        ...parsed,
        topic,
        style
      };
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Raw JSON string length:", jsonString.length);
      throw new Error("The presentation was too complex for the AI to finish. Please try reducing the slide count (e.g. to 5) or simplifying the topic.");
    }

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    throw new Error(error.message || "Failed to engineer the presentation structure.");
  }
}