import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, FastForward, CheckCircle2, AlertTriangle, Cpu, Radio, Database, Shield, Zap } from 'lucide-react';
import { soundEffects } from '../services/audioSynthesizer';
import { speechService } from '../services/speechService';
import { memoryService } from '../services/memoryService';
import { toolRegistry } from '../services/toolRegistry';
import { AssistantSettings } from '../types';

interface CinematicStartupProps {
  settings: AssistantSettings;
  onComplete: () => void;
  onUpdateSettings?: (settings: AssistantSettings) => void;
}

interface SystemCheckItem {
  id: string;
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'pending' | 'checking' | 'verified' | 'warning';
}

export const CinematicStartupSequence: React.FC<CinematicStartupProps> = ({
  settings,
  onComplete,
}) => {
  // Phase of startup animation:
  // 0: Particles gather in darkness
  // 1: Blue energy core ignition
  // 2: Concentric holographic rings assemble
  // 3: "BLAZE REVENANT" materialization + J.A.R.V.I.S. title
  // 4: System diagnostics checks
  // 5: Complete lock-on & transition
  const [phase, setPhase] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(!settings.startupSoundEnabled);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  // Real diagnostics state
  const [systemChecks, setSystemChecks] = useState<SystemCheckItem[]>([
    {
      id: 'ai_engine',
      label: 'AI NEURAL CORE',
      detail: 'Connecting to Gemini uplink...',
      icon: Cpu,
      status: 'pending',
    },
    {
      id: 'audio_matrix',
      label: 'ACOUSTIC SYNTHESIS',
      detail: 'Calibrating Web Audio & Hybrid Voice...',
      icon: Radio,
      status: 'pending',
    },
    {
      id: 'memory_vault',
      label: 'MEMORY ARCHIVE',
      detail: 'Accessing local neural storage...',
      icon: Database,
      status: 'pending',
    },
    {
      id: 'tool_protocols',
      label: 'TACTICAL TOOLS',
      detail: 'Verifying Android intents & camera...',
      icon: Shield,
      status: 'pending',
    },
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasSpokenGreetingRef = useRef<boolean>(false);
  const isCancelledRef = useRef<boolean>(false);

  // Unlock AudioContext on touch/click anywhere
  const handleInteractionToUnlockAudio = useCallback(() => {
    if (!audioUnlocked && !isMuted) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const testCtx = new AudioCtx();
          testCtx.resume().then(() => {
            setAudioUnlocked(true);
            testCtx.close();
          }).catch(() => {});
        }
      } catch {
        // ignore
      }
    }
  }, [audioUnlocked, isMuted]);

  // Canvas particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const centerX = width / 2;
    const centerY = height / 2;

    // Generate cyan energy particles
    const particleCount = Math.min(120, Math.floor((width * height) / 8000));
    const particles = Array.from({ length: particleCount }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * (Math.max(width, height) * 0.6);
      return {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        originX: centerX + Math.cos(angle) * distance,
        originY: centerY + Math.sin(angle) * distance,
        radius: 0.8 + Math.random() * 2.2,
        alpha: 0.1 + Math.random() * 0.7,
        speed: 0.005 + Math.random() * 0.015,
        angle,
        distance,
        targetDistance: 25 + Math.random() * 60,
      };
    });

    let startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      ctx.fillStyle = 'rgba(2, 6, 14, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Render radial glow at center
      const currentCenterX = width / 2;
      const currentCenterY = height / 2;

      const gradient = ctx.createRadialGradient(
        currentCenterX,
        currentCenterY,
        5,
        currentCenterX,
        currentCenterY,
        Math.min(width, height) * 0.45
      );
      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.18)');
      gradient.addColorStop(0.35, 'rgba(0, 150, 255, 0.08)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(currentCenterX, currentCenterY, Math.min(width, height) * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Update and draw particles spiraling inward
      particles.forEach((p) => {
        p.angle += p.speed;
        // Inward pull toward core
        p.distance = Math.max(p.targetDistance, p.distance - 0.75);
        const px = currentCenterX + Math.cos(p.angle) * p.distance;
        const py = currentCenterY + Math.sin(p.angle) * p.distance;

        ctx.fillStyle = `rgba(0, 240, 255, ${p.alpha * (0.4 + 0.6 * Math.sin(elapsed * 3 + p.angle))})`;
        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle electric line connections
        if (p.distance < 120 && Math.random() > 0.96) {
          ctx.strokeStyle = `rgba(0, 240, 255, 0.25)`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(currentCenterX, currentCenterY);
          ctx.stroke();
        }
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Real System Initialization Checkers
  useEffect(() => {
    let isSubscribed = true;

    async function runDiagnostics() {
      // Step 1: Check AI Backend
      try {
        setSystemChecks((prev) =>
          prev.map((c) => (c.id === 'ai_engine' ? { ...c, status: 'checking', detail: 'Pinging /api/health endpoint...' } : c))
        );
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed) {
            setSystemChecks((prev) =>
              prev.map((c) =>
                c.id === 'ai_engine'
                  ? {
                      ...c,
                      status: 'verified',
                      detail: `Gemini Core Online [${data.model || 'gemini-3.1-flash-lite'}]`,
                    }
                  : c
              )
            );
          }
        } else {
          throw new Error('Health responded with non-200');
        }
      } catch {
        if (isSubscribed) {
          setSystemChecks((prev) =>
            prev.map((c) =>
              c.id === 'ai_engine'
                ? {
                    ...c,
                    status: 'warning',
                    detail: 'Local / Offline Mode Active',
                  }
                : c
            )
          );
        }
      }

      if (!isSubscribed) return;

      // Step 2: Check Acoustic Synthesis
      try {
        const hasWebAudio = Boolean(window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
        const hasSpeech = Boolean(window.speechSynthesis);
        if (isSubscribed) {
          setSystemChecks((prev) =>
            prev.map((c) =>
              c.id === 'audio_matrix'
                ? {
                    ...c,
                    status: 'verified',
                    detail: `Hybrid Audio Ready (${hasWebAudio ? 'WebAudio' : ''} + ${hasSpeech ? 'SpeechSynthesis' : ''})`,
                  }
                : c
            )
          );
        }
      } catch {
        if (isSubscribed) {
          setSystemChecks((prev) =>
            prev.map((c) => (c.id === 'audio_matrix' ? { ...c, status: 'warning', detail: 'Audio Drivers Restricted' } : c))
          );
        }
      }

      if (!isSubscribed) return;

      // Step 3: Check Memory Vault
      try {
        const memories = memoryService.getMemories();
        if (isSubscribed) {
          setSystemChecks((prev) =>
            prev.map((c) =>
              c.id === 'memory_vault'
                ? {
                    ...c,
                    status: 'verified',
                    detail: `${memories.length} Stored Memory Nodes Linked`,
                  }
                : c
            )
          );
        }
      } catch {
        if (isSubscribed) {
          setSystemChecks((prev) =>
            prev.map((c) => (c.id === 'memory_vault' ? { ...c, status: 'warning', detail: 'Memory Storage Sandboxed' } : c))
          );
        }
      }

      if (!isSubscribed) return;

      // Step 4: Check Tools
      try {
        const tools = toolRegistry.getAndroidApps();
        if (isSubscribed) {
          setSystemChecks((prev) =>
            prev.map((c) =>
              c.id === 'tool_protocols'
                ? {
                    ...c,
                    status: 'verified',
                    detail: `${tools.length} Tactical App Intents Armed`,
                  }
                : c
            )
          );
        }
      } catch {
        if (isSubscribed) {
          setSystemChecks((prev) =>
            prev.map((c) => (c.id === 'tool_protocols' ? { ...c, status: 'warning', detail: 'Default Tool Set' } : c))
          );
        }
      }
    }

    runDiagnostics();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Cinematic Choreography Timeline
  useEffect(() => {
    isCancelledRef.current = false;
    const duration = Math.max(3.0, settings.startupAnimationDuration || 5.0);
    const stepDuration = (duration * 1000) / 100;

    // Phase 0 -> 1: Power-up hum
    if (!isMuted) {
      soundEffects.playStartupPowerUpHum(duration);
    }

    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      if (isCancelledRef.current) {
        clearInterval(progressInterval);
        return;
      }
      currentProgress += 1;
      setProgress(Math.min(100, currentProgress));

      // Phase transitions
      if (currentProgress === 15) {
        setPhase(1); // Core ignited
        if (!isMuted) soundEffects.playStartupDigitalPulse(620);
      } else if (currentProgress === 35) {
        setPhase(2); // Rings assembling
        if (!isMuted) soundEffects.playStartupDigitalPulse(840);
      } else if (currentProgress === 55) {
        setPhase(3); // BLAZE REVENANT logo materialization
        if (!isMuted) soundEffects.playStartupEnergySweep(1.4);
      } else if (currentProgress === 75) {
        setPhase(4); // Diagnostics readouts
        if (!isMuted) soundEffects.playStartupDigitalPulse(1100);
      } else if (currentProgress >= 100) {
        clearInterval(progressInterval);
        setPhase(5); // Complete lock-on
        if (!isMuted) {
          soundEffects.playStartupCoreLockTone();
        }

        // Spoken greeting: "Greetings, Sir. I am J.A.R.V.I.S."
        if (settings.startupGreetingEnabled && !isMuted && !hasSpokenGreetingRef.current) {
          hasSpokenGreetingRef.current = true;
          setTimeout(() => {
            if (!isCancelledRef.current) {
              speechService.speak(
                `Greetings, ${settings.userName || 'Sir'}. I am J.A.R.V.I.S. Neural Core online and at your service.`,
                {
                  engine: settings.voiceEngine,
                  geminiVoice: settings.geminiVoice,
                  browserVoiceName: settings.browserVoiceName,
                  rate: settings.speechRate,
                  pitch: settings.speechPitch,
                }
              ).catch(() => {});
            }
          }, 400);
        }

        // Transition smoothly to main dashboard
        setTimeout(() => {
          if (!isCancelledRef.current) {
            setIsFinishing(true);
            setTimeout(() => {
              sessionStorage.setItem('jarvis_startup_completed', 'true');
              onComplete();
            }, 600);
          }
        }, 1200);
      }
    }, stepDuration);

    return () => {
      isCancelledRef.current = true;
      clearInterval(progressInterval);
      soundEffects.stopAllStartupAudio();
    };
  }, [settings, isMuted, onComplete]);

  // Handle Skip Intro
  const handleSkipIntro = () => {
    isCancelledRef.current = true;
    soundEffects.stopAllStartupAudio();
    soundEffects.playConfirm();
    sessionStorage.setItem('jarvis_startup_completed', 'true');
    setIsFinishing(true);
    setTimeout(() => {
      onComplete();
    }, 200);
  };

  // Toggle Mute
  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isMuted;
    setIsMuted(next);
    if (next) {
      soundEffects.stopAllStartupAudio();
    } else {
      soundEffects.playStartupDigitalPulse(900);
    }
  };

  return (
    <div
      onClick={handleInteractionToUnlockAudio}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-black text-slate-100 select-none overflow-hidden transition-opacity duration-700 ${
        isFinishing ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Interactive Energy Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Holographic Scanlines & Vignette */}
      <div className="absolute inset-0 pointer-events-none scanlines z-10 opacity-70" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.85)_100%)] z-10" />

      {/* Top HUD Bar */}
      <div className="w-full max-w-4xl px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[10px] font-hud tracking-widest text-cyan-400/80 uppercase">
            BLAZE REVENANT // BOOTSTRAP INITIALIZATION
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Audio Toggle */}
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-lg border text-xs font-mono flex items-center space-x-1.5 transition-all ${
              !isMuted
                ? 'bg-cyan-950/80 border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                : 'bg-slate-950/70 border-slate-800 text-slate-500'
            }`}
            title={isMuted ? 'Unmute Startup Sounds' : 'Mute Startup Sounds'}
          >
            {!isMuted ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            <span className="hidden sm:inline text-[10px]">{isMuted ? 'MUTED' : 'AUDIO ACTIVE'}</span>
          </button>

          {/* Skip Intro Button */}
          <button
            onClick={handleSkipIntro}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-950 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-xs font-hud tracking-wider transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)]"
          >
            <span>SKIP INTRO</span>
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center 3D Holographic Assembly Stage */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-20 px-4 w-full max-w-2xl text-center">
        {/* Core Arc Reactor Assembly SVG Graphics */}
        <div className="relative w-56 h-56 sm:w-72 sm:h-72 flex items-center justify-center">
          {/* Ambient Core Bloom */}
          <div
            className={`absolute w-44 h-44 rounded-full bg-cyan-500/20 blur-2xl transition-all duration-1000 ${
              phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}
          />

          <svg className="w-full h-full" viewBox="0 0 300 300">
            <defs>
              <linearGradient id="cyanArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#0088ff" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.9" />
              </linearGradient>
              <radialGradient id="reactorCoreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="30%" stopColor="#00f0ff" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#0066ff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
              <filter id="hologramGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Outermost Segmented Telemetry Ring */}
            <circle
              cx="150"
              cy="150"
              r="138"
              fill="none"
              stroke="rgba(0, 240, 255, 0.25)"
              strokeWidth="1.5"
              strokeDasharray="4 8 16 8"
              className={`transition-opacity duration-700 ${phase >= 2 ? 'opacity-100 animate-spin' : 'opacity-0'}`}
              style={{ animationDuration: '30s', transformOrigin: 'center' }}
            />

            {/* Middle Rotating Mechanical Gear Ring */}
            <circle
              cx="150"
              cy="150"
              r="115"
              fill="none"
              stroke="url(#cyanArcGrad)"
              strokeWidth="2.5"
              strokeDasharray="28 16 6 16"
              filter="url(#hologramGlow)"
              className={`transition-opacity duration-700 ${phase >= 2 ? 'opacity-100 animate-spin' : 'opacity-0'}`}
              style={{ animationDuration: '18s', animationDirection: 'reverse', transformOrigin: 'center' }}
            />

            {/* 8 Mechanical Reactor Chunks */}
            {phase >= 2 &&
              Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * 45 * Math.PI) / 180;
                const x1 = 150 + Math.cos(angle) * 75;
                const y1 = 150 + Math.sin(angle) * 75;
                const x2 = 150 + Math.cos(angle) * 98;
                const y2 = 150 + Math.sin(angle) * 98;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#00f0ff"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    filter="url(#hologramGlow)"
                    className="animate-pulse"
                    style={{ animationDuration: `${1.2 + (i % 3) * 0.4}s` }}
                  />
                );
              })}

            {/* Inner High-Frequency Ring */}
            <circle
              cx="150"
              cy="150"
              r="68"
              fill="none"
              stroke="rgba(0, 240, 255, 0.7)"
              strokeWidth="2"
              strokeDasharray="12 6"
              className={`transition-opacity duration-500 ${phase >= 1 ? 'opacity-100 animate-spin' : 'opacity-0'}`}
              style={{ animationDuration: '6s', transformOrigin: 'center' }}
            />

            {/* Glowing Core Orb */}
            {phase >= 1 && (
              <circle
                cx="150"
                cy="150"
                r={phase >= 4 ? 42 : 36}
                fill="url(#reactorCoreGlow)"
                className="transition-all duration-700"
              />
            )}

            {/* Triangular Inlay Core Symbol */}
            {phase >= 1 && (
              <polygon
                points="150,122 174,164 126,164"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                filter="url(#hologramGlow)"
                className="animate-pulse"
              />
            )}

            {/* Optical Crosshair Axis */}
            {phase >= 3 && (
              <>
                <line x1="150" y1="10" x2="150" y2="40" stroke="#00f0ff" strokeWidth="1.5" />
                <line x1="150" y1="260" x2="150" y2="290" stroke="#00f0ff" strokeWidth="1.5" />
                <line x1="10" y1="150" x2="40" y2="150" stroke="#00f0ff" strokeWidth="1.5" />
                <line x1="260" y1="150" x2="290" y2="150" stroke="#00f0ff" strokeWidth="1.5" />
              </>
            )}
          </svg>

          {/* Center Digital Percentage Telemetry */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-hud text-lg sm:text-xl font-bold text-white drop-shadow-[0_0_12px_rgba(0,240,255,0.9)]">
              {progress}%
            </span>
            <span className="text-[9px] font-mono tracking-widest text-cyan-300 uppercase">
              {phase === 0
                ? 'IGNITING'
                : phase === 1
                ? 'CORE FLUX'
                : phase === 2
                ? 'ASSEMBLING'
                : phase === 3
                ? 'SYNCING'
                : phase === 4
                ? 'VERIFYING'
                : 'HUD READY'}
            </span>
          </div>
        </div>

        {/* Cinematic Holographic Brand Reveal */}
        <div className="mt-5 space-y-1.5">
          {/* BLAZE REVENANT Holographic Materialization */}
          <div
            className={`transition-all duration-700 transform ${
              phase >= 3
                ? 'opacity-100 translate-y-0 filter-none'
                : 'opacity-0 translate-y-4 blur-sm'
            }`}
          >
            <h1 className="font-hud text-2xl sm:text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-blue-400 hud-glow">
              BLAZE REVENANT
            </h1>
            <div className="text-[11px] sm:text-xs font-mono tracking-[0.25em] text-cyan-300/90 uppercase font-semibold">
              J.A.R.V.I.S. // INITIALIZING NEURAL CORE
            </div>
          </div>

          {/* Autoplay Audio Reminder on Touch Devices */}
          {!audioUnlocked && !isMuted && (
            <div className="text-[10px] font-mono text-cyan-400/60 animate-pulse pt-1">
              [ Tap anywhere to engage high-fidelity acoustic matrix ]
            </div>
          )}
        </div>

        {/* Real Diagnostics Telemetry Grid */}
        <div
          className={`mt-5 w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-left transition-all duration-500 ${
            phase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          {systemChecks.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex items-center space-x-2.5 p-2 rounded-lg bg-black/60 border border-cyan-500/20 backdrop-blur-md"
              >
                <div className="p-1.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-hud text-[10px] font-bold tracking-wider text-slate-200">
                      {item.label}
                    </span>
                    {item.status === 'verified' ? (
                      <span className="flex items-center text-[9px] text-emerald-400 font-mono font-bold">
                        <CheckCircle2 className="w-3 h-3 mr-0.5 inline" /> ONLINE
                      </span>
                    ) : item.status === 'warning' ? (
                      <span className="flex items-center text-[9px] text-amber-400 font-mono font-bold">
                        <AlertTriangle className="w-3 h-3 mr-0.5 inline" /> WARN
                      </span>
                    ) : (
                      <span className="text-[9px] text-cyan-400 font-mono animate-pulse">CHECK...</span>
                    )}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 truncate">{item.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Progress Bar & Telemetry Status */}
      <div className="w-full max-w-3xl px-4 py-4 z-20 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="text-cyan-300 font-bold">NEURAL BUS LINK:</span>
            <span>ARMED & SYNCHRONIZED</span>
          </div>
          <span>BLAZE REVENANT // MK-85 SPEC</span>
        </div>

        {/* High-Tech Segmented Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-950 border border-cyan-500/30 overflow-hidden p-0.5 flex items-center">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.7)] transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
