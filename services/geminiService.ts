
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
    Role: Elite Presentation Strategist & Information Designer.
    Task: Create a highly detailed, fact-based, and visually captivating presentation deck.
    Topic: "${topic}".
    Style: ${style}.
    Target Slide Count: ${safeSlideCount}.
    
    ${fileContext ? `CRITICAL SOURCE MATERIAL:\n${fileContext}\n\nINSTRUCTION: You MUST base the presentation structure, facts, and content PRIMARILY on the Source Material above. Do not hallucinate facts if the source provides them. Interpret the source into professional slide content.` : 'INSTRUCTION: Generate specific, factual, and high-value content based on the topic. Avoid generic fluff.'}

    DESIGN RULES:
    1. **Content Accuracy**: Be precise. Use professional terminology. Break down complex ideas into bullet points.
    2. **Visuals**: For 'imagePrompt', write a detailed, cinematic AI image prompt (e.g., "Photorealistic 8k render of..., dramatic lighting, high tech interface") that perfectly visualizes the slide's key insight.
    3. **Speaker Notes**: Write a compelling script for the presenter to deliver, adding depth to the visual points.
    
    JSON STRUCTURE (Strictly follow this):
    {
      "title": "String (Catchy Title)",
      "author": "String (Presenter Name)",
      "slides": [
        {
          "id": "String (unique)",
          "type": "title|content|chart|table|process",
          "title": "String (Headline)",
          "subtitle": "String (Optional sub-headline)",
          "bulletPoints": ["String"],
          "imagePrompt": "String (Detailed Visual description for AI generation)",
          "speakerNotes": "String (Script)",
          "chartData": { "labels": [], "datasets": [{ "label": "", "data": [] }] },
          "tableData": { "headers": [], "rows": [] },
          "processSteps": [{ "title": "", "description": "" }]
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
      throw new Error("The AI response was incomplete. Please try reducing the slide count.");
    }

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    throw new Error(error.message || "Failed to generate presentation.");
  }
}
