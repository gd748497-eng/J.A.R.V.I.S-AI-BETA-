/**
 * J.A.R.V.I.S. Personal AI Assistant
 * Advanced Sci-Fi HUD Interface for Android Mobile & Web
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AssistantState,
  ChatMessage,
  AssistantSettings,
  SupportedLanguage,
} from './types';
import { Crosshair } from 'lucide-react';
import { ArcReactor } from './components/ArcReactor';
import { AudioWaveform } from './components/AudioWaveform';
import { HudHeader } from './components/HudHeader';
import { ChatView } from './components/ChatView';
import { InputBar } from './components/InputBar';
import { ToolsHubModal } from './components/tools/ToolsHubModal';
import { MemoryDashboard } from './components/MemoryDashboard';
import { SettingsModal } from './components/SettingsModal';
import { EnvironmentModal } from './components/EnvironmentModal';
import { ImageStudioModal } from './components/creative/ImageStudioModal';
import { VideoStudioModal } from './components/creative/VideoStudioModal';
import { MediaGalleryModal } from './components/creative/MediaGalleryModal';
import { AndroidAssistantModal } from './components/creative/AndroidAssistantModal';
import { NavigationCameraModal } from './components/NavigationCameraModal';
import { CinematicStartupSequence } from './components/CinematicStartupSequence';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { speechService } from './services/speechService';
import { soundEffects } from './services/audioSynthesizer';
import { memoryService } from './services/memoryService';
import { toolRegistry } from './services/toolRegistry';

const DEFAULT_SETTINGS: AssistantSettings = {
  userName: 'Sir',
  personality: 'jarvis',
  language: 'auto',
  accentColor: 'cyan',
  voiceEngine: 'gemini_tts',
  geminiVoice: 'Fenrir',
  browserVoiceName: '',
  speechRate: 1.0,
  speechPitch: 0.88,
  autoSpeakResponse: true,
  handsFreeMode: false,
  soundEffectsEnabled: true,
  startupSoundEnabled: true,
  startupGreetingEnabled: true,
  startupAnimationDuration: 5.0,
  memoryEnabled: true,
  enableWebSearch: false,
  enableTools: true,
};

export default function App() {
  const [showStartupSequence, setShowStartupSequence] = useState<boolean>(() => {
    return sessionStorage.getItem('jarvis_startup_completed') !== 'true';
  });
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg-init-1',
        role: 'model',
        text: 'J.A.R.V.I.S. neural systems initialized. All sensors online, Sir. I am ready to assist you in English, हिन्दी, or Hinglish. Tap the Arc Reactor to initiate voice uplink.',
        timestamp: Date.now(),
        language: 'en',
      },
    ];
  });
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [settings, setSettings] = useState<AssistantSettings>(() => {
    try {
      const stored = localStorage.getItem('jarvis_settings_v1');
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Modal open states
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEnvironmentOpen, setIsEnvironmentOpen] = useState(false);
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
  const [isVideoStudioOpen, setIsVideoStudioOpen] = useState(false);
  const [isMediaGalleryOpen, setIsMediaGalleryOpen] = useState(false);
  const [isAndroidAssistantOpen, setIsAndroidAssistantOpen] = useState(false);
  const [isNavigationCameraOpen, setIsNavigationCameraOpen] = useState(false);
  const [toolsInitialTab, setToolsInitialTab] = useState('timers');

  const handleOpenStudio = (type: string, _prompt?: string) => {
    soundEffects.playConfirm();
    if (type === 'video') {
      setIsVideoStudioOpen(true);
    } else if (type === 'gallery') {
      setIsMediaGalleryOpen(true);
    } else if (type === 'apk') {
      setIsAndroidAssistantOpen(true);
    } else {
      setIsImageStudioOpen(true);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, assistantState]);

  // Save settings when changed
  const handleUpdateSettings = (newSettings: AssistantSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('jarvis_settings_v1', JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  };

  // Speak response aloud using TTS
  const handleSpeakText = useCallback(
    async (text: string) => {
      try {
        await speechService.speak(text, {
          engine: settings.voiceEngine,
          geminiVoice: settings.geminiVoice,
          browserVoiceName: settings.browserVoiceName,
          rate: settings.speechRate,
          pitch: settings.speechPitch,
          language: settings.language,
        });

        // If hands-free mode is active, automatically listen for user's next command
        if (settings.handsFreeMode) {
          setTimeout(() => {
            speechService.startListening(settings.language);
          }, 600);
        }
      } catch (err) {
        console.warn('TTS playback error:', err);
      }
    },
    [settings]
  );

  // Send message to Gemini Core
  const handleSendMessage = useCallback(
    async (inputText: string) => {
      if (!inputText.trim()) return;

      // Add user message
      const userMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'user',
        text: inputText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setAssistantState('processing');
      soundEffects.playProcessingPulse();

      try {
        const memoryContext = settings.memoryEnabled ? memoryService.getContextString() : '';

        // Server API call
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: inputText,
            history: messages.slice(-8).map((m) => ({ role: m.role, text: m.text })),
            language: settings.language,
            personality: settings.personality,
            userName: settings.userName,
            memoryContext,
            enableWebSearch: settings.enableWebSearch,
            enableTools: settings.enableTools,
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const errMsg = data?.text || data?.error || `Server status: ${response.status}`;
          throw new Error(errMsg);
        }

        const executedTools: any[] = [];

        // Execute any function calls requested by the model
        if (data?.toolCalls && data.toolCalls.length > 0) {
          for (const tc of data.toolCalls) {
            try {
              const res = await toolRegistry.executeToolCall(tc.name, tc.args);
              executedTools.push({
                name: tc.name,
                args: tc.args,
                result: res,
              });
            } catch (toolErr) {
              console.error('Error executing tool:', tc.name, toolErr);
            }
          }
        }

        const modelReplyText =
          data.text ||
          (executedTools.length > 0
            ? 'Action completed according to protocol, Sir.'
            : 'Acknowledged, Sir.');

        const modelMsg: ChatMessage = {
          id: 'msg-' + Date.now(),
          role: 'model',
          text: modelReplyText,
          timestamp: Date.now(),
          language: data.detectedLanguage || settings.language,
          toolInvocations: executedTools,
          groundingSources: data.grounding?.sources || [],
        };

        setMessages((prev) => [...prev, modelMsg]);

        // Speak response if autoSpeak is enabled
        if (settings.autoSpeakResponse) {
          await handleSpeakText(modelReplyText);
        } else {
          setAssistantState('idle');
        }
      } catch (err: any) {
        console.error('Core communication error:', err);
        setAssistantState('error');
        soundEffects.playAlert();

        setMessages((prev) => [
          ...prev,
          {
            id: 'msg-' + Date.now(),
            role: 'model',
            text: `Apologies, Sir. Telemetry indicates a communication disruption: ${err.message}. All local subsystem tools remain functional.`,
            timestamp: Date.now(),
            language: 'en',
          },
        ]);

        setTimeout(() => setAssistantState('idle'), 3000);
      }
    },
    [messages, settings, handleSpeakText]
  );

  // Setup SpeechService listeners
  useEffect(() => {
    speechService.setCallbacks(
      (state) => {
        setAssistantState(state);
      },
      (transcript, isFinal) => {
        setInterimTranscript(transcript);
        if (isFinal) {
          setInterimTranscript('');
          handleSendMessage(transcript);
        }
      },
      (errorMsg) => {
        console.warn('Speech error received:', errorMsg);
        setAssistantState('idle');
      }
    );
  }, [handleSendMessage]);

  // Microphone toggle
  const handleToggleMic = () => {
    if (assistantState === 'listening') {
      speechService.stopListening();
      setAssistantState('idle');
    } else {
      speechService.startListening(settings.language);
    }
  };

  // Interrupt / Stop
  const handleStopAll = () => {
    speechService.stopSpeaking();
    speechService.stopListening();
    setAssistantState('idle');
    soundEffects.playConfirm();
  };

  // Launch Android Intent from Chat card
  const handleSelectAppIntent = (appName: string, query?: string) => {
    toolRegistry.launchAppIntent(appName, query || '');
    soundEffects.playConfirm();
  };

  const [isTelemetryExpanded, setIsTelemetryExpanded] = useState(false);

  return (
    <div className="flex flex-col h-screen w-full bg-black text-slate-100 overflow-hidden hud-grid relative select-none">
      {/* Background Holographic Scanlines & Radial Vignette */}
      <div className="absolute inset-0 pointer-events-none scanlines z-0" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)] z-0" />

      {/* Top Holographic Navigation Bar */}
      <HudHeader
        accentColor={settings.accentColor}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMemory={() => setIsMemoryOpen(true)}
        onOpenTools={() => {
          setToolsInitialTab('timers');
          setIsToolsOpen(true);
        }}
        onOpenEnvironment={() => setIsEnvironmentOpen(true)}
        onOpenImageStudio={() => setIsImageStudioOpen(true)}
        onOpenVideoStudio={() => setIsVideoStudioOpen(true)}
        onOpenGallery={() => setIsMediaGalleryOpen(true)}
        onOpenAndroidAssistant={() => setIsAndroidAssistantOpen(true)}
        onOpenNavigationCamera={() => setIsNavigationCameraOpen(true)}
        onReplayStartup={() => setShowStartupSequence(true)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto overflow-hidden relative z-10">
        {/* Top Sci-Fi Core Section: Arc Reactor & Audio Oscilloscope */}
        <div className="pt-2 pb-1 shrink-0 flex flex-col items-center justify-center relative">
          {/* Ambient Blaze Revenant HUD Telemetry Wings (Visible on lg screens) */}
          <div className="hidden lg:flex absolute left-4 top-4 flex-col space-y-1.5 text-[10px] font-mono text-slate-400 bg-black/40 border border-cyan-500/15 p-2 rounded-lg backdrop-blur-md">
            <span className="text-cyan-400 font-hud tracking-widest uppercase">BLAZE REVENANT CORE</span>
            <span>CORE TEMP: <span className="text-cyan-300">38.2°C</span></span>
            <span>NEURAL FLUX: <span className="text-cyan-300">4.2 GHz</span></span>
            <span>BANDWIDTH: <span className="text-emerald-400">10 Gbps</span></span>
          </div>

          <div className="hidden lg:flex absolute right-4 top-4 flex-col space-y-1.5 text-[10px] font-mono text-slate-400 bg-black/40 border border-cyan-500/15 p-2 rounded-lg backdrop-blur-md text-right">
            <span className="text-cyan-400 font-hud tracking-widest uppercase">SECURITY PROTOCOL</span>
            <span>DEFENSE MATRIX: <span className="text-emerald-400">ACTIVE</span></span>
            <span>MEMORY NODES: <span className="text-cyan-300">ONLINE</span></span>
            <span>TARGET: <span className="text-slate-300">ANDROID HUD</span></span>
          </div>

          {/* Center 3D Arc Reactor */}
          <ArcReactor
            state={assistantState}
            accentColor={settings.accentColor}
            onClick={handleToggleMic}
            size={isTelemetryExpanded ? 140 : 210}
          />

          {/* Audio Oscilloscope Waveform */}
          <AudioWaveform
            state={assistantState}
            accentColor={settings.accentColor}
            height={32}
          />

          {/* Home-Screen Action Row: Prominent OPEN NAVIGATION CAMERA Button & View Mode */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 px-2">
            <button
              onClick={() => {
                soundEffects.playConfirm();
                setIsNavigationCameraOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border border-cyan-400/80 text-cyan-300 hover:text-white hover:border-cyan-300 font-hud text-xs tracking-widest uppercase shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] transition-all active:scale-95"
            >
              <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="font-bold">OPEN NAVIGATION CAMERA</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playConfirm();
                setIsTelemetryExpanded(!isTelemetryExpanded);
              }}
              className="px-2.5 py-1.5 rounded-full bg-slate-950/80 border border-cyan-500/25 hover:border-cyan-400 text-[10px] font-hud text-cyan-400/80 hover:text-cyan-300 transition-colors"
            >
              {isTelemetryExpanded ? 'FOCUS ARC REACTOR' : 'EXPAND LOGS'}
            </button>
          </div>
        </div>

        {/* Center: Holographic Conversation History & Tool Telemetry */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <ChatView
            messages={messages}
            accentColor={settings.accentColor}
            userName={settings.userName}
            onSpeak={(text) => handleSpeakText(text)}
            onSelectAppIntent={handleSelectAppIntent}
            onOpenStudio={handleOpenStudio}
          />
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input & Voice Console */}
        <div className="shrink-0">
          <InputBar
            state={assistantState}
            interimTranscript={interimTranscript}
            language={settings.language}
            accentColor={settings.accentColor}
            handsFree={settings.handsFreeMode}
            onSendMessage={handleSendMessage}
            onToggleMic={handleToggleMic}
            onToggleHandsFree={() => {
              const next = !settings.handsFreeMode;
              handleUpdateSettings({ ...settings, handsFreeMode: next });
              soundEffects.playConfirm();
              if (next && assistantState === 'idle') {
                speechService.startListening(settings.language);
              }
            }}
            onLanguageChange={(lang) => {
              handleUpdateSettings({ ...settings, language: lang });
              soundEffects.playConfirm();
            }}
            onStop={handleStopAll}
            onPauseSpeech={() => speechService.pauseSpeaking()}
            onResumeSpeech={() => speechService.resumeSpeaking()}
            onRepeatSpeech={() => speechService.repeatLastResponse()}
            onOpenNavigationCamera={() => setIsNavigationCameraOpen(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <ToolsHubModal
        isOpen={isToolsOpen}
        onClose={() => setIsToolsOpen(false)}
        initialTab={toolsInitialTab}
      />

      <MemoryDashboard
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onReplayStartup={() => setShowStartupSequence(true)}
      />

      <EnvironmentModal
        isOpen={isEnvironmentOpen}
        onClose={() => setIsEnvironmentOpen(false)}
      />

      <ImageStudioModal
        isOpen={isImageStudioOpen}
        onClose={() => setIsImageStudioOpen(false)}
        onOpenGallery={() => {
          setIsImageStudioOpen(false);
          setIsMediaGalleryOpen(true);
        }}
      />

      <VideoStudioModal
        isOpen={isVideoStudioOpen}
        onClose={() => setIsVideoStudioOpen(false)}
        onOpenGallery={() => {
          setIsVideoStudioOpen(false);
          setIsMediaGalleryOpen(true);
        }}
      />

      <MediaGalleryModal
        isOpen={isMediaGalleryOpen}
        onClose={() => setIsMediaGalleryOpen(false)}
        onOpenImageStudio={() => {
          setIsMediaGalleryOpen(false);
          setIsImageStudioOpen(true);
        }}
        onOpenVideoStudio={() => {
          setIsMediaGalleryOpen(false);
          setIsVideoStudioOpen(true);
        }}
      />

      <AndroidAssistantModal
        isOpen={isAndroidAssistantOpen}
        onClose={() => setIsAndroidAssistantOpen(false)}
      />

      <NavigationCameraModal
        isOpen={isNavigationCameraOpen}
        onClose={() => setIsNavigationCameraOpen(false)}
        accentColor={settings.accentColor}
        onSendToChat={(text) => handleSendMessage(text)}
      />

      {/* Cinematic Iron Man Startup Sequence */}
      {showStartupSequence && (
        <CinematicStartupSequence
          settings={settings}
          onComplete={() => setShowStartupSequence(false)}
          onUpdateSettings={handleUpdateSettings}
        />
      )}
      {/* Offline Connectivity HUD Indicator */}
      <OfflineIndicator />
    </div>
  );
}
