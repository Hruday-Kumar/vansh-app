/**
 * 🪷 VANSH AUDIO TRANSCRIPTION SERVICE
 * Speech-to-text for Katha recordings
 * 
 * Supports:
 * - OpenAI Whisper API (primary)
 * - Local transcription fallback (future)
 * - Multi-language support (Hindi, English, Telugu)
 */

import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================

export type TranscriptionLanguage = 'en' | 'hi' | 'te' | 'auto';

export interface TranscriptionResult {
  text: string;
  segments?: TranscriptionSegment[];
  language: string;
  duration: number;
  confidence?: number;
}

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  tokens?: number[];
  confidence?: number;
}

export interface TranscriptionProgress {
  status: 'preparing' | 'uploading' | 'transcribing' | 'processing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
}

export interface TranscriptionOptions {
  language?: TranscriptionLanguage;
  prompt?: string; // Context prompt for better accuracy
  timestamps?: boolean; // Include word-level timestamps
  onProgress?: (progress: TranscriptionProgress) => void;
}

export interface TranscriptionConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

let config: TranscriptionConfig | null = null;

const DEFAULT_CONFIG = {
  baseUrl: 'https://api.openai.com/v1',
  model: 'whisper-1',
};

// Language mapping
const LANGUAGE_MAP: Record<TranscriptionLanguage, string | undefined> = {
  en: 'english',
  hi: 'hindi',
  te: 'telugu',
  auto: undefined, // Let Whisper auto-detect
};

/**
 * Initialize the transcription service
 */
export function initializeTranscription(apiKey: string, options?: Partial<TranscriptionConfig>): void {
  config = {
    apiKey,
    baseUrl: options?.baseUrl || DEFAULT_CONFIG.baseUrl,
    model: options?.model || DEFAULT_CONFIG.model,
  };
  
  console.log('[Transcription] Service initialized');
}

/**
 * Check if transcription service is available
 */
export function isTranscriptionAvailable(): boolean {
  return config !== null && !!config.apiKey;
}

// ============================================================================
// MAIN TRANSCRIPTION FUNCTION
// ============================================================================

/**
 * Transcribe an audio file to text
 */
export async function transcribeAudio(
  audioUri: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  if (!config) {
    throw new Error('Transcription service not initialized. Call initializeTranscription first.');
  }
  
  const { language = 'auto', prompt, timestamps = true, onProgress } = options;
  
  try {
    // Update progress: preparing
    onProgress?.({
      status: 'preparing',
      progress: 10,
      message: 'Preparing audio file...',
    });
    
    // Read the audio file
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    if (!fileInfo.exists) {
      throw new Error('Audio file not found');
    }
    
    // Validate file size (Whisper has a 25MB limit)
    if (fileInfo.size && fileInfo.size > 25 * 1024 * 1024) {
      throw new Error('Audio file too large. Maximum size is 25MB.');
    }
    
    // Update progress: uploading
    onProgress?.({
      status: 'uploading',
      progress: 30,
      message: 'Uploading to transcription service...',
    });
    
    // Create form data for the API request
    const formData = new FormData();
    
    // Determine file name and type
    const fileName = audioUri.split('/').pop() || 'audio.m4a';
    const fileType = getAudioMimeType(fileName);
    
    // Append audio file - handling for both web and native
    if (Platform.OS === 'web') {
      // For web, fetch the file as blob
      const response = await fetch(audioUri);
      const blob = await response.blob();
      formData.append('file', blob, fileName);
    } else {
      // For native, use the file URI
      formData.append('file', {
        uri: audioUri,
        name: fileName,
        type: fileType,
      } as any);
    }
    
    formData.append('model', config.model || DEFAULT_CONFIG.model);
    
    // Add language if specified
    if (language !== 'auto' && LANGUAGE_MAP[language]) {
      formData.append('language', LANGUAGE_MAP[language]!);
    }
    
    // Add prompt for context
    if (prompt) {
      formData.append('prompt', prompt);
    }
    
    // Request detailed response with timestamps
    if (timestamps) {
      formData.append('response_format', 'verbose_json');
      formData.append('timestamp_granularities[]', 'segment');
    } else {
      formData.append('response_format', 'json');
    }
    
    // Update progress: transcribing
    onProgress?.({
      status: 'transcribing',
      progress: 50,
      message: 'Transcribing audio...',
    });
    
    // Make API request
    const response = await fetch(`${config.baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Transcription failed: ${response.status}`
      );
    }
    
    // Update progress: processing
    onProgress?.({
      status: 'processing',
      progress: 80,
      message: 'Processing transcription...',
    });
    
    const data = await response.json();
    
    // Parse the response
    const result: TranscriptionResult = {
      text: data.text || '',
      language: data.language || (language === 'auto' ? 'unknown' : language),
      duration: data.duration || 0,
      segments: data.segments?.map((seg: any, index: number) => ({
        id: index,
        start: seg.start,
        end: seg.end,
        text: seg.text,
        confidence: seg.confidence,
      })),
    };
    
    // Update progress: complete
    onProgress?.({
      status: 'complete',
      progress: 100,
      message: 'Transcription complete!',
    });
    
    return result;
  } catch (error) {
    onProgress?.({
      status: 'error',
      progress: 0,
      message: error instanceof Error ? error.message : 'Transcription failed',
    });
    
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get MIME type for audio file
 */
function getAudioMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    mp3: 'audio/mpeg',
    mp4: 'audio/mp4',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    webm: 'audio/webm',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
  };
  
  return mimeTypes[ext || ''] || 'audio/mpeg';
}

