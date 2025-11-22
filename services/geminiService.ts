
import { GoogleGenAI } from "@google/genai";
import type { GenerationParams, Presentation, Slide } from '../types';

export async function generatePresentation(params: GenerationParams): Promise<Presentation> {
  // 1. Validate API Key Safe Check
  // Prioritize the key passed from the UI, then check environment variable.
  const apiKey = params.apiKey || (typeof process !== 'undefined' && process.env && process.env.API_KEY);

  if (!apiKey) {
    throw new Error("API Key is required. Please enter it in the settings or configure your environment.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const { topic, style, fileContext, slideCount } = params;

  const prompt = `
    Act as a world-class high-tech presentation designer. 
    Create a detailed presentation about "${topic}".
    Style: ${style}.
    Target Slide Count: ${slideCount}.
    
    ${fileContext ? `Context from uploaded file: ${fileContext.slice(0, 3000)}...` : ''}

    Generate a valid JSON object representing the presentation. 
    The slides should vary in type to be engaging:
    - 'title': The opening slide.
    - 'content': Bullet points with a layout.
    - 'chart': A slide with data visualization (create realistic data).
    - 'table': A slide with structured data in rows/cols.
    - 'process': A step-by-step diagram flow.

    For 'chart' slides, provide numerical data and labels.
    For 'process' slides, provide 3-5 steps.
    
    Return ONLY the JSON object with this structure. DO NOT wrap in markdown code blocks.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            author: { type: 'STRING' },
            slides: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  id: { type: 'STRING' },
                  type: { type: 'STRING', enum: ['title', 'content', 'chart', 'table', 'process'] },
                  title: { type: 'STRING' },
                  subtitle: { type: 'STRING' },
                  bulletPoints: { type: 'ARRAY', items: { type: 'STRING' } },
                  layout: { type: 'STRING' },
                  backgroundImageKeyword: { type: 'STRING' },
                  chartData: {
                    type: 'OBJECT',
                    properties: {
                      type: { type: 'STRING' },
                      labels: { type: 'ARRAY', items: { type: 'STRING' } },
                      datasets: {
                        type: 'ARRAY',
                        items: {
                          type: 'OBJECT',
                          properties: {
                            label: { type: 'STRING' },
                            data: { type: 'ARRAY', items: { type: 'NUMBER' } }
                          }
                        }
                      }
                    }
                  },
                  tableData: {
                    type: 'OBJECT',
                    properties: {
                      headers: { type: 'ARRAY', items: { type: 'STRING' } },
                      rows: { type: 'ARRAY', items: { type: 'ARRAY', items: { type: 'STRING' } } }
                    }
                  },
                  processSteps: {
                    type: 'ARRAY',
                    items: {
                      type: 'OBJECT',
                      properties: {
                        title: { type: 'STRING' },
                        description: { type: 'STRING' },
                        icon: { type: 'STRING' }
                      }
                    }
                  }
                },
                required: ['id', 'type', 'title']
              }
            }
          },
          required: ['title', 'slides']
        }
      }
    });

    let jsonString = response.text;
    
    if (!jsonString) {
       throw new Error("AI returned empty response.");
    }

    // Clean Markdown Code Blocks (common cause of JSON.parse errors)
    jsonString = jsonString.replace(/^```json\s*/, "").replace(/```\s*$/, "");

    const parsed = JSON.parse(jsonString);
    
    // Enhance with original params
    return {
      ...parsed,
      topic,
      style
    };
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    // Pass specific error message if available
    throw new Error(error.message || "Failed to engineer the presentation structure.");
  }
}
