import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Square,
  Globe,
  Radio,
  Clock,
  CloudSun,
  Smartphone,
  Calculator,
  Image as ImageIcon,
  Video,
  Crosshair,
  RotateCcw,
  Pause,
  Play,
} from 'lucide-react';
import { AssistantState, SupportedLanguage, HudAccentColor } from '../types';
import { soundEffects } from '../services/audioSynthesizer';

interface InputBarProps {
  state: AssistantState;
  interimTranscript: string;
  language: SupportedLanguage;
  accentColor: HudAccentColor;
  handsFree: boolean;
  onSendMessage: (text: string) => void;
  onToggleMic: () => void;
  onToggleHandsFree: () => void;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onStop: () => void;
  onPauseSpeech?: () => void;
  onResumeSpeech?: () => void;
  onRepeatSpeech?: () => void;
  onOpenNavigationCamera?: () => void;
}

export const InputBar: React.FC<InputBarProps> = ({
  state,
  interimTranscript,
  language,
  accentColor,
  handsFree,
  onSendMessage,
  onToggleMic,
  onToggleHandsFree,
  onLanguageChange,
  onStop,
  onPauseSpeech,
  onResumeSpeech,
  onRepeatSpeech,
  onOpenNavigationCamera,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const quickPrompts = [
    { label: 'Nav Camera', prompt: '__open_nav_camera__', icon: Crosshair },
    { label: '5m Timer', prompt: 'Set a 5 minute timer', icon: Clock },
    { label: 'Weather', prompt: 'Check current weather conditions', icon: CloudSun },
    { label: 'Image Studio', prompt: 'Open AI Image Studio to generate an image', icon: ImageIcon },
    { label: 'Video Studio', prompt: 'Open AI Video Studio to create a video', icon: Video },
    { label: 'WhatsApp', prompt: 'Open WhatsApp to send message', icon: Smartphone },
    { label: 'Calculate', prompt: 'Calculate sqrt(256) * 18.5', icon: Calculator },
  ];

  return (
    <div className="w-full bg-black/70 backdrop-blur-xl border-t border-cyan-500/15 p-2 sm:p-3 space-y-2 select-none">
      {/* Interim Live Transcript Telemetry Overlay */}
      {state === 'listening' && (
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-400/40 text-cyan-200 text-xs font-mono shadow-[0_0_15px_rgba(0,240,255,0.2)] animate-pulse">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
          <span className="font-hud uppercase text-[9px] text-cyan-400 font-bold">ACOUSTIC INTAKE:</span>
          <span className="italic truncate">{interimTranscript || 'Listening for speech in English, Hindi, or Hinglish...'}</span>
        </div>
      )}

      {/* Floating Holographic Quick Suggestion Chips */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
        {quickPrompts.map((q, idx) => {
          const Icon = q.icon;
          return (
            <button
              key={idx}
              onClick={() => {
                soundEffects.playConfirm();
                if (q.prompt === '__open_nav_camera__') {
                  if (onOpenNavigationCamera) {
                    onOpenNavigationCamera();
                  } else {
                    onSendMessage('Open navigation camera');
                  }
                } else {
                  onSendMessage(q.prompt);
                }
              }}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-full border transition-all shrink-0 text-[11px] font-sans ${
                q.prompt === '__open_nav_camera__'
                  ? 'bg-cyan-950/80 border-cyan-400/60 text-cyan-300 hover:bg-cyan-900/80 shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                  : 'bg-slate-950/70 border-slate-800/80 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/35'
              }`}
            >
              <Icon className="w-3 h-3 text-cyan-400" />
              <span>{q.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Command Bar */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {/* Language Mode Selector */}
        <div className="relative group shrink-0">
          <button
            type="button"
            className="flex items-center space-x-1 px-2 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-cyan-400 text-xs font-hud"
            title="Switch Language Uplink"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="uppercase font-bold text-[9px]">{language}</span>
          </button>
          <div className="absolute bottom-full left-0 mb-1 hidden group-hover:flex flex-col bg-black/95 border border-cyan-500/30 rounded-lg p-1 shadow-2xl z-40 min-w-[125px] backdrop-blur-md">
            <button
              onClick={() => onLanguageChange('auto')}
              className={`px-2.5 py-1.5 text-left text-xs rounded hover:bg-cyan-950/60 ${language === 'auto' ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}
            >
              Auto-Detect
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1.5 text-left text-xs rounded hover:bg-cyan-950/60 ${language === 'en' ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}
            >
              English
            </button>
            <button
              onClick={() => onLanguageChange('hi')}
              className={`px-2.5 py-1.5 text-left text-xs rounded hover:bg-cyan-950/60 ${language === 'hi' ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}
            >
              हिन्दी (Hindi)
            </button>
            <button
              onClick={() => onLanguageChange('hinglish')}
              className={`px-2.5 py-1.5 text-left text-xs rounded hover:bg-cyan-950/60 ${language === 'hinglish' ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}
            >
              Hinglish
            </button>
          </div>
        </div>

        {/* Hands-Free Voice Toggle */}
        <button
          type="button"
          onClick={onToggleHandsFree}
          className={`p-2 rounded-lg border transition-colors shrink-0 text-xs ${
            handsFree
              ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
              : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          title={handsFree ? 'Hands-Free Voice Active (Continuous)' : 'Hands-Free Voice Disabled'}
        >
          <Radio className={`w-4 h-4 ${handsFree ? 'animate-pulse text-cyan-400' : ''}`} />
        </button>

        {/* Repeat Last Speech Button */}
        {onRepeatSpeech && (
          <button
            type="button"
            onClick={onRepeatSpeech}
            className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors shrink-0"
            title="Repeat Last Response"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Command Input Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex items-center space-x-1.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              state === 'listening'
                ? 'Processing spoken acoustic telemetry...'
                : language === 'hi'
                ? 'कमांड या सवाल टाइप करें...'
                : language === 'hinglish'
                ? 'Kuch bhi poochiye, timer lagao, weather check karo...'
                : 'Transmit command to J.A.R.V.I.S....'
            }
            className="w-full bg-black/70 border border-cyan-500/25 focus:border-cyan-400/80 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400/40 transition-all font-sans"
          />

          {/* Dynamic Voice State Controls (Pause, Resume, Interrupt, Send) */}
          {state === 'speaking' ? (
            <div className="flex items-center space-x-1 shrink-0">
              {onPauseSpeech && (
                <button
                  type="button"
                  onClick={onPauseSpeech}
                  className="p-2 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 hover:bg-amber-900 transition-colors"
                  title="Pause speech playback"
                >
                  <Pause className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onStop}
                className="p-2 rounded-lg bg-red-950/80 border border-red-500/50 text-red-300 hover:bg-red-900 transition-colors"
                title="Interrupt speech"
              >
                <Square className="w-4 h-4 fill-red-300" />
              </button>
            </div>
          ) : state === 'paused' ? (
            <div className="flex items-center space-x-1 shrink-0">
              {onResumeSpeech && (
                <button
                  type="button"
                  onClick={onResumeSpeech}
                  className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900 transition-colors"
                  title="Resume speech playback"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onStop}
                className="p-2 rounded-lg bg-red-950/80 border border-red-500/50 text-red-300 hover:bg-red-900 transition-colors"
                title="Cancel speech"
              >
                <Square className="w-4 h-4 fill-red-300" />
              </button>
            </div>
          ) : state === 'processing' ? (
            <button
              type="button"
              onClick={onStop}
              className="p-2 rounded-lg bg-red-950/80 border border-red-500/50 text-red-300 hover:bg-red-900 transition-colors shrink-0"
              title="Cancel processing"
            >
              <Square className="w-4 h-4 fill-red-300" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:hover:bg-cyan-600 text-black font-bold transition-all shrink-0"
              title="Transmit Command"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Push-to-Talk Arc Mic Button */}
        <button
          type="button"
          onClick={onToggleMic}
          className={`p-2 rounded-lg transition-all shrink-0 ${
            state === 'listening'
              ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(0,240,255,0.7)] animate-pulse'
              : 'bg-slate-950/80 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-950'
          }`}
          title={state === 'listening' ? 'Halt voice listening' : 'Push-to-Talk (Microphone)'}
        >
          {state === 'listening' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
