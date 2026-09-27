import { TextExtractionPort, ExtractionError } from '@drp/core';
import { GoogleGenAI, Type, Schema } from '@google/genai';

export class GoogleLlmExtractionAdapter implements TextExtractionPort {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('FATAL: GEMINI_API_KEY environment variable is required.');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async extract(text: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: `Extract disaster details from: "${text}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              locationText: { type: Type.STRING }
            },
            required: ["title", "tags", "locationText"]
          } as Schema
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error('LLM Extraction failed:', error);
      throw new ExtractionError('Failed to extract disaster details from the provided text.');
    }
  }
}
