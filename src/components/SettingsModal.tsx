import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Volume2,
  Sparkles,
  Palette,
  Shield,
  User,
  RotateCcw,
  Smartphone,
} from 'lucide-react';
import {
  AssistantSettings,
  AIPersonality,
  SupportedLanguage,
  HudAccentColor,
} from '../types';
import { speechService } from '../services/speechService';
import { soundEffects } from '../services/audioSynthesizer';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AssistantSettings;
  onUpdateSettings: (newSettings: AssistantSettings) => void;
  onReplayStartup?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onReplayStartup,
}) => {
  const [localSettings, setLocalSettings] = useState<AssistantSettings>(settings);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    setLocalSettings(settings);
    setBrowserVoices(speechService.getAvailableBrowserVoices());
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleChange = <K extends keyof AssistantSettings>(key: K, value: AssistantSettings[K]) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onUpdateSettings(updated);
  };

  const handleTestVoice = async () => {
    soundEffects.playConfirm();
    await speechService.speak('Systems online. All parameters operational, Sir.', {
      engine: localSettings.voiceEngine,
      geminiVoice: localSettings.geminiVoice,
      browserVoiceName: localSettings.browserVoiceName,
      rate: localSettings.speechRate,
      pitch: localSettings.speechPitch,
      language: localSettings.language,
    });
  };

  const accentColors: Array<{ id: HudAccentColor; label: string; border: string; bg: string }> = [
    { id: 'cyan', label: 'Blaze Cyan', border: 'border-cyan-400', bg: 'bg-cyan-500' },
    { id: 'gold', label: 'Mark 85 Gold', border: 'border-amber-400', bg: 'bg-amber-500' },
    { id: 'crimson', label: 'Crimson Protocol', border: 'border-red-500', bg: 'bg-red-500' },
    { id: 'emerald', label: 'Emerald Matrix', border: 'border-emerald-400', bg: 'bg-emerald-500' },
    { id: 'violet', label: 'Quantum Violet', border: 'border-purple-400', bg: 'bg-purple-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-950 border border-cyan-500/40 rounded-xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-[0_0_30px_rgba(0,240,255,0.2)] hud-bracket overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/30 bg-black/60">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="font-hud text-base font-bold text-cyan-300 tracking-wider">
              SETTINGS & PERSONALIZATION
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* Section: User Profile & Salutation */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-cyan-300 font-hud">
              <User className="w-4 h-4" />
              <span>USER DESIGNATION & SALUTATION</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Preferred Salutation / Name</label>
                <input
                  type="text"
                  value={localSettings.userName}
                  onChange={(e) => handleChange('userName', e.target.value)}
                  placeholder="e.g. Sir, Tony, Boss"
                  className="w-full bg-black border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Primary Language Target</label>
                <select
                  value={localSettings.language}
                  onChange={(e) => handleChange('language', e.target.value as SupportedLanguage)}
                  className="w-full bg-black border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="auto">Auto-Detect (Adaptive)</option>
                  <option value="en">English (Articulate)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="hinglish">Hinglish (Conversational)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: AI Personality Core */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-cyan-300 font-hud">
              <Sparkles className="w-4 h-4" />
              <span>AI PERSONALITY CORE</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'jarvis', title: 'Classic J.A.R.V.I.S.', desc: 'Calm, British composure, dry wit, subtle loyalty' },
                { id: 'tactical', title: 'Tactical Protocol', desc: 'Military precision, ultra-concise, zero fluff' },
                { id: 'friday', title: 'F.R.I.D.A.Y.', desc: 'Warm, quick-witted, intuitive, conversational' },
                { id: 'tech_genius', title: 'Research & Code', desc: 'Deep scientific calculations, code architecture' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleChange('personality', p.id as AIPersonality)}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    localSettings.personality === p.id
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-hud font-bold text-xs">{p.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-tight">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Voice & Speech Synthesis */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-cyan-300 font-hud">
                <Volume2 className="w-4 h-4" />
                <span>SPEECH SYNTHESIS ENGINE</span>
              </div>
              <button
                onClick={handleTestVoice}
                className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 text-[10px] font-hud"
              >
                Audition Voice
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Voice Generation Engine</label>
                <select
                  value={localSettings.voiceEngine}
                  onChange={(e) => handleChange('voiceEngine', e.target.value as any)}
                  className="w-full bg-black border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="gemini_tts">Gemini 3.8 Flash Lite TTS (Flagship High Fidelity)</option>
                  <option value="browser_tts">Browser SpeechSynthesis (Instant Local Voice)</option>
                </select>
              </div>

              {localSettings.voiceEngine === 'gemini_tts' ? (
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Prebuilt Gemini Persona Voice</label>
                  <select
                    value={localSettings.geminiVoice}
                    onChange={(e) => handleChange('geminiVoice', e.target.value)}
                    className="w-full bg-black border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Fenrir">Fenrir (Masculine Baritone - Deep, authoritative JARVIS resonance) [Default]</option>
                    <option value="Charon">Charon (Masculine Bass - Deep, calm, measured bass)</option>
                    <option value="Puck">Puck (Masculine Tenor - Crisp, energetic, articulate)</option>
                    <option value="Zephyr">Zephyr (Neutral Tenor - Articulate, British composure)</option>
                    <option value="Kore">Kore (Polite, clear, refined female tone)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Browser System Voice</label>
                  <select
                    value={localSettings.browserVoiceName}
                    onChange={(e) => handleChange('browserVoiceName', e.target.value)}
                    className="w-full bg-black border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">Default System Voice</option>
                    {browserVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Speech Rate</span>
                  <span className="font-mono text-cyan-300">{localSettings.speechRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.4"
                  step="0.05"
                  value={localSettings.speechRate}
                  onChange={(e) => handleChange('speechRate', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Pitch Level</span>
                  <span className="font-mono text-cyan-300">{localSettings.speechPitch}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.05"
                  value={localSettings.speechPitch}
                  onChange={(e) => handleChange('speechPitch', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-300">Automatically Speak Responses Aloud</span>
              <input
                type="checkbox"
                checked={localSettings.autoSpeakResponse}
                onChange={(e) => handleChange('autoSpeakResponse', e.target.checked)}
                className="w-4 h-4 accent-cyan-400"
              />
            </div>
          </div>

          {/* Section: Holographic Accent Theme */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-cyan-300 font-hud">
              <Palette className="w-4 h-4" />
              <span>HOLOGRAPHIC ACCENT THEME</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {accentColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleChange('accentColor', color.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-hud transition-colors ${
                    localSettings.accentColor === color.id
                      ? 'bg-slate-900 border-white text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${color.bg}`} />
                  <span>{color.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Features & Privacy Toggles */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-cyan-300 font-hud">
              <Shield className="w-4 h-4" />
              <span>FEATURES & PRIVACY</span>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer">
                <div>
                  <div className="text-slate-200">Google Search Grounding</div>
                  <div className="text-[10px] text-slate-400">Verifies live information via real-time web telemetry & citations</div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.enableWebSearch}
                  onChange={(e) => handleChange('enableWebSearch', e.target.checked)}
                  className="w-4 h-4 accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer">
                <div>
                  <div className="text-slate-200">Assistant Tools & Intent Dispatching</div>
                  <div className="text-[10px] text-slate-400">Enables Timers, Alarms, Reminders, Notes, and Android app launch</div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.enableTools}
                  onChange={(e) => handleChange('enableTools', e.target.checked)}
                  className="w-4 h-4 accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer">
                <div>
                  <div className="text-slate-200">Sci-Fi Procedural Audio Cues</div>
                  <div className="text-[10px] text-slate-400">Synthesizes Iron Man HUD audio beeps and listening alerts</div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.soundEffectsEnabled}
                  onChange={(e) => handleChange('soundEffectsEnabled', e.target.checked)}
                  className="w-4 h-4 accent-cyan-400"
                />
              </label>

              {/* Startup Sound Effects Toggle */}
              <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer">
                <div>
                  <div className="text-slate-200">Cinematic Startup Audio Cues</div>
                  <div className="text-[10px] text-slate-400">Power-up hum, reactor assembly pulses, and logo reveal sweeps</div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.startupSoundEnabled}
                  onChange={(e) => handleChange('startupSoundEnabled', e.target.checked)}
                  className="w-4 h-4 accent-cyan-400"
                />
              </label>

              {/* Startup Spoken Greeting Toggle */}
              <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer">
                <div>
                  <div className="text-slate-200">Startup Spoken Greeting</div>
                  <div className="text-[10px] text-slate-400">J.A.R.V.I.S. speaks: "Greetings, Sir. I am J.A.R.V.I.S." upon boot</div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.startupGreetingEnabled}
                  onChange={(e) => handleChange('startupGreetingEnabled', e.target.checked)}
                  className="w-4 h-4 accent-cyan-400"
                />
              </label>

              {/* Startup Animation Duration Slider */}
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200">Startup Sequence Duration</span>
                  <span className="text-cyan-400 font-mono font-bold">{localSettings.startupAnimationDuration || 5.0}s</span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="7.0"
                  step="0.5"
                  value={localSettings.startupAnimationDuration || 5.0}
                  onChange={(e) => handleChange('startupAnimationDuration', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>Fast (3.0s)</span>
                  <span>Cinematic (5.0s)</span>
                  <span>Extended (7.0s)</span>
                </div>
              </div>

              {/* Replay Startup Sequence Action */}
              {onReplayStartup && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playConfirm();
                      onClose();
                      onReplayStartup();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border border-cyan-400/60 hover:border-cyan-300 text-cyan-300 text-xs font-hud font-bold tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)]"
                  >
                    Replay Cinematic Startup Sequence
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Section: Mobile App Installation (PWA) */}
          <div className="space-y-2 pt-2 border-t border-cyan-500/20">
            <div className="flex items-center space-x-2 text-cyan-300 font-hud">
              <Smartphone className="w-4 h-4" />
              <span>APP INSTALLATION & STANDALONE HUD</span>
            </div>
            <PWAInstallButton variant="banner" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-cyan-500/20 bg-black/60 flex items-center justify-between">
          <button
            onClick={() => {
              const defaults: AssistantSettings = {
                userName: 'Sir',
                personality: 'jarvis',
                language: 'auto',
                accentColor: 'cyan',
                voiceEngine: 'gemini_tts',
                geminiVoice: 'Fenrir',
                browserVoiceName: '',
                speechRate: 1.0,
                speechPitch: 0.88,
                autoSpeakResponse: false,
                handsFreeMode: false,
                soundEffectsEnabled: true,
                startupSoundEnabled: true,
                startupGreetingEnabled: true,
                startupAnimationDuration: 5.0,
                memoryEnabled: true,
                enableWebSearch: false,
                enableTools: true,
              };
              setLocalSettings(defaults);
              onUpdateSettings(defaults);
              soundEffects.playConfirm();
            }}
            className="flex items-center space-x-1 text-slate-400 hover:text-cyan-300 text-[11px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playConfirm();
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-hud font-bold text-xs transition-colors"
          >
            Save & Exit
          </button>
        </div>
      </div>
    </div>
  );
};
