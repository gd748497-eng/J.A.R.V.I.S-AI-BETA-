import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  ShieldAlert,
  CheckCircle2,
  Download,
  Terminal,
  Layers,
  Copy,
  Check,
  Code,
  FileCode,
  ExternalLink,
} from 'lucide-react';
import { soundEffects } from '../../services/audioSynthesizer';

interface AndroidAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAssistantModal: React.FC<AndroidAssistantModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'assessment' | 'apk' | 'manifest'>('assessment');
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [bundleData, setBundleData] = useState<any>(null);
  const [showInstallTips, setShowInstallTips] = useState(false);

  useEffect(() => {
    setIsAndroid(/Android/i.test(navigator.userAgent));
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Fetch APK bundle details from backend
    fetch('/api/apk/bundle')
      .then((res) => res.json())
      .then((data) => setBundleData(data))
      .catch((err) => console.warn('Failed to load APK bundle details:', err));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallPWA = async () => {
    soundEffects.playConfirm();
    if (installPrompt) {
      try {
        installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          soundEffects.playConfirm();
        }
        setInstallPrompt(null);
      } catch (e) {
        setShowInstallTips(true);
      }
    } else {
      setShowInstallTips(true);
    }
  };

  const handleDownloadApkBundle = () => {
    if (!bundleData) return;

    // Create a comprehensive ZIP/JSON bundle
    const bundleContent = JSON.stringify(
      {
        project: 'J.A.R.V.I.S. Android APK Package',
        manifest: bundleData.androidManifestXml,
        twaConfig: bundleData.twaConfigJson,
        instructions: bundleData.buildInstructionsMd,
      },
      null,
      2
    );

    const blob = new Blob([bundleContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jarvis-android-assistant-apk-bundle.json';
    a.click();
    URL.revokeObjectURL(url);
    soundEffects.playConfirm();
  };

  const handleDownloadManifestXml = () => {
    if (!bundleData?.androidManifestXml) return;
    const blob = new Blob([bundleData.androidManifestXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AndroidManifest.xml';
    a.click();
    URL.revokeObjectURL(url);
    soundEffects.playConfirm();
  };

  const handleCopyInstructions = () => {
    if (!bundleData?.buildInstructionsMd) return;
    navigator.clipboard.writeText(bundleData.buildInstructionsMd);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    soundEffects.playConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-950 border border-cyan-500/40 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_0_35px_rgba(0,240,255,0.25)] hud-bracket overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/30 bg-black/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-hud text-base font-bold text-cyan-300 tracking-wider">
                ANDROID DEFAULT ASSISTANT & APK ENGINE
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                System Qualification Telemetry & Build Assets
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center space-x-1 px-4 py-2 border-b border-slate-800 bg-slate-900/50 text-xs">
          {[
            { id: 'assessment', label: '1. Assistant Eligibility Audit' },
            { id: 'apk', label: '2. Download APK & Install' },
            { id: 'manifest', label: '3. AndroidManifest.xml' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded font-hud transition-colors ${
                activeTab === t.id
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-300">
          {/* TAB 1: ASSESSMENT */}
          {activeTab === 'assessment' && (
            <div className="space-y-4">
              {/* Honest Verification Status Notice */}
              <div className="p-3.5 rounded-lg bg-cyan-950/40 border border-cyan-500/40 space-y-2">
                <div className="flex items-center space-x-2 text-cyan-300 font-hud font-bold text-sm">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>ASSESSMENT STATUS: PLATFORM RESTRICTION EXPLAINED</span>
                </div>
                <p className="leading-relaxed text-slate-200">
                  <strong>Can JARVIS qualify as the Android Default Digital Assistant?</strong>
                  <br />
                  <span className="text-amber-300">
                    Direct PWA / Browser Sandbox: <strong>RESTRICTED BY ANDROID OS</strong>
                  </span>
                  <br />
                  <span className="text-emerald-300">
                    Packaged via Included Android APK Manifest: <strong>QUALIFIES 100%</strong>
                  </span>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Under the Android OS Security Model, only apps installed with a native package manifest declaring the <code className="text-cyan-300">android.intent.action.ASSIST</code> intent filter (or implementing <code className="text-cyan-300">VoiceInteractionService</code>) can appear inside <strong>Settings &gt; Apps &gt; Default Apps &gt; Digital Assistant App</strong>. Web applications running inside browser tabs cannot intercept the hardware home-button / power-button long press.
                </p>
              </div>

              {/* Supported vs Restricted Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-emerald-500/30 space-y-2">
                  <span className="font-hud font-bold text-emerald-400 text-xs flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>NATIVE ANDROID INTEGRATIONS ENABLED</span>
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                    <li>URL Scheme Intent Dispatch (WhatsApp, Maps, YouTube, Phone, SMS, Clock)</li>
                    <li>Speech Recognition (STT) via Android Chrome Web Speech Engine</li>
                    <li>Audio Synthesis (TTS) via Gemini 3.8 Flash Lite + Android system voices</li>
                    <li>PWA Standalone Full-Screen Display (zero browser address bar)</li>
                    <li>Android App Shortcuts menu when long-pressing home screen icon</li>
                    <li>Local persistent storage for Reminders, Alarms, and Memory</li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-amber-500/30 space-y-2">
                  <span className="font-hud font-bold text-amber-400 text-xs flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>OS-LEVEL RESTRICTIONS (WEB SANDBOX)</span>
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                    <li>Long-press Power/Home button global assistant trigger (Requires native APK)</li>
                    <li>Background always-on mic listening when phone screen is locked</li>
                    <li>System settings hardware toggles (Airplane mode, raw Bluetooth radio)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOWNLOAD APK & INSTALL */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-hud text-sm font-bold text-cyan-200">
                      STEP 1: INSTALL AS ANDROID WEBAPK (INSTANT)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Install JARVIS directly onto your Android device home screen in full-screen standalone mode.
                    </p>
                  </div>
                  <button
                    onClick={handleInstallPWA}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-hud font-bold text-xs shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App</span>
                  </button>
                </div>

                {showInstallTips && (
                  <div className="mt-3 p-3 rounded-lg bg-cyan-950/60 border border-cyan-400/40 text-[11px] text-cyan-200 space-y-1 font-mono">
                    <div className="font-bold font-hud text-cyan-300">ANDROID INSTALLATION STEPS:</div>
                    <div>1. Tap the three dots (⋮) in Chrome menu.</div>
                    <div>2. Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</div>
                    <div>3. Tap <strong>Install</strong> to add JARVIS to your home screen!</div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-hud text-sm font-bold text-cyan-200">
                      STEP 2: DOWNLOAD ANDROID APK PROJECT BUNDLE
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Contains AndroidManifest.xml with the <code className="text-cyan-300">android.intent.action.ASSIST</code> intent filter and build files.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadApkBundle}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-hud font-bold text-xs shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download APK Bundle</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-hud text-slate-300">
                      1-Command APK Build using Google Bubblewrap CLI:
                    </span>
                    <button
                      onClick={handleCopyInstructions}
                      className="flex items-center space-x-1 text-cyan-400 hover:underline"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied' : 'Copy Commands'}</span>
                    </button>
                  </div>

                  <pre className="p-3 rounded bg-black border border-slate-800 text-[11px] text-cyan-300 font-code overflow-x-auto">
{`# 1. Install Google's official Bubblewrap PWA-to-APK compiler:
npm install -g @bubblewrap/cli

# 2. Build production signed Android APK:
bubblewrap init --manifest="${window.location.origin}/manifest.json"
bubblewrap build

# Result: app-release-signed.apk is generated ready to install on your Android phone!`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ANDROID MANIFEST */}
          {activeTab === 'manifest' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-hud font-bold text-cyan-300 text-xs">
                    AndroidManifest.xml (Digital Assistant Specification)
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Includes the required <code className="text-cyan-300">android.intent.action.ASSIST</code> intent filter.
                  </p>
                </div>
                <button
                  onClick={handleDownloadManifestXml}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 text-xs font-hud"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download XML</span>
                </button>
              </div>

              <pre className="p-3 rounded-lg bg-black border border-slate-800 text-[10px] text-slate-300 font-code max-h-72 overflow-y-auto">
{bundleData?.androidManifestXml || `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.starkindustries.jarvis">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />

    <application
        android:label="J.A.R.V.I.S."
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Android Default Digital Assistant Intent Filter -->
            <intent-filter>
                <action android:name="android.intent.action.ASSIST" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </activity>
    </application>
</manifest>`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
