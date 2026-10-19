import { SupportedLanguage } from '../types';
import { soundEffects } from './audioSynthesizer';

type SpeechStateCallback = (state: 'idle' | 'listening' | 'processing' | 'speaking' | 'paused' | 'error') => void;
type TranscriptCallback = (transcript: string, isFinal: boolean) => void;
type ErrorCallback = (errorMsg: string) => void;

class SpeechService {
  private recognition: any = null;
  private isListeningActive: boolean = false;
  private currentLanguage: SupportedLanguage = 'auto';
  private micStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private onStateChange: SpeechStateCallback | null = null;
  private onTranscript: TranscriptCallback | null = null;
  private onError: ErrorCallback | null = null;
  private lastSpokenText: string = '';
  private lastSpeakOptions: any = null;
  private isSpeakingPaused: boolean = false;
  private isSpeakingActive: boolean = false;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
          this.isListeningActive = true;
          this.onStateChange?.('listening');
          soundEffects.playListenStart();
        };

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            this.onTranscript?.(finalTranscript, true);
          } else if (interimTranscript) {
            this.onTranscript?.(interimTranscript, false);
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn('[JARVIS STT] Recognition error:', event.error);
          this.isListeningActive = false;
          if (event.error === 'no-speech') {
            this.onStateChange?.('idle');
            return;
          }
          let readable = 'Speech recognition issue detected.';
          if (event.error === 'not-allowed') {
            readable = 'Microphone permission was denied. Please allow microphone access in Android/browser settings.';
          } else if (event.error === 'network') {
            readable = 'Network connection dropped during speech recognition.';
          }
          this.onError?.(readable);
          this.onStateChange?.('idle');
        };

        this.recognition.onend = () => {
          this.isListeningActive = false;
          soundEffects.playListenEnd();
          this.stopMicStream();
        };
      } catch (err) {
        console.error('Failed to initialize SpeechRecognition:', err);
      }
    }
  }

  public setCallbacks(
    onState: SpeechStateCallback,
    onTranscript: TranscriptCallback,
    onError: ErrorCallback
  ) {
    this.onStateChange = onState;
    this.onTranscript = onTranscript;
    this.onError = onError;
  }

  public isSupported(): boolean {
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public async startListening(lang: SupportedLanguage = 'auto') {
    if (!this.recognition) {
      this.onError?.('Speech recognition is not supported in this browser. Please use Chrome or Android browser.');
      return;
    }

    if (this.isListeningActive) {
      this.stopListening();
      return;
    }

    // Stop any ongoing speech playback
    this.stopSpeaking();

    // Map language to BCP 47 code
    // Hindi: 'hi-IN', English: 'en-IN' (optimizes Hinglish and Indian accent detection), Auto: 'en-IN' or 'en-US'
    if (lang === 'hi') {
      this.recognition.lang = 'hi-IN';
    } else if (lang === 'hinglish') {
      this.recognition.lang = 'hi-IN'; // hi-IN parses English words exceptionally well in Hinglish context
    } else {
      this.recognition.lang = 'en-IN';
    }

    try {
      // Connect Web Audio Analyser for live visualizer
      await this.startMicStream();
      this.recognition.start();
    } catch (err: any) {
      console.warn('Recognition start exception:', err);
      // Already running or permission issue
      if (err.name !== 'InvalidStateError') {
        this.onError?.('Unable to initiate microphone uplink: ' + err.message);
      }
    }
  }

  public stopListening() {
    if (this.recognition && this.isListeningActive) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
    this.isListeningActive = false;
    this.stopMicStream();
  }

  private async startMicStream() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        this.setupAnalyser(this.micStream);
      }
    } catch (e) {
      console.warn('Could not attach analyser to mic stream:', e);
    }
  }

  private stopMicStream() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
  }

  private setupAnalyser(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      const source = this.audioCtx.createMediaStreamSource(stream);
      source.connect(this.analyser);
    } catch (err) {
      console.warn('Analyser setup error:', err);
    }
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(32);
    }
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * Speak response using either Gemini TTS or browser speech synthesis
   */
  public async speak(
    text: string,
    options: {
      engine: 'gemini_tts' | 'browser_tts';
      geminiVoice?: string;
      browserVoiceName?: string;
      rate?: number;
      pitch?: number;
      language?: SupportedLanguage;
    }
  ): Promise<void> {
    this.stopSpeaking();
    if (!text || text.trim() === '') return;

    this.lastSpokenText = text;
    this.lastSpeakOptions = { ...options };
    this.isSpeakingActive = true;
    this.isSpeakingPaused = false;
    this.onStateChange?.('speaking');

    // Clean markdown formatting before reading aloud
    const cleanText = text
      .replace(/[*_#`[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    if (options.engine === 'gemini_tts') {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanText,
            voiceName: options.geminiVoice || 'Fenrir',
            speechStyle: 'Authoritative, refined masculine British AI assistant with resonant baritone timbre, crisp articulation, confident pacing, and subtle electronic vocal harmonics',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.audio) {
            await this.playBase64Audio(data.audio);
            this.isSpeakingActive = false;
            this.isSpeakingPaused = false;
            this.onStateChange?.('idle');
            return;
          }
        }
      } catch (err) {
        console.warn('[JARVIS TTS] Gemini TTS fallback to Browser SpeechSynthesis:', err);
      }
    }

    // Fallback: Browser SpeechSynthesis
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        this.isSpeakingActive = false;
        this.isSpeakingPaused = false;
        this.onStateChange?.('idle');
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Masculine voice selection
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        let chosenVoice: SpeechSynthesisVoice | undefined;

        if (options.browserVoiceName) {
          chosenVoice = voices.find((v) => v.name === options.browserVoiceName);
        }

        if (!chosenVoice) {
          const masculineKeywords = [
            'male', 'daniel', 'george', 'oliver', 'rishi', 'david', 'james',
            'brian', 'arthur', 'guy', 'mark', 'tom', 'alex', 'fred', 'nathan',
            'google uk english male', 'microsoft george', 'microsoft david', 'microsoft mark'
          ];

          if (options.language === 'hi') {
            // Find masculine Hindi voice if available
            chosenVoice =
              voices.find((v) => v.lang.startsWith('hi') && masculineKeywords.some((k) => v.name.toLowerCase().includes(k))) ||
              voices.find((v) => v.lang.startsWith('hi'));
          } else {
            // Prioritize masculine British or English voices for quintessential JARVIS baritone
            chosenVoice =
              voices.find(
                (v) =>
                  (v.lang.includes('en-GB') || v.lang.includes('en-IN') || v.lang.includes('en-US')) &&
                  masculineKeywords.some((k) => v.name.toLowerCase().includes(k))
              ) ||
              voices.find((v) => v.lang.includes('en-GB')) ||
              voices.find((v) => v.lang.includes('en-US'));
          }
        }

        if (chosenVoice) {
          utterance.voice = chosenVoice;
        }
      }

      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch ?? 0.88; // Masculine baritone timbre

      utterance.onend = () => {
        this.isSpeakingActive = false;
        this.isSpeakingPaused = false;
        this.onStateChange?.('idle');
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis utterance error:', e);
        this.isSpeakingActive = false;
        this.isSpeakingPaused = false;
        this.onStateChange?.('idle');
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  private playBase64Audio(base64Wav: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio(`data:audio/wav;base64,${base64Wav}`);
        this.currentAudioElement = audio;

        // Try to attach analyser node
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (!this.audioCtx) {
            this.audioCtx = new AudioCtx();
          }
          if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
          }
          this.analyser = this.audioCtx.createAnalyser();
          this.analyser.fftSize = 64;
          const source = this.audioCtx.createMediaElementSource(audio);
          source.connect(this.analyser);
          this.analyser.connect(this.audioCtx.destination);
        } catch {
          // MediaElementAudioSourceNode can only be created once per element
        }

        audio.onended = () => {
          this.currentAudioElement = null;
          this.isSpeakingActive = false;
          this.isSpeakingPaused = false;
          resolve();
        };

        audio.onerror = (err) => {
          this.currentAudioElement = null;
          this.isSpeakingActive = false;
          this.isSpeakingPaused = false;
          reject(err);
        };

        audio.play().catch(reject);
      } catch (err) {
        this.isSpeakingActive = false;
        this.isSpeakingPaused = false;
        reject(err);
      }
    });
  }

  /**
   * Pause ongoing speech (Web Audio or Browser SpeechSynthesis)
   */
  public pauseSpeaking() {
    if (!this.isSpeakingActive || this.isSpeakingPaused) return;

    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
    } else if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }

    this.isSpeakingPaused = true;
    this.onStateChange?.('paused');
  }

  /**
   * Resume paused speech
   */
  public resumeSpeaking() {
    if (!this.isSpeakingPaused) return;

    if (this.currentAudioElement) {
      this.currentAudioElement.play().catch(console.warn);
    } else if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    this.isSpeakingPaused = false;
    this.onStateChange?.('speaking');
  }

  /**
   * Repeat the last assistant spoken response
   */
  public async repeatLastResponse(): Promise<void> {
    if (!this.lastSpokenText) return;
    return this.speak(this.lastSpokenText, this.lastSpeakOptions || { engine: 'browser_tts' });
  }

  public getIsSpeaking(): boolean {
    return this.isSpeakingActive;
  }

  public getIsSpeakingPaused(): boolean {
    return this.isSpeakingPaused;
  }

  public getLastSpokenText(): string {
    return this.lastSpokenText;
  }

  public stopSpeaking() {
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch (e) {
        // ignore
      }
      this.currentAudioElement = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.isSpeakingActive = false;
    this.isSpeakingPaused = false;
    this.onStateChange?.('idle');
  }

  public getAvailableBrowserVoices(): SpeechSynthesisVoice[] {
    if (!('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices();
  }
}

export const speechService = new SpeechService();