/**
 * Format timestamp to readable format (MM:SS)
 */
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get language name from code
 */
export function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    en: 'English',
    hi: 'Hindi',
    te: 'Telugu',
    english: 'English',
    hindi: 'Hindi',
    telugu: 'Telugu',
  };
  
  return names[code.toLowerCase()] || code;
}

// ============================================================================
// KATHA-SPECIFIC HELPERS
// ============================================================================

/**
 * Generate a context prompt for Katha transcription
 * Helps Whisper understand the context better
 */
export function generateKathaPrompt(options: {
  narratorName?: string;
  familyName?: string;
  topic?: string;
  language?: TranscriptionLanguage;
}): string {
  const parts: string[] = [];
  
  if (options.language === 'hi') {
    parts.push('यह एक पारिवारिक कथा है।');
    if (options.narratorName) {
      parts.push(`कथावाचक: ${options.narratorName}।`);
    }
    if (options.topic) {
      parts.push(`विषय: ${options.topic}।`);
    }
  } else if (options.language === 'te') {
    parts.push('ఇది కుటుంబ కథ.');
    if (options.narratorName) {
      parts.push(`కథకుడు: ${options.narratorName}.`);
    }
    if (options.topic) {
      parts.push(`అంశం: ${options.topic}.`);
    }
  } else {
    parts.push('This is a family story.');
    if (options.narratorName) {
      parts.push(`Narrator: ${options.narratorName}.`);
    }
    if (options.familyName) {
      parts.push(`Family: ${options.familyName}.`);
    }
    if (options.topic) {
      parts.push(`Topic: ${options.topic}.`);
    }
  }
  
  return parts.join(' ');
}

/**
 * Process transcription for display
 * Adds paragraph breaks based on pauses
 */
export function formatTranscriptionForDisplay(
  result: TranscriptionResult,
  options: {
    paragraphPauseThreshold?: number; // seconds
    sentencePauseThreshold?: number;
  } = {}
): string {
  const { paragraphPauseThreshold = 3, sentencePauseThreshold = 1.5 } = options;
  
  if (!result.segments || result.segments.length === 0) {
    return result.text;
  }
  
  const parts: string[] = [];
  let currentParagraph: string[] = [];
  
  for (let i = 0; i < result.segments.length; i++) {
    const segment = result.segments[i];
    const prevSegment = result.segments[i - 1];
    
    if (prevSegment) {
      const pause = segment.start - prevSegment.end;
      
      if (pause >= paragraphPauseThreshold) {
        // New paragraph
        if (currentParagraph.length > 0) {
          parts.push(currentParagraph.join(' '));
          currentParagraph = [];
        }
      }
    }
    
    currentParagraph.push(segment.text.trim());
  }
  
  // Add remaining paragraph
  if (currentParagraph.length > 0) {
    parts.push(currentParagraph.join(' '));
  }
  
  return parts.join('\n\n');
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  initializeTranscription,
  isTranscriptionAvailable,
  transcribeAudio,
  formatTimestamp,
  getLanguageName,
  generateKathaPrompt,
  formatTranscriptionForDisplay,
};
