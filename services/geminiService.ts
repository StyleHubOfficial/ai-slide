
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
                    systemInstruction: "You are 'Lakshya AI', a helpful, intelligent, and creative presentation assistant. You help users brainstorm topics, outline slides, and answer technical questions about presentations. Keep answers concise, professional, and ALWAYS use relevant emojis to make the conversation friendly and engaging! 🤖✨🚀",
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
       - If the topic is technical (Math/Science), use the 'process' type to show step-by-step solving.

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