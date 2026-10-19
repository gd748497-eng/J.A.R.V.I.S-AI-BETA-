import React from 'react';
import {
  X,
  Smartphone,
  ShieldAlert,
  CheckCircle,
  Cpu,
  Layers,
  Terminal,
  ExternalLink,
} from 'lucide-react';

interface EnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnvironmentModal: React.FC<EnvironmentModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-950 border border-cyan-500/40 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_0_30px_rgba(0,240,255,0.2)] hud-bracket overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/30 bg-black/60">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="font-hud text-base font-bold text-cyan-300 tracking-wider">
              ENVIRONMENT & ARCHITECTURE REPORT
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-300">
          {/* Executive Assessment */}
          <div className="p-3.5 rounded-lg bg-cyan-950/30 border border-cyan-500/40 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-300 font-hud font-bold text-sm">
              <Smartphone className="w-4 h-4" />
              <span>ENVIRONMENT ASSESSMENT: FULL-STACK ANDROID-OPTIMIZED PWA</span>
            </div>
            <p className="leading-relaxed">
              <strong>Environment Architecture:</strong> The current execution environment provides a Node.js / Linux container with an Express server, Vite, React 19, and full-stack capabilities. It does not contain an Android SDK / Gradle build daemon to compile raw native <code className="text-cyan-300">.apk</code> binaries directly in this container.
            </p>
            <p className="leading-relaxed">
              <strong>Best Supported Approach:</strong> A mobile-first, Android-targeted Progressive Web Application (PWA) with native Android Intent protocol support (`intent:`, `whatsapp:`, `vnd.youtube:`, `geo:`, `tel:`, `mailto:`), responsive touch HUD viewport, Web Audio API frequency analysis, Web Speech API speech-to-text, and secure server-side Gemini 3.8 Flash orchestration.
            </p>
          </div>

          {/* Android Native vs Web Capability Matrix */}
          <div className="space-y-2">
            <span className="font-hud text-cyan-300 uppercase tracking-wider block">
              Capability & Limitation Matrix
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-3 rounded bg-slate-900/80 border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-hud font-bold text-[11px]">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>SUPPORTED & OPERATIONAL</span>
                </div>
                <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                  <li>Real-time Gemini 3.8 Flash model calling</li>
                  <li>Real Google Search Grounding with citations</li>
                  <li>Gemini 3.8 Flash Lite TTS + Browser voice</li>
                  <li>Multilingual STT (Hindi, English, Hinglish)</li>
                  <li>Persistent Long-Term Memory with import/export</li>
                  <li>Android App Intent dispatch via URL schemes</li>
                  <li>Real-time Live Weather via Open-Meteo telemetry</li>
                  <li>Timers, Alarms, Reminders, Notes, Math evaluator</li>
                  <li>Reactive Arc Reactor & Audio Oscilloscope</li>
                </ul>
              </div>

              <div className="p-3 rounded bg-slate-900/80 border border-amber-500/30 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-amber-400 font-hud font-bold text-[11px]">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>SANDBOX LIMITATIONS</span>
                </div>
                <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                  <li>Direct Android APK compilation (requires external Android Studio / Gradle wrapper)</li>
                  <li>Low-level hardware toggles (e.g. physical Bluetooth radio, root volume control) restricted by browser sandbox</li>
                  <li>Always-listening hardware wake word when app is killed (requires native Android Foreground Service)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Android Installation Guide */}
          <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center space-x-2 text-cyan-300 font-hud font-bold">
              <Layers className="w-4 h-4" />
              <span>INSTALLING ON ANDROID AS A STANDALONE APP</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
              <li>Open this app's URL in <strong>Google Chrome</strong> on your Android device.</li>
              <li>Tap the three dots menu (<strong>⋮</strong>) in the top-right corner.</li>
              <li>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</li>
              <li>JARVIS will launch as a full-screen, standalone application with no browser URL bar!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-cyan-500/20 bg-black/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-hud font-bold text-xs transition-colors"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
