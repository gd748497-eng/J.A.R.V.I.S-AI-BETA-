import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Volume2,
  VolumeX,
  Sliders,
  Database,
  Cpu,
  Info,
  Crosshair,
  Image as ImageIcon,
  Video,
  Layers,
  Smartphone,
  Shield,
  Activity,
} from 'lucide-react';
import { HudAccentColor } from '../types';
import { soundEffects } from '../services/audioSynthesizer';
import { PWAInstallButton } from './PWAInstallButton';

interface HudHeaderProps {
  accentColor: HudAccentColor;
  onOpenSettings: () => void;
  onOpenMemory: () => void;
  onOpenTools: () => void;
  onOpenEnvironment: () => void;
  onOpenImageStudio: () => void;
  onOpenVideoStudio: () => void;
  onOpenGallery: () => void;
  onOpenAndroidAssistant: () => void;
  onOpenNavigationCamera: () => void;
  onReplayStartup?: () => void;
}

export const HudHeader: React.FC<HudHeaderProps> = ({
  accentColor,
  onOpenSettings,
  onOpenMemory,
  onOpenTools,
  onOpenEnvironment,
  onOpenImageStudio,
  onOpenVideoStudio,
  onOpenGallery,
  onOpenAndroidAssistant,
  onOpenNavigationCamera,
  onReplayStartup,
}) => {
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase());
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);

        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      }).catch(() => {});
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEffects.setMuted(next);
    if (!next) soundEffects.playConfirm();
  };

  return (
    <header className="w-full bg-black/60 backdrop-blur-xl border-b border-cyan-500/15 px-3 sm:px-4 py-2 z-30 sticky top-0">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Blaze Revenant Holographic Branding */}
        <div
          className="flex items-center space-x-2 shrink-0 cursor-pointer group"
          onClick={() => {
            if (onReplayStartup) {
              soundEffects.playConfirm();
              onReplayStartup();
            }
          }}
          title="BLAZE REVENANT // NEURAL CORE (Tap to replay startup sequence)"
        >
          <div className="relative w-7 h-7 rounded-full border border-cyan-400/50 flex items-center justify-center bg-cyan-950/40 shadow-[0_0_12px_rgba(0,240,255,0.35)] group-hover:border-cyan-300 transition-colors">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <div className="absolute inset-0 rounded-full border border-cyan-400/25 animate-spin" style={{ animationDuration: '8s' }} />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-hud text-sm sm:text-base font-extrabold tracking-widest text-cyan-300 hud-glow">
                J.A.R.V.I.S.
              </span>
              <span className="text-[8.5px] px-1 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 font-mono">
                MK-85
              </span>
            </div>
            <span className="text-[7.5px] sm:text-[8px] text-cyan-400/70 font-mono tracking-wider uppercase truncate max-w-[140px] sm:max-w-none">
              BLAZE REVENANT // NEURAL CORE
            </span>
          </div>
        </div>

        {/* Center: Live Telemetry Ticker (Hidden on ultra-small screens) */}
        <div className="hidden md:flex items-center space-x-4 px-3 py-1 rounded-full bg-slate-950/60 border border-cyan-500/20 text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-1.5 text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold tracking-wider">{time}</span>
          </div>
          <span className="text-slate-600">//</span>
          <span className="text-slate-400">{dateStr}</span>
          <span className="text-slate-600">//</span>
          <span className="text-emerald-400 flex items-center space-x-1">
            <Activity className="w-3 h-3 inline" />
            <span>CORE 99.8%</span>
          </span>
        </div>

        {/* Right: Sleek Floating Glass Action Dock */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar">
          {/* Navigation Camera Button */}
          <button
            onClick={() => {
              soundEffects.playConfirm();
              onOpenNavigationCamera();
            }}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-cyan-950/70 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-900 hover:border-cyan-300 transition-all text-xs font-hud shadow-[0_0_10px_rgba(0,240,255,0.25)]"
            title="Iron Man Navigation Optics Camera"
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-bold">Optics</span>
          </button>

          {/* Creative Studio Quick Buttons */}
          <button
            onClick={() => {
              soundEffects.playConfirm();
              onOpenImageStudio();
            }}
            className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-900/60 border border-cyan-500/25 text-cyan-300 hover:bg-cyan-950 hover:border-cyan-400 transition-all text-xs font-hud"
            title="AI Image Studio"
          >
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Image</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playConfirm();
              onOpenVideoStudio();
            }}
            className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-900/60 border border-cyan-500/25 text-cyan-300 hover:bg-cyan-950 hover:border-cyan-400 transition-all text-xs font-hud"
            title="AI Video Studio (Veo)"
          >
            <Video className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Video</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playConfirm();
              onOpenGallery();
            }}
            className="p-1.5 rounded bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-colors"
            title="Media Gallery"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Tools Hub */}
          <button
            onClick={() => {
              soundEffects.playConfirm();
              onOpenTools();
            }}
            className="flex items-center space-x-1 px-2 py-1 rounded bg-cyan-950/40 border border-cyan-500/35 text-cyan-300 hover:bg-cyan-900/50 transition-colors text-xs font-hud"
            title="Assistant Tools & Android Hub"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xs:inline">Tools</span>
          </button>

          {/* Memory */}
          <button
            onClick={() => {
              soundEffects.playConfirm();
              onOpenMemory();
            }}
            className="p-1.5 rounded bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-colors"
            title="Memory Database"
          >
            <Database className="w-3.5 h-3.5" />
          </button>

          {/* PWA App Install Button */}
          <PWAInstallButton variant="compact" />

          {/* APK & Assistant */}
          <button
            onClick={() => {
              soundEffects.playConfirm();
              onOpenAndroidAssistant();
            }}
            className="flex items-center space-x-1 px-2 py-1 rounded bg-emerald-950/40 border border-emerald-500/35 text-emerald-300 hover:bg-emerald-900/50 transition-colors text-xs font-hud"
            title="Android Default Assistant & APK Downloader"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">APK</span>
          </button>

          {/* Audio Mute */}
          <button
            onClick={toggleSound}
            className={`p-1.5 rounded border transition-colors ${
              isMuted
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-cyan-300'
            }`}
            title={isMuted ? 'Audio Cues Muted' : 'Audio Cues Active'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              soundEffects.playConfirm();
              onOpenSettings();
            }}
            className="p-1.5 rounded bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-colors"
            title="System Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
