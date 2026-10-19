export type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking' | 'paused' | 'error';

export type SupportedLanguage = 'auto' | 'en' | 'hi' | 'hinglish';

export type AIPersonality = 'jarvis' | 'tactical' | 'friday' | 'tech_genius';

export type HudAccentColor = 'cyan' | 'gold' | 'crimson' | 'emerald' | 'violet';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ToolInvocation {
  name: string;
  args: Record<string, any>;
  id?: string;
  result?: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  language?: string;
  toolInvocations?: ToolInvocation[];
  groundingSources?: GroundingSource[];
  isSpoken?: boolean;
}

export interface AssistantTimer {
  id: string;
  label: string;
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  createdAt: number;
}

export interface AssistantAlarm {
  id: string;
  time: string; // HH:MM (24-hour)
  label: string;
  isEnabled: boolean;
}

export interface AssistantReminder {
  id: string;
  title: string;
  datetime?: string;
  priority: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  createdAt: number;
}

export interface AssistantNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SavedMemory {
  id: string;
  fact: string;
  category: 'profile' | 'preference' | 'fact' | 'instruction';
  createdAt: number;
  updatedAt: number;
}

export interface WeatherData {
  location: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  condition: string;
  weatherCode: number;
  forecast: Array<{
    date: string;
    maxTemp: number;
    minTemp: number;
    condition: string;
  }>;
}

export interface AndroidAppIntent {
  id: string;
  name: string;
  iconName: string;
  packageFallback?: string;
  schemeUrl: string;
  webFallbackUrl: string;
  description: string;
  category: 'communication' | 'navigation' | 'media' | 'system' | 'productivity';
}

export interface AssistantSettings {
  userName: string;
  personality: AIPersonality;
  language: SupportedLanguage;
  accentColor: HudAccentColor;
  voiceEngine: 'gemini_tts' | 'browser_tts';
  geminiVoice: string; // 'Zephyr', 'Fenrir', 'Puck', 'Kore', 'Charon'
  browserVoiceName: string;
  speechRate: number;
  speechPitch: number;
  autoSpeakResponse: boolean;
  handsFreeMode: boolean;
  soundEffectsEnabled: boolean;
  startupSoundEnabled: boolean;
  startupGreetingEnabled: boolean;
  startupAnimationDuration: number;
  memoryEnabled: boolean;
  enableWebSearch: boolean;
  enableTools: boolean;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  style: string;
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  imageUrl: string;
  createdAt: number;
}

export interface GeneratedVideo {
  id: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  videoUrl?: string;
  operationName?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: number;
}

export type MediaItem = 
  | ({ type: 'image' } & GeneratedImage)
  | ({ type: 'video' } & GeneratedVideo);

export interface AndroidAssistantReport {
  isAndroid: boolean;
  isStandalonePWA: boolean;
  canQualifyDefaultAssistant: boolean;
  verificationStatus: 'verified_via_native_wrapper' | 'restricted_in_browser_sandbox';
  platformExplanation: string;
  featuresSupported: string[];
  featuresRestricted: string[];
}

export interface OpticalCalibration {
  targetXPercent: number; // 0 to 100 percentage of viewport width
  targetYPercent: number; // 0 to 100 percentage of viewport height
  radius: number; // radius in pixels (min 50, max 220)
  calibratedAt: number;
  dontShowTutorialAgain: boolean;
}

export interface VisionAnalysisResult {
  analysis: string;
  timestamp: number;
  mode: 'identify' | 'ocr' | 'tactical' | 'general';
  confidence?: string;
  tags?: string[];
}

export interface NavigationWaypoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  distanceMeters?: number;
  bearingDegrees?: number;
}
