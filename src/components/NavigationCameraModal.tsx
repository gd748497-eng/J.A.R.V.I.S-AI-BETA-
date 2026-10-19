import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Crosshair,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Camera,
  RefreshCw,
  Sun,
  Navigation,
  Sparkles,
  MapPin,
  Mic,
  Send,
  CheckCircle,
  Move,
} from 'lucide-react';
import { HudAccentColor, OpticalCalibration } from '../types';
import { soundEffects } from '../services/audioSynthesizer';
import { speechService } from '../services/speechService';

interface NavigationCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor?: HudAccentColor;
  onSendToChat?: (text: string) => void;
}

const STORAGE_CALIBRATION_KEY = 'jarvis_optical_calibration_v1';

export const NavigationCameraModal: React.FC<NavigationCameraModalProps> = ({
  isOpen,
  onClose,
  accentColor = 'cyan',
  onSendToChat,
}) => {
  // Video and stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Camera state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorchCapability, setHasTorchCapability] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Calibration state
  const [calibration, setCalibration] = useState<OpticalCalibration>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CALIBRATION_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Calibration load error:', e);
    }
    return {
      targetXPercent: 50,
      targetYPercent: 50,
      radius: 110,
      calibratedAt: 0,
      dontShowTutorialAgain: false,
    };
  });

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isDraggingTarget, setIsDraggingTarget] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [calibrationAnimation, setCalibrationAnimation] = useState(false);

  // Navigate Mode Scanning state
  const [isNavigating, setIsNavigating] = useState(false);
  const [scanStage, setScanStage] = useState<'idle' | 'initializing' | 'scanning' | 'analyzing' | 'ready'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanPaused, setIsScanPaused] = useState(false);
  const scanIntervalRef = useRef<any>(null);

  // Waypoint & Orientation
  const [compassHeading, setCompassHeading] = useState(42);
  const [pitch, setPitch] = useState(0);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationInput] = useState('Blaze Revenant Sector 7');
  const [destinationBearing] = useState(68);
  const [destinationDistance] = useState(840); // meters

  // Ask JARVIS Vision
  const [isVisionDrawerOpen, setIsVisionDrawerOpen] = useState(false);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [visionPrompt, setVisionPrompt] = useState('');
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);
  const [visionAnalysis, setVisionAnalysis] = useState<string | null>(null);
  const [isVisionSpeaking, setIsVisionSpeaking] = useState(false);
  const [isVoiceListeningForPrompt, setIsVoiceListeningForPrompt] = useState(false);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: cameraFacing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      // Check torch capabilities
      const track = newStream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities?.() as any) || {};
        setHasTorchCapability(Boolean(capabilities.torch));
      }
    } catch (err: any) {
      console.warn('Camera uplink failed:', err);
      let msg = 'Optical feed unavailable: ';
      if (err.name === 'NotAllowedError') {
        msg += 'Camera permission was denied. Please allow camera access in browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
        msg += 'Rear camera not detected. Switching to default optical sensor.';
        // Fallback to basic video constraint
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          setStream(fallbackStream);
          if (videoRef.current) videoRef.current.srcObject = fallbackStream;
          return;
        } catch (fbErr: any) {
          msg = 'No video devices accessible on this hardware. Synthetic HUD mode engaged.';
        }
      } else {
        msg += err.message || 'Unknown optics sensor error.';
      }
      setCameraError(msg);
    }
  }, [cameraFacing]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!stream || !hasTorchCapability) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      try {
        const next = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: next }],
        });
        setIsTorchOn(next);
        soundEffects.playConfirm();
      } catch (e) {
        console.warn('Failed to toggle torch:', e);
      }
    }
  };

  // Flip Camera
  const toggleCameraFacing = () => {
    soundEffects.playConfirm();
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Handle open/close lifecycle
  useEffect(() => {
    if (isOpen) {
      startCamera();
      soundEffects.playArcReactorPowerUp();

      // Check first-time calibration
      const saved = localStorage.getItem(STORAGE_CALIBRATION_KEY);
      if (!saved) {
        setShowTutorial(true);
        setIsCalibrating(true);
      } else {
        const parsed = JSON.parse(saved);
        if (!parsed.dontShowTutorialAgain && parsed.calibratedAt === 0) {
          setShowTutorial(true);
          setIsCalibrating(true);
        }
      }

      // Geolocation telemetry
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoordinates({
              lat: Number(pos.coords.latitude.toFixed(5)),
              lng: Number(pos.coords.longitude.toFixed(5)),
            });
          },
          (err) => console.warn('Geo telemetry fallback:', err.message),
          { enableHighAccuracy: true }
        );
      }

      // Compass & Pitch listener
      const handleOrientation = (e: DeviceOrientationEvent) => {
        if (e.alpha !== null) {
          const heading = (e as any).webkitCompassHeading || (360 - e.alpha);
          setCompassHeading(Math.round(heading) % 360);
        }
        if (e.beta !== null) {
          setPitch(Math.round(e.beta));
        }
      };

      window.addEventListener('deviceorientation', handleOrientation, true);
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      };
    } else {
      stopCamera();
      clearInterval(scanIntervalRef.current);
      setIsNavigating(false);
      setScanStage('idle');
      setScanProgress(0);
      setIsVisionDrawerOpen(false);
    }
  }, [isOpen, startCamera, stopCamera]);

  // Simulated Gyro drift if device orientation not supported
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCompassHeading((prev) => (prev + 1) % 360);
    }, 1800);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Touch and Mouse Dragging for Calibration
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isCalibrating) return;
    setIsDraggingTarget(true);
    updateTargetPosition(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isCalibrating || !isDraggingTarget) return;
    updateTargetPosition(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    if (isDraggingTarget) {
      setIsDraggingTarget(false);
      soundEffects.playOpticTick();
    }
  };

  const updateTargetPosition = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(10, Math.min(rect.width - 10, clientX - rect.left));
    const y = Math.max(10, Math.min(rect.height - 10, clientY - rect.top));

    const xPercent = Math.round((x / rect.width) * 100);
    const yPercent = Math.round((y / rect.height) * 100);

    setCalibration((prev) => ({
      ...prev,
      targetXPercent: xPercent,
      targetYPercent: yPercent,
    }));
  };

  // Calibration Controls
  const handleConfirmCalibration = (dontShowAgain: boolean) => {
    const updated: OpticalCalibration = {
      ...calibration,
      calibratedAt: Date.now(),
      dontShowTutorialAgain: dontShowAgain,
    };
    setCalibration(updated);
    try {
      localStorage.setItem(STORAGE_CALIBRATION_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save calibration:', e);
    }

    setIsCalibrating(false);
    setShowTutorial(false);
    setCalibrationAnimation(true);
    soundEffects.playCalibrationComplete();

    setTimeout(() => {
      setCalibrationAnimation(false);
    }, 1400);
  };

  const handleResetCalibration = () => {
    setCalibration((prev) => ({
      ...prev,
      targetXPercent: 50,
      targetYPercent: 50,
      radius: 110,
    }));
    soundEffects.playConfirm();
  };

  // Navigate Mode Scanning Logic
  const startNavigateScan = () => {
    if (isNavigating && !isScanPaused) return;

    soundEffects.playScanningSweep();
    setIsNavigating(true);
    setIsScanPaused(false);
    setScanStage('initializing');
    setScanProgress(0);

    clearInterval(scanIntervalRef.current);

    let currentProgress = 0;
    scanIntervalRef.current = setInterval(() => {
      currentProgress += 1.5;

      if (currentProgress >= 100) {
        currentProgress = 100;
        setScanProgress(100);
        setScanStage('ready');
        clearInterval(scanIntervalRef.current);
        soundEffects.playTargetLock();
        return;
      }

      setScanProgress(Math.round(currentProgress));

      if (currentProgress < 25) {
        setScanStage('initializing');
      } else if (currentProgress < 60) {
        setScanStage('scanning');
        if (Math.round(currentProgress) % 15 === 0 && !isMuted) {
          soundEffects.playOpticTick();
        }
      } else if (currentProgress < 85) {
        setScanStage('analyzing');
        if (Math.round(currentProgress) % 20 === 0 && !isMuted) {
          soundEffects.playRadarPing();
        }
      } else {
        setScanStage('ready');
      }
    }, 50);
  };

  const togglePauseScan = () => {
    if (isScanPaused) {
      setIsScanPaused(false);
      startNavigateScan();
    } else {
      setIsScanPaused(true);
      clearInterval(scanIntervalRef.current);
      soundEffects.playConfirm();
    }
  };

  const rescan = () => {
    clearInterval(scanIntervalRef.current);
    startNavigateScan();
  };

  const exitNavigate = () => {
    clearInterval(scanIntervalRef.current);
    setIsNavigating(false);
    setScanStage('idle');
    setScanProgress(0);
    setIsScanPaused(false);
    soundEffects.playConfirm();
  };

  // Capture Frame from Video
  const captureCurrentFrame = (): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    soundEffects.playCameraShutter();
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // Open Ask JARVIS Live Vision
  const handleOpenAskJarvis = () => {
    const frame = captureCurrentFrame();
    setCapturedFrame(frame);
    setIsVisionDrawerOpen(true);
    setVisionAnalysis(null);
    soundEffects.playConfirm();
  };

  // Analyze Captured Frame with Gemini
  const handleAnalyzeVision = async (customPrompt?: string, mode: 'identify' | 'ocr' | 'tactical' | 'general' = 'general') => {
    const promptToSend = customPrompt || visionPrompt || 'Identify and assess what is visible in this frame.';
    if (!capturedFrame) return;

    setIsAnalyzingVision(true);
    soundEffects.playProcessingPulse();

    try {
      const res = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: capturedFrame,
          prompt: promptToSend,
          mode,
          language: 'auto',
        }),
      });

      if (!res.ok) {
        throw new Error(`Optics uplink returned status ${res.status}`);
      }

      const data = await res.json();
      setVisionAnalysis(data.analysis);
      soundEffects.playTargetLock();

      // Read analysis aloud if audio active
      if (!isMuted) {
        setIsVisionSpeaking(true);
        await speechService.speak(data.analysis, {
          engine: 'browser_tts',
          geminiVoice: 'Zephyr',
          language: 'auto',
        });
        setIsVisionSpeaking(false);
      }
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      setVisionAnalysis(`Telemetry analysis failure: ${err.message}. Retrying frame acquisition recommended.`);
      soundEffects.playAlert();
    } finally {
      setIsAnalyzingVision(false);
    }
  };

  // Voice Input for Ask JARVIS
  const handleVoiceInputForVision = () => {
    if (isVoiceListeningForPrompt) {
      speechService.stopListening();
      setIsVoiceListeningForPrompt(false);
    } else {
      setIsVoiceListeningForPrompt(true);
      speechService.startListening('auto');
      speechService.setCallbacks(
        (st) => {
          if (st === 'idle') setIsVoiceListeningForPrompt(false);
        },
        (trans, isFinal) => {
          setVisionPrompt(trans);
          if (isFinal) {
            setIsVoiceListeningForPrompt(false);
            handleAnalyzeVision(trans, 'general');
          }
        },
        (err) => {
          console.warn('Voice query error:', err);
          setIsVoiceListeningForPrompt(false);
        }
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Hidden canvas for capturing video frames */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Viewport Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative flex-1 w-full h-full overflow-hidden bg-black flex items-center justify-center touch-none"
      >
        {/* Real Live Video Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            cameraFacing === 'user' ? '-scale-x-100' : ''
          }`}
        />

        {/* Camera Permission Error / Synthetic Backup Viewport */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center z-10">
            <div className="w-16 h-16 rounded-full border border-cyan-500/40 bg-cyan-950/40 flex items-center justify-center mb-4 text-cyan-400">
              <Camera className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="font-hud text-lg tracking-wider text-cyan-300 uppercase mb-2">
              Optical Sensor Notice
            </h3>
            <p className="text-xs text-slate-300 max-w-sm font-mono mb-4 leading-relaxed">
              {cameraError}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => startCamera()}
                className="px-4 py-2 rounded bg-cyan-950/60 border border-cyan-400 text-cyan-300 text-xs font-hud uppercase tracking-wider hover:bg-cyan-900/60 transition-colors"
              >
                Retry Optics Uplink
              </button>
              <button
                onClick={() => setCameraError(null)}
                className="px-4 py-2 rounded bg-slate-900 border border-slate-700 text-slate-300 text-xs font-hud uppercase tracking-wider hover:bg-slate-800 transition-colors"
              >
                Synthetic HUD Mode
              </button>
            </div>
          </div>
        )}

        {/* Cinematic Iron Man HUD Overlay Elements */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {/* Top Bar: Compass, Optics Telemetry, Controls */}
          <div className="flex items-start justify-between gap-2 pointer-events-auto">
            {/* Left: Optics Spec & GPS Telemetry */}
            <div className="flex flex-col space-y-1 bg-black/60 backdrop-blur-md border border-cyan-500/25 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-slate-300 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
              <div className="flex items-center space-x-2 text-cyan-400 font-hud tracking-wider">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                <span className="font-bold">MK-85 OPTICAL HUD</span>
                <span className="text-[9px] px-1 bg-cyan-950 rounded border border-cyan-500/40">4K HDR</span>
              </div>
              <div className="flex items-center space-x-3 text-[9px] text-slate-400">
                <span>FPS: <span className="text-cyan-300">60.0</span></span>
                <span>PITCH: <span className="text-cyan-300">{pitch}°</span></span>
                <span>BEARING: <span className="text-emerald-400">{compassHeading}°</span></span>
              </div>
              {coordinates && (
                <div className="text-[9px] text-slate-400 font-mono">
                  GPS: <span className="text-cyan-300">{coordinates.lat} N, {coordinates.lng} E</span>
                </div>
              )}
            </div>

            {/* Center: Panoramic Compass Heading Ribbon */}
            <div className="hidden sm:flex flex-col items-center bg-black/60 backdrop-blur-md border border-cyan-500/30 px-4 py-1 rounded-full text-cyan-300 text-xs font-mono shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <div className="flex items-center space-x-3 text-[11px] font-bold tracking-widest">
                <span className={compassHeading > 315 || compassHeading <= 45 ? 'text-amber-400' : 'text-slate-500'}>N</span>
                <span className="text-slate-600">//</span>
                <span className={compassHeading > 45 && compassHeading <= 135 ? 'text-amber-400' : 'text-slate-500'}>E</span>
                <span className="text-slate-600">//</span>
                <span className={compassHeading > 135 && compassHeading <= 225 ? 'text-amber-400' : 'text-slate-500'}>S</span>
                <span className="text-slate-600">//</span>
                <span className={compassHeading > 225 && compassHeading <= 315 ? 'text-amber-400' : 'text-slate-500'}>W</span>
                <span className="text-cyan-400 ml-2 font-hud">{compassHeading}°</span>
              </div>
              <div className="w-36 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mt-0.5" />
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex items-center space-x-1.5">
              {hasTorchCapability && (
                <button
                  onClick={toggleTorch}
                  className={`p-2 rounded-full border transition-all ${
                    isTorchOn
                      ? 'bg-amber-500/30 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                      : 'bg-black/60 border-cyan-500/30 text-slate-400 hover:text-cyan-300'
                  }`}
                  title="Flashlight / Torch"
                >
                  <Sun className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={toggleCameraFacing}
                className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/30 text-slate-300 hover:text-cyan-300 transition-colors shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                title="Switch Camera (Rear/Front)"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  const next = !isMuted;
                  setIsMuted(next);
                  soundEffects.setMuted(next);
                }}
                className={`p-2 rounded-full border backdrop-blur-md transition-colors ${
                  isMuted
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                    : 'bg-black/60 border-cyan-500/30 text-slate-300 hover:text-cyan-300'
                }`}
                title={isMuted ? 'Unmute Audio Cues' : 'Mute Audio Cues'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  soundEffects.playConfirm();
                  setIsCalibrating(true);
                  setShowTutorial(true);
                }}
                className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/30 text-slate-300 hover:text-cyan-300 transition-colors"
                title="Recalibrate Targeting Reticle"
              >
                <Move className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  soundEffects.playConfirm();
                  onClose();
                }}
                className="p-2 rounded-full bg-red-950/60 backdrop-blur-md border border-red-500/40 text-red-300 hover:bg-red-900/60 transition-colors shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                title="Exit Optics HUD"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center Tactical HUD Grid and Framing Brackets */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Corner Sci-Fi Framing Brackets */}
            <div className="absolute top-12 left-6 w-10 h-10 border-t-2 border-l-2 border-cyan-400/50" />
            <div className="absolute top-12 right-6 w-10 h-10 border-t-2 border-r-2 border-cyan-400/50" />
            <div className="absolute bottom-24 left-6 w-10 h-10 border-b-2 border-l-2 border-cyan-400/50" />
            <div className="absolute bottom-24 right-6 w-10 h-10 border-b-2 border-r-2 border-cyan-400/50" />

            {/* Horizontal Pitch Ladder Ticks */}
            <div className="absolute w-48 h-24 border-l border-r border-cyan-500/20 flex flex-col justify-between items-center pointer-events-none opacity-40">
              <div className="w-8 h-0.5 bg-cyan-400" />
              <div className="w-12 h-0.5 bg-cyan-400" />
              <div className="w-8 h-0.5 bg-cyan-400" />
            </div>
          </div>

          {/* Interactive / Animated Targeting Reticle Circle */}
          <div
            style={{
              left: `${calibration.targetXPercent}%`,
              top: `${calibration.targetYPercent}%`,
              width: `${calibration.radius * 2}px`,
              height: `${calibration.radius * 2}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`absolute pointer-events-none transition-all duration-150 flex items-center justify-center ${
              calibrationAnimation ? 'scale-125 transition-transform duration-300' : ''
            }`}
          >
            {/* Outer Rotating Segmented Ring */}
            <div
              className={`absolute inset-0 rounded-full border-2 border-dashed ${
                isNavigating ? 'border-cyan-300 animate-spin shadow-[0_0_20px_rgba(0,240,255,0.6)]' : 'border-cyan-400/60'
              }`}
              style={{ animationDuration: isNavigating ? '3s' : '16s' }}
            />

            {/* Inner Concentric Target Rings */}
            <div className="absolute inset-3 rounded-full border border-cyan-500/40" />
            <div className="absolute inset-6 rounded-full border border-cyan-400/30" />

            {/* Rotating Gear Ticks in Navigate Mode */}
            {isNavigating && (
              <div
                className="absolute inset-1 rounded-full border-4 border-cyan-400/40 border-t-cyan-300 border-b-cyan-300 animate-spin"
                style={{ animationDirection: 'reverse', animationDuration: '4s' }}
              />
            )}

            {/* Center Crosshair & Optics Dot */}
            <div className="relative w-4 h-4 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,1)]" />
              <div className="absolute w-6 h-0.5 bg-cyan-400/80" />
              <div className="absolute h-6 w-0.5 bg-cyan-400/80" />
            </div>

            {/* Tactical Telemetry Floating Tag */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-black/75 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 tracking-wider">
              {isCalibrating ? (
                <span className="text-amber-300 animate-pulse">DRAG TO CALIBRATE POSITION</span>
              ) : isNavigating ? (
                <span className="text-emerald-400 font-bold uppercase">
                  {scanStage === 'ready' ? 'TARGET LOCK // WAYPOINT ACTIVE' : `SCANNING [${scanProgress}%]`}
                </span>
              ) : (
                <span>OPTICAL RETICLE // LOCK-ON READY</span>
              )}
            </div>

            {/* Resize Slider Handle in Calibration Mode */}
            {isCalibrating && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center space-x-2 bg-black/85 border border-cyan-500/50 px-2 py-1 rounded-full">
                <span className="text-[9px] text-slate-400 font-mono">SIZE:</span>
                <input
                  type="range"
                  min="60"
                  max="180"
                  value={calibration.radius}
                  onChange={(e) => {
                    const r = parseInt(e.target.value, 10);
                    setCalibration((prev) => ({ ...prev, radius: r }));
                  }}
                  className="w-24 accent-cyan-400"
                />
              </div>
            )}
          </div>

          {/* Bottom Controls Deck */}
          <div className="flex flex-col space-y-2 pointer-events-auto">
            {/* Scan Progress Bar & Stage Indicator when Navigating */}
            {isNavigating && (
              <div className="w-full max-w-lg mx-auto bg-black/80 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3 shadow-[0_0_20px_rgba(0,240,255,0.25)]">
                <div className="flex items-center justify-between text-[11px] font-hud tracking-wider mb-1.5">
                  <div className="flex items-center space-x-2 text-cyan-300">
                    <Navigation className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span className="font-bold uppercase">
                      {scanStage === 'initializing' && 'STAGE 1: INITIALIZING OPTICS...'}
                      {scanStage === 'scanning' && 'STAGE 2: SCANNING ENVIRONMENT...'}
                      {scanStage === 'analyzing' && 'STAGE 3: ANALYZING VIEW...'}
                      {scanStage === 'ready' && 'STAGE 4: HUD READY // OPTICS LOCKED'}
                    </span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold">{scanProgress}%</span>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-cyan-500/30">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-emerald-400 transition-all duration-100"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>

                {/* Simulated scan disclaimer */}
                <div className="flex items-center justify-between mt-2 text-[9px] text-slate-400 font-mono">
                  <span className="text-amber-400/90">[SIMULATED HUD OPTICAL SWEEP]</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={togglePauseScan}
                      className="text-cyan-300 hover:text-cyan-200 underline"
                    >
                      {isScanPaused ? 'Resume Scan' : 'Pause Scan'}
                    </button>
                    <span>|</span>
                    <button onClick={rescan} className="text-cyan-300 hover:text-cyan-200 underline">
                      Rescan
                    </button>
                    <span>|</span>
                    <button onClick={exitNavigate} className="text-red-400 hover:text-red-300 underline">
                      Exit Navigate
                    </button>
                  </div>
                </div>

                {/* Waypoint Telemetry when HUD Ready */}
                {scanStage === 'ready' && (
                  <div className="mt-2.5 pt-2 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-300">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-slate-400">WAYPOINT:</span>
                      <span className="text-cyan-300 font-bold">{destinationInput}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span>DIST: <span className="text-emerald-400 font-bold">{destinationDistance}m</span></span>
                      <span>BRG: <span className="text-cyan-300 font-bold">{destinationBearing}°</span></span>
                      <span>ETA: <span className="text-cyan-300">~4 MIN</span></span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Action Ribbon */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-1">
              {/* Navigate Button */}
              {!isNavigating ? (
                <button
                  onClick={() => {
                    soundEffects.playConfirm();
                    startNavigateScan();
                  }}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-cyan-950/80 border-2 border-cyan-400 text-cyan-300 font-hud text-sm tracking-wider uppercase hover:bg-cyan-900/80 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all"
                >
                  <Navigation className="w-4 h-4 text-cyan-400" />
                  <span>START NAVIGATE MODE</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={togglePauseScan}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-full bg-slate-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-hud tracking-wider hover:bg-cyan-950 transition-colors"
                  >
                    {isScanPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isScanPaused ? 'RESUME' : 'PAUSE'}</span>
                  </button>
                  <button
                    onClick={rescan}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-full bg-slate-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-hud tracking-wider hover:bg-cyan-950 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>RESCAN</span>
                  </button>
                  <button
                    onClick={exitNavigate}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-full bg-red-950/60 border border-red-500/30 text-red-300 text-xs font-hud tracking-wider hover:bg-red-900/60 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>EXIT</span>
                  </button>
                </div>
              )}

              {/* Ask JARVIS Live Vision Button */}
              <button
                onClick={handleOpenAskJarvis}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-blue-950/80 border-2 border-blue-400 text-blue-200 font-hud text-sm tracking-wider uppercase hover:bg-blue-900/80 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all"
              >
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>ASK JARVIS (LIVE VISION)</span>
              </button>

              {/* Shutter Snapshot Button */}
              <button
                onClick={() => {
                  const frame = captureCurrentFrame();
                  if (frame) {
                    setCapturedFrame(frame);
                    setIsVisionDrawerOpen(true);
                  }
                }}
                className="p-3 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/40 text-cyan-400 hover:text-cyan-200 hover:border-cyan-300 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                title="Capture Optical Frame"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* First-Time Calibration Interactive Tutorial Modal */}
        {showTutorial && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-30 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-950 border border-cyan-500/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,240,255,0.3)] text-slate-100 flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <div className="flex items-center space-x-2 text-cyan-300 font-hud text-base font-bold tracking-wider">
                  <Crosshair className="w-5 h-5 text-cyan-400 animate-spin" />
                  <span>OPTICS CALIBRATION PROTOCOL</span>
                </div>
                <button
                  onClick={() => setShowTutorial(false)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed font-sans">
                <p>
                  Welcome to the Blaze Revenant Navigation Optics system, Sir. For optimal targeting precision on mobile:
                </p>
                <ul className="space-y-1.5 list-disc list-inside text-slate-400 font-mono text-[11px]">
                  <li>
                    <strong className="text-cyan-300">Position Reticle:</strong> Drag the cyan holographic circle anywhere across the live camera feed.
                  </li>
                  <li>
                    <strong className="text-cyan-300">Resize Circle:</strong> Adjust the diameter slider at the bottom to match your target aperture (min 60px, max 180px).
                  </li>
                  <li>
                    <strong className="text-cyan-300">Save Setting:</strong> Tap Confirm Calibration. Your custom coordinates will be saved for all future sessions.
                  </li>
                </ul>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
                <input
                  type="checkbox"
                  id="dontShowTutorial"
                  checked={calibration.dontShowTutorialAgain}
                  onChange={(e) =>
                    setCalibration((prev) => ({ ...prev, dontShowTutorialAgain: e.target.checked }))
                  }
                  className="accent-cyan-400 rounded"
                />
                <label htmlFor="dontShowTutorial" className="cursor-pointer select-none">
                  Do not display this tutorial on future launches
                </label>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleResetCalibration}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs font-hud hover:bg-slate-800 transition-colors"
                >
                  RESET POSITION
                </button>
                <button
                  onClick={() => handleConfirmCalibration(calibration.dontShowTutorialAgain)}
                  className="flex-1 py-2.5 rounded-lg bg-cyan-950 border border-cyan-400 text-cyan-300 text-xs font-hud font-bold tracking-wider hover:bg-cyan-900 transition-colors shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                >
                  CONFIRM CALIBRATION
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ask JARVIS — Live Vision Slide-Up Panel */}
        {isVisionDrawerOpen && (
          <div className="absolute bottom-0 inset-x-0 max-h-[85vh] bg-slate-950/95 backdrop-blur-xl border-t border-cyan-500/40 z-30 p-4 rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.8)] overflow-y-auto flex flex-col space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
              <div className="flex items-center space-x-2 text-cyan-300 font-hud tracking-wider text-sm">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-bold">ASK J.A.R.V.I.S. // LIVE VISION ANALYSIS</span>
              </div>
              <button
                onClick={() => {
                  speechService.stopSpeaking();
                  setIsVisionDrawerOpen(false);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail preview and Preset Tactical Prompts */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {capturedFrame && (
                <div className="w-28 h-20 shrink-0 rounded-lg overflow-hidden border border-cyan-500/30 relative">
                  <img src={capturedFrame} alt="Captured frame" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none" />
                </div>
              )}

              {/* Quick Tactical Preset Chips */}
              <div className="flex-1 flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleAnalyzeVision('Identify all visible objects, materials, and equipment in this scene.', 'identify')}
                  className="px-2.5 py-1 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950 text-[11px] font-mono transition-colors"
                >
                  🔍 Identify Objects
                </button>
                <button
                  onClick={() => handleAnalyzeVision('Assess tactical hazards, structural clearances, and emergency egress.', 'tactical')}
                  className="px-2.5 py-1 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950 text-[11px] font-mono transition-colors"
                >
                  ⚡ Hazard Assessment
                </button>
                <button
                  onClick={() => handleAnalyzeVision('Extract and translate any visible text, signage, serial numbers, or labels.', 'ocr')}
                  className="px-2.5 py-1 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950 text-[11px] font-mono transition-colors"
                >
                  📄 Transcribe & Translate
                </button>
                <button
                  onClick={() => handleAnalyzeVision('Provide navigation cues, open walkways, and orientation assistance.', 'general')}
                  className="px-2.5 py-1 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950 text-[11px] font-mono transition-colors"
                >
                  🧭 Navigation Waypoints
                </button>
              </div>
            </div>

            {/* Query Input Bar: Voice + Text */}
            <div className="flex items-center space-x-2 bg-slate-900/80 border border-cyan-500/30 rounded-xl p-1.5">
              <input
                type="text"
                placeholder="Ask anything about what is visible in this frame..."
                value={visionPrompt}
                onChange={(e) => setVisionPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeVision(visionPrompt)}
                className="flex-1 bg-transparent px-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
              />

              <button
                onClick={handleVoiceInputForVision}
                className={`p-2 rounded-lg border transition-all ${
                  isVoiceListeningForPrompt
                    ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-cyan-300'
                }`}
                title={isVoiceListeningForPrompt ? 'Listening...' : 'Speak query'}
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleAnalyzeVision(visionPrompt)}
                disabled={isAnalyzingVision}
                className="px-3.5 py-2 rounded-lg bg-cyan-950 border border-cyan-400 text-cyan-300 hover:bg-cyan-900 text-xs font-hud flex items-center space-x-1"
              >
                {isAnalyzingVision ? (
                  <span className="animate-spin text-cyan-400">⏳</span>
                ) : (
                  <>
                    <span>ANALYZE</span>
                    <Send className="w-3.5 h-3.5 ml-1" />
                  </>
                )}
              </button>
            </div>

            {/* Analysis Output Holographic Box */}
            {isAnalyzingVision ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-2 text-cyan-400">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <span className="font-hud text-xs tracking-wider uppercase">
                  PROCESSING NEURAL OPTICAL TELEMETRY...
                </span>
              </div>
            ) : visionAnalysis ? (
              <div className="bg-slate-900/90 border border-cyan-500/40 rounded-xl p-3.5 flex flex-col space-y-2 text-xs font-sans leading-relaxed text-slate-200">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5 text-[11px] font-mono text-cyan-400">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>J.A.R.V.I.S. VERIFIED OPTICAL ASSESSMENT</span>
                  </div>
                  <button
                    onClick={() => {
                      if (isVisionSpeaking) {
                        speechService.stopSpeaking();
                        setIsVisionSpeaking(false);
                      } else {
                        setIsVisionSpeaking(true);
                        speechService.speak(visionAnalysis, { engine: 'browser_tts' }).then(() => {
                          setIsVisionSpeaking(false);
                        });
                      }
                    }}
                    className="flex items-center space-x-1 text-slate-300 hover:text-cyan-300"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isVisionSpeaking ? 'Pause' : 'Listen'}</span>
                  </button>
                </div>

                <p className="whitespace-pre-wrap">{visionAnalysis}</p>

                <div className="pt-2 flex justify-end gap-2">
                  {onSendToChat && (
                    <button
                      onClick={() => {
                        onSendToChat(`[Optical Camera Assessment]: ${visionAnalysis}`);
                        setIsVisionDrawerOpen(false);
                        onClose();
                      }}
                      className="px-3 py-1 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-[11px] font-hud hover:bg-cyan-900 transition-colors"
                    >
                      POST TO JARVIS LOGS
                    </button>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(visionAnalysis);
                      soundEffects.playConfirm();
                    }}
                    className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-[11px] font-hud hover:bg-slate-700 transition-colors"
                  >
                    COPY ANALYSIS
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
