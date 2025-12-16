
import { GoogleGenAI } from "@google/genai";
import type { GenerationParams, Presentation, Slide, ChatMessage, AiModelId } from '../types';

// Helper to get API Key safely
const getApiKey = () => {
  let apiKey = '';
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    apiKey = (import.meta as any).env.VITE_API_KEY || (import.meta as any).env.API_KEY;
  }
  if (!apiKey && typeof process !== 'undefined' && process.env) {
    apiKey = process.env.NEXT_PUBLIC_API_KEY;
  }
  if (!apiKey && typeof process !== 'undefined' && process.env) {
    apiKey = process.env.API_KEY || process.env.REACT_APP_API_KEY;
  }
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }
  return apiKey;
};

export async function sendChatMessage(history: ChatMessage[], newMessage: string, modelId: AiModelId = 'gemini-2.5-flash'): Promise<{ text: string, images?: string[] }> {
    try {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });
        
        if (modelId === 'gemini-2.5-flash-image') {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: newMessage }] },
            });

            let text = '';
            const images: string[] = [];

            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.text) text += part.text;
                    if (part.inlineData) {
                        images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                    }
                }
            }
            return { text: text || (images.length > 0 ? "Generated Image:" : "I couldn't generate an image."), images };
        } else {
            // Convert internal history to Gemini format, filtering out image messages for text models
            const chatHistory = history
                .filter(msg => !msg.images || msg.images.length === 0)
                .map(msg => ({
                    role: msg.role,
                    parts: [{ text: msg.text }]
                }));

            const chat = ai.chats.create({
                model: modelId,
                history: chatHistory,
                config: {
                    systemInstruction: "You are 'Lakshya AI', a helpful, intelligent, and creative study assistant. You help users brainstorm study topics, outline lecture notes, and answer technical questions. Keep answers educational, concise, and professional. Use emojis! 📚🎓✏️",
                }
            });

            const result = await chat.sendMessage({ message: newMessage });
            return { text: result.text || "I'm having trouble thinking right now. 🤯" };
        }
    } catch (error: any) {
        console.error("Chat Error:", error);
        return { text: "Sorry, I encountered an error connecting to the AI. ⚠️" };
    }
}

export async function generatePresentation(params: GenerationParams): Promise<Presentation> {
  let apiKey = '';
  try {
      apiKey = getApiKey();
  } catch (e: any) {
    console.error("API Key Loader: Failed to find any API Key in environment variables.");
    throw new Error(
      "API Key is missing. \n\n" +
      "FOR VERCEL DEPLOYMENT:\n" +
      "1. Go to Project Settings > Environment Variables\n" +
      "2. Add a new variable named 'VITE_API_KEY'\n" +
      "3. Paste your Google AI Studio key as the value\n" +
      "4. Redeploy the app (System > Redeploy)"
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const { topic, style, fileContext, slideCount } = params;

  // Enforce a hard limit on slide count for stability
  const safeSlideCount = Math.min(slideCount, 15);

  const prompt = `
    ROLE: You are an Elite Professor and Educational Information Designer.
    TASK: Create a visual STUDY GUIDE / LECTURE SERIES on the topic.
    FORMAT: The content will be rendered on a ${style} surface (e.g., Blackboard with chalk, Whiteboard with marker).
    
    INPUT CONTEXT:
    - TOPIC: "${topic}"
    - STYLE: ${style}
    - TARGET LENGTH: ${safeSlideCount} Concept Boards (Slides)
    ${fileContext ? `- SOURCE MATERIAL (CRITICAL): The user has provided a document/file. You MUST extract the EXACT structure, definitions, formulas, and key points from this text below. Do not summarize loosely; convert the actual content into teaching concepts.\n\nSOURCE TEXT START:\n${fileContext.substring(0, 30000)}\nSOURCE TEXT END.` : ''}

    ---------------------------------------------------------
    CONTENT STRATEGY (EDUCATIONAL & CONCEPTUAL):
    1. **Structure**: 
       - Board 1: Topic Overview & Learning Goals (Title).
       - Board 2: Fundamental Definitions (The "What").
       - Board 3-4: Core Mechanisms/Logic (The "How"). Use 'process' or 'content' layouts.
       - Board 5: Deep Dive Diagram logic (Explain a concept that needs a drawing).
       - Board 6: Key Formulas or Data Trends (if applicable).
       - Board 7: Real World Application / Case Study.
       - Last Board: Summary Checklist.

    2. **Tone**: 
       - Act like a teacher writing on a board. 
       - Use arrows, steps, and clear, concise bullet points.
       - Avoid corporate jargon. Use academic/tutorial language.
       - For Math/Science: Write explicit equations.
       - For History/Literature: Write timelines or character maps.

    3. **Visuals (Crucial)**: 
       - The 'imagePrompt' field represents a DRAWING on the board.
       - IF Style is Blackboard: prompt should start with "Chalk drawing on blackboard, white chalk lines, sketch style..."
       - IF Style is Whiteboard: prompt should start with "Marker drawing on whiteboard, colorful marker lines, hand drawn..."
       - IF Style is Blueprint: prompt should start with "Technical blueprint schematic, white lines on blue, vector style..."
       - Example: "Chalk drawing of a cell structure with labels, simple white lines on dark background".

    4. **Speaker Notes**: Write a lecture script for the professor to say while this board is shown.

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
      "author": "Lakshya AI",
      "slides": [
        {
          "id": "1",
          "type": "title",
          "title": "Course Title",
          "subtitle": "Lesson 1: Introduction",
          "imagePrompt": "Chalk drawing of...",
          "speakerNotes": "Welcome class..."
        },
        {
          "id": "2",
          "type": "content",
          "title": "Core Concept",
          "bulletPoints": ["Definition...", "Key Principle...", "Example..."],
          "imagePrompt": "Hand drawn diagram of...",
          "layout": "split"
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
      throw new Error("The AI response was too complex to parse. Try reducing the slide count.");
    }

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    
    // Better Error Messages for User
    if (error.message.includes("403")) {
        throw new Error("API Key Invalid or Expired. Please check your Vercel Environment Variables.");
    }
    if (error.message.includes("429")) {
        throw new Error("System is busy (Quota Exceeded). Please wait 1 minute and try again.");
    }
    
    throw new Error(error.message || "Failed to generate presentation.");
  }
}
