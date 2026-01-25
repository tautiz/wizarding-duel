import { GoogleGenAI } from '@google/genai';

export interface VoiceRecognitionResult {
  success: boolean;
  name?: string;
  method: 'speech' | 'ai' | 'manual' | 'error';
  error?: string;
}

class SpeechRecognitionService {
  private recognition: any = null;
  private geminiClient: GoogleGenAI | null = null;
  private isInitialized = false;

  initialize(apiKey?: string): void {
    if (this.isInitialized) return;

    if (this.isSpeechRecognitionAvailable()) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;
      }
    }

    if (apiKey) {
      try {
        this.geminiClient = new GoogleGenAI({ apiKey });
      } catch (error) {
        console.warn('Failed to initialize Gemini client:', error);
      }
    }

    this.isInitialized = true;
  }

  async recognizeNameWithSpeech(language: 'lt-LT' | 'en-US' = 'lt-LT'): Promise<VoiceRecognitionResult> {
    if (!this.recognition) {
      return {
        success: false,
        method: 'error',
        error: 'Speech recognition not available',
      };
    }

    return new Promise((resolve) => {
      this.recognition.lang = language;

      const timeout = setTimeout(() => {
        this.recognition.stop();
        resolve({
          success: false,
          method: 'error',
          error: 'Recognition timeout',
        });
      }, 10000);

      this.recognition.onresult = (event: any) => {
        clearTimeout(timeout);
        const transcript = event.results[0][0].transcript;
        const name = this.cleanupName(transcript);
        
        resolve({
          success: true,
          name,
          method: 'speech',
        });
      };

      this.recognition.onerror = (event: any) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          method: 'error',
          error: event.error,
        });
      };

      this.recognition.onend = () => {
        clearTimeout(timeout);
      };

      try {
        this.recognition.start();
      } catch (error) {
        clearTimeout(timeout);
        resolve({
          success: false,
          method: 'error',
          error: 'Failed to start recognition',
        });
      }
    });
  }

  async recognizeNameWithAI(audioBlob: Blob): Promise<VoiceRecognitionResult> {
    if (!this.geminiClient || !this.isOnline()) {
      return {
        success: false,
        method: 'error',
        error: 'AI recognition not available',
      };
    }

    try {
      return {
        success: false,
        method: 'error',
        error: 'AI audio transcription not yet implemented',
      };
    } catch (error) {
      return {
        success: false,
        method: 'error',
        error: error instanceof Error ? error.message : 'AI recognition failed',
      };
    }
  }

  isSpeechRecognitionAvailable(): boolean {
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  private cleanupName(transcript: string): string {
    let cleaned = transcript.trim();
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    cleaned = cleaned.replace(/[^a-ząčėęįšųūž\s-]/gi, '');
    
    return cleaned;
  }

  destroy(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
      }
      this.recognition = null;
    }
    this.isInitialized = false;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
