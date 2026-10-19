import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  CheckCircle2,
  X,
  Share,
  PlusSquare,
  Sparkles,
  Monitor,
  Shield,
  Zap,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { soundEffects } from '../services/audioSynthesizer';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'android' | 'ios' | 'desktop'>(
    isIOS ? 'ios' : isAndroid ? 'android' : 'android'
  );

  const handleInstallClick = async () => {
    soundEffects.playConfirm();
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  // If already running in standalone PWA window, render a subtle status tag or hide
  if (isInstalled && variant === 'compact') {
    return (
      <div className={`flex items-center space-x-1.5 px-2 py-1 rounded bg-cyan-950/40 border border-cyan-500/20 text-[10px] font-mono text-cyan-400 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
        <span className="font-hud tracking-wider hidden sm:inline">STANDALONE APP ACTIVE</span>
        <span className="font-hud tracking-wider sm:hidden">APP ACTIVE</span>
      </div>
    );
  }

  return (
    <>
      {variant === 'banner' ? (
        <div className={`p-3 rounded-lg bg-gradient-to-r from-cyan-950/80 via-slate-900/90 to-blue-950/80 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.2)] flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center space-x-3 text-left">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <Smartphone className="w-5 h-5 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-hud text-xs sm:text-sm font-bold text-cyan-200 tracking-wide">
                  INSTALL J.A.R.V.I.S. AS NATIVE APP
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono">
                  PWA // STANDALONE
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                Run fullscreen on Android or iOS home screen with offline capability & zero browser bars.
              </p>
            </div>
          </div>

          <button
            onClick={handleInstallClick}
            className="w-full sm:w-auto px-4 py-2 rounded bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-hud font-bold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 shadow-[0_0_14px_rgba(6,182,212,0.4)] active:scale-95 transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{isInstallable ? 'Install Now' : 'Add to Home Screen'}</span>
          </button>
        </div>
      ) : variant === 'full' ? (
        <button
          onClick={handleInstallClick}
          className={`flex items-center justify-center space-x-2 w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-black font-hud font-bold text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all active:scale-98 ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>{isInstallable ? 'Install J.A.R.V.I.S. App' : 'Add App to Device'}</span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded bg-cyan-950/70 border border-cyan-400/60 hover:border-cyan-300 text-cyan-300 hover:text-white transition-all text-xs font-hud shadow-[0_0_10px_rgba(6,182,212,0.25)] active:scale-95 ${className}`}
          title="Install J.A.R.V.I.S. as a native mobile app on your home screen"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="font-bold tracking-wider">Install App</span>
        </button>
      )}

      {/* Guided Installation Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-950 border border-cyan-500/40 p-5 shadow-[0_0_30px_rgba(6,182,212,0.3)] relative text-slate-200 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-cyan-300" />
                </div>
                <div>
                  <h3 className="font-hud text-sm font-bold tracking-wider text-cyan-300 uppercase">
                    Install J.A.R.V.I.S. App
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    BLAZE REVENANT // NEURAL CORE CLIENT
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-md bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-cyan-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Direct 1-Click Install if supported */}
            {isInstallable && (
              <div className="mb-4 p-3 rounded-xl bg-cyan-950/50 border border-cyan-400/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-hud font-bold text-cyan-300 block">
                    Instant 1-Click Install Ready
                  </span>
                  <span className="text-[11px] text-slate-300">
                    Chrome detected native app installation capability.
                  </span>
                </div>
                <button
                  onClick={async () => {
                    const done = await install();
                    if (done) setShowGuideModal(false);
                  }}
                  className="px-3 py-1.5 rounded bg-cyan-400 text-black font-hud text-xs font-bold hover:bg-cyan-300 shadow-[0_0_10px_#22d3ee] transition-all"
                >
                  Install Now
                </button>
              </div>
            )}

            {/* Device Tabs */}
            <div className="flex rounded-lg bg-slate-900/80 border border-slate-800 p-1 mb-4">
              <button
                onClick={() => {
                  soundEffects.playConfirm();
                  setActiveGuideTab('android');
                }}
                className={`flex-1 py-1.5 text-xs font-hud rounded-md transition-all flex items-center justify-center space-x-1.5 ${
                  activeGuideTab === 'android'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>

              <button
                onClick={() => {
                  soundEffects.playConfirm();
                  setActiveGuideTab('ios');
                }}
                className={`flex-1 py-1.5 text-xs font-hud rounded-md transition-all flex items-center justify-center space-x-1.5 ${
                  activeGuideTab === 'ios'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Share className="w-3.5 h-3.5" />
                <span>iOS / Safari</span>
              </button>

              <button
                onClick={() => {
                  soundEffects.playConfirm();
                  setActiveGuideTab('desktop');
                }}
                className={`flex-1 py-1.5 text-xs font-hud rounded-md transition-all flex items-center justify-center space-x-1.5 ${
                  activeGuideTab === 'desktop'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
            </div>

            {/* Tab Instructions */}
            <div className="space-y-3 text-xs">
              {activeGuideTab === 'android' && (
                <div className="p-3.5 rounded-xl bg-slate-900/50 border border-cyan-500/20 space-y-2.5">
                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-400/50 text-cyan-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span className="text-slate-200">
                      Open in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on your Android phone.
                    </span>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-400/50 text-cyan-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span className="text-slate-200">
                      Tap the <strong>three dots menu (⋮)</strong> in the top-right corner of Chrome.
                    </span>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-400/50 text-cyan-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span className="text-slate-200">
                      Tap <strong>Install app</strong> or <strong>Add to Home Screen</strong>.
                    </span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-cyan-400/80 font-mono">
                    ✓ Fullscreen Iron Man HUD without URL bar<br />
                    ✓ High-res Arc Reactor launcher icon<br />
                    ✓ Offline caching enabled via Service Worker
                  </div>
                </div>
              )}

              {activeGuideTab === 'ios' && (
                <div className="p-3.5 rounded-xl bg-slate-900/50 border border-cyan-500/20 space-y-2.5">
                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-400/50 text-cyan-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span className="text-slate-200">
                      Open this URL in <strong>Safari</strong> on your iPhone or iPad.
                    </span>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-400/50 text-cyan-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span className="text-slate-200">
                      Tap the <strong>Share</strong> button (box with an arrow pointing up) in the bottom toolbar.
                    </span>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-400/50 text-cyan-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span className="text-slate-200">
                      Scroll down and select <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
                    </span>
                  </div>
                </div>
              )}

              {activeGuideTab === 'desktop' && (
                <div className="p-3.5 rounded-xl bg-slate-900/50 border border-cyan-500/20 space-y-2.5">
                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-400/50 text-cyan-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span className="text-slate-200">
                      Look at the right side of your browser address bar in Chrome or Edge.
                    </span>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-400/50 text-cyan-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span className="text-slate-200">
                      Click the <strong>Install</strong> icon (computer monitor with down arrow).
                    </span>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-400/50 text-cyan-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span className="text-slate-200">
                      Click <strong>Install</strong> to launch J.A.R.V.I.S. in a standalone desktop window.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Features & Close */}
            <div className="mt-4 pt-3 border-t border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>PWA Specification 2026 Compliant</span>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-hud transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
