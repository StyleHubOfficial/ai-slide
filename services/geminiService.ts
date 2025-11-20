import { GoogleGenAI } from "@google/genai";
import type { GenerationParams, Presentation, Slide } from '../types';

export async function generatePresentation(params: GenerationParams): Promise<Presentation> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { topic, style, fileContext, slideCount } = params;

  const prompt = `
    Act as a world-class high-tech presentation designer. 
    Create a detailed presentation about "${topic}".
    Style: ${style}.
    Target Slide Count: ${slideCount}.
    
    ${fileContext ? `Context from uploaded file: ${fileContext.slice(0, 2000)}...` : ''}

    Generate a valid JSON object representing the presentation. 
    The slides should vary in type to be engaging:
    - 'title': The opening slide.
    - 'content': Bullet points with a layout.
    - 'chart': A slide with data visualization (create realistic data).
    - 'table': A slide with structured data in rows/cols.
    - 'process': A step-by-step diagram flow.

    For 'chart' slides, provide numerical data and labels.
    For 'process' slides, provide 3-5 steps.
    
    Return ONLY the JSON object with this structure:
    {
      "title": "Main Presentation Title",
      "author": "Lumina AI",
      "slides": [
        {
          "id": "unique_id",
          "type": "title|content|chart|table|process",
          "title": "Slide Title",
          "subtitle": "Optional subtitle",
          "bulletPoints": ["Point 1", "Point 2"],
          "layout": "left|right|center",
          "backgroundImageKeyword": "A single keyword for finding a background image (e.g., 'technology', 'sky', 'office')",
          "chartData": { "type": "bar|line|pie", "labels": ["A", "B"], "datasets": [{ "label": "Data", "data": [10, 20] }] }, // Only if type is chart
          "tableData": { "headers": ["Col1", "Col2"], "rows": [["Val1", "Val2"]] }, // Only if type is table
          "processSteps": [{ "title": "Step 1", "description": "Desc" }] // Only if type is process
        }
      ]
    }
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

    const jsonString = response.text;
    const parsed = JSON.parse(jsonString);
    
    // Enhance with original params
    return {
      ...parsed,
      topic,
      style
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to engineer the presentation structure.");
  }
}
