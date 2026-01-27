/**
 * 🪷 GEMINI AI SERVICE
 * Google Gemini integration for AI features
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not set. AI features will be limited.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
  
  /**
   * Analyze an image for objects, faces, and description
   */
  async analyzeImage(imagePath: string): Promise<{
    description: string;
    objects: string[];
    suggestedTags: string[];
  }> {
    try {
      // Read image file
      const fullPath = path.join(process.cwd(), imagePath);
      
      if (!fs.existsSync(fullPath)) {
        // Return placeholder for demo if file doesn't exist
        return {
          description: 'A cherished family photograph capturing a special moment.',
          objects: ['people', 'indoor', 'gathering'],
          suggestedTags: ['family', 'memory', 'heritage']
        };
      }
      
      const imageData = fs.readFileSync(fullPath);
      const base64Image = imageData.toString('base64');
      const mimeType = this.getMimeType(imagePath);
      
      const prompt = `Analyze this family photograph and provide:
1. A warm, nostalgic description of what you see (2-3 sentences)
2. List of objects/elements visible in the image
3. Suggested tags for organizing this memory

Respond in JSON format:
{
  "description": "...",
  "objects": ["..."],
  "suggestedTags": ["..."]
}`;
      
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType,
            data: base64Image
          }
        }
      ]);
      
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        description: response,
        objects: [],
        suggestedTags: []
      };
    } catch (error) {
      console.error('Gemini image analysis error:', error);
      return {
        description: 'A precious family memory.',
        objects: [],
        suggestedTags: ['family']
      };
    }
  }
  
  /**
   * Transcribe and analyze audio
   */
  async transcribeAudio(audioPath: string, language: string = 'en'): Promise<{
    text: string;
    segments: Array<{ text: string; start: number; end: number }>;
    summary: string;
    topics: string[];
  }> {
    try {
      // Note: Gemini doesn't directly transcribe audio in all cases
      // For production, you'd use a dedicated speech-to-text service
      // This is a placeholder that would work with Gemini's multimodal capabilities
      
      const fullPath = path.join(process.cwd(), audioPath);
      
      if (!fs.existsSync(fullPath)) {
        return {
          text: 'Audio transcription will be available when the audio file is processed.',
          segments: [],
          summary: 'A family story shared through voice.',
          topics: ['family', 'heritage']
        };
      }
      
      // For actual audio transcription, integrate with Google Speech-to-Text
      // or wait for Gemini's audio capabilities to expand
      
      return {
        text: 'Audio transcription pending...',
        segments: [],
        summary: 'A family story waiting to be transcribed.',
        topics: ['family', 'story']
      };
    } catch (error) {
      console.error('Gemini audio transcription error:', error);
      return {
        text: '',
        segments: [],
        summary: '',
        topics: []
      };
    }
  }
  
  /**
   * Generate a summary of text content
   */
  async summarizeText(text: string): Promise<string> {
    try {
      const prompt = `Summarize this family story or message in a warm, respectful tone (2-3 sentences):

${text}`;
      
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Gemini summarization error:', error);
      return '';
    }
  }
  
  /**
   * Generate a Digital Echo response (AI persona based on family member's style)
   */
  async generateEchoResponse(
    context: {
      memberName: string;
      memberBio: string;
      sampleMessages: string[];
      relationship: string;
    },
    userMessage: string
  ): Promise<string> {
    try {
      const prompt = `You are helping create a Digital Echo - a respectful AI representation of a family elder named ${context.memberName}.

Background about ${context.memberName}:
${context.memberBio}

Their relationship to the user: ${context.relationship}

Sample messages they've written:
${context.sampleMessages.map((m, i) => `${i + 1}. "${m}"`).join('\n')}

The family member is asking: "${userMessage}"

Generate a warm, wisdom-filled response as ${context.memberName} would have spoken. Be loving, wise, and true to their personality. Keep it concise (2-3 sentences).`;
      
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Gemini echo generation error:', error);
      return 'I am always with you in spirit, my dear. Remember the love that binds our family together.';
    }
  }
  
  /**
   * Extract topics and emotions from text
   */
  async analyzeContent(text: string): Promise<{
    topics: string[];
    emotions: Array<{ emotion: string; intensity: number }>;
    sentiment: 'positive' | 'neutral' | 'negative';
  }> {
    try {
      const prompt = `Analyze this family content for topics and emotions. Be culturally sensitive.

Text: "${text}"

Respond in JSON:
{
  "topics": ["topic1", "topic2"],
  "emotions": [{"emotion": "love", "intensity": 0.9}],
  "sentiment": "positive"
}`;
      
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        topics: [],
        emotions: [],
        sentiment: 'neutral'
      };
    } catch (error) {
      console.error('Gemini content analysis error:', error);
      return {
        topics: [],
        emotions: [],
        sentiment: 'neutral'
      };
    }
  }
  
  /**
   * Suggest era/time period for a photo based on visual cues
   */
  async suggestEra(imagePath: string): Promise<{
    estimatedYear: number;
    eraName: string;
    confidence: number;
  }> {
    try {
      const fullPath = path.join(process.cwd(), imagePath);
      
      if (!fs.existsSync(fullPath)) {
        return {
          estimatedYear: new Date().getFullYear(),
          eraName: 'Modern Era',
          confidence: 0.5
        };
      }
      
      const imageData = fs.readFileSync(fullPath);
      const base64Image = imageData.toString('base64');
      const mimeType = this.getMimeType(imagePath);
      
      const prompt = `Analyze this photograph and estimate when it was taken based on:
- Clothing styles
- Photo quality/format
- Technology visible
- Hairstyles
- Background elements

Respond in JSON:
{
  "estimatedYear": 1985,
  "eraName": "1980s Era",
  "confidence": 0.7
}`;
      
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType,
            data: base64Image
          }
        }
      ]);
      
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        estimatedYear: new Date().getFullYear(),
        eraName: 'Unknown Era',
        confidence: 0.3
      };
    } catch (error) {
      console.error('Gemini era suggestion error:', error);
      return {
        estimatedYear: new Date().getFullYear(),
        eraName: 'Unknown',
        confidence: 0
      };
    }
  }
  
  /**
   * Generate recipe steps from ingredients list
   */
  async generateRecipeSteps(
    recipeName: string,
    ingredients: string[],
    cuisineType: string = 'Indian'
  ): Promise<string[]> {
    try {
      const prompt = `Generate traditional ${cuisineType} cooking steps for "${recipeName}" using these ingredients:
${ingredients.join(', ')}

Provide step-by-step instructions that a home cook could follow. Include traditional techniques and tips.

Respond as a JSON array of steps:
["Step 1: ...", "Step 2: ...", ...]`;
      
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return ['Follow traditional family recipe methods.'];
    } catch (error) {
      console.error('Gemini recipe generation error:', error);
      return [];
    }
  }
  
  // Helper to get MIME type
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

export const geminiService = new GeminiService();
