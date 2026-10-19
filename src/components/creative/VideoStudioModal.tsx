import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Video,
  Sparkles,
  Download,
  Upload,
  Play,
  RotateCw,
  AlertCircle,
  Clock,
  Layers,
  FileVideo,
  Info,
} from 'lucide-react';
import { GeneratedVideo } from '../../types';
import { mediaGalleryService } from '../../services/mediaGalleryService';
import { soundEffects } from '../../services/audioSynthesizer';

interface VideoStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGallery?: () => void;
}

export const VideoStudioModal: React.FC<VideoStudioModalProps> = ({
  isOpen,
  onClose,
  onOpenGallery,
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [referenceImageBase64, setReferenceImageBase64] = useState<string | null>(null);
  const [referenceImageMimeType, setReferenceImageMimeType] = useState('image/png');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<'initiating' | 'polling' | 'downloading' | 'idle'>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [operationName, setOperationName] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<GeneratedVideo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);

  const pollIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const sampleVideoPrompts = [
    'Cinematic orbital flythrough of Blaze Revenant Spire with glowing holographic arc reactor beacon',
    'Futuristic drone POV gliding over a gleaming sci-fi metropolis at sunset with flying vehicles',
    '3D rotating holographic wireframe model of advanced Iron Man combat helmet with HUD data streams',
    'Close up hyperlapse of robotic nanotechnology assembling intricate mechanical armor plates',
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReferenceImageMimeType(file.type || 'image/png');
    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImageBase64(event.target?.result as string);
      soundEffects.playConfirm();
    };
    reader.readAsDataURL(file);
  };

  const handleStartGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerationPhase('initiating');
    setErrorMsg(null);
    setErrorHint(null);
    setElapsedSeconds(0);
    soundEffects.playProcessingPulse();

    // Start timer counter
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    try {
      // Step 1: Start operation
      const startRes = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          resolution,
          referenceImageBase64,
          referenceImageMimeType,
        }),
      });

      const startData = await startRes.json();

      if (!startRes.ok) {
        throw new Error(startData.error || 'Failed to initialize video generation job');
      }

      const opName = startData.operationName;
      setOperationName(opName);
      setGenerationPhase('polling');

      // Step 2: Poll operation until completed
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      pollIntervalRef.current = setInterval(async () => {
        attempts++;
        try {
          const pollRes = await fetch('/api/video/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName: opName }),
          });

          const pollData = await pollRes.json();

          if (pollData.error) {
            clearInterval(pollIntervalRef.current);
            clearInterval(timerIntervalRef.current);
            setIsGenerating(false);
            setGenerationPhase('idle');
            setErrorMsg(`Video rendering error: ${JSON.stringify(pollData.error)}`);
            return;
          }

          if (pollData.done) {
            clearInterval(pollIntervalRef.current);
            setGenerationPhase('downloading');

            // Step 3: Download video blob
            const downloadRes = await fetch('/api/video/download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName: opName }),
            });

            if (!downloadRes.ok) {
              throw new Error('Video download streaming failed');
            }

            const videoBlob = await downloadRes.blob();
            const blobUrl = URL.createObjectURL(videoBlob);

            const newVideo: GeneratedVideo = {
              id: 'vid-' + Date.now(),
              prompt: prompt.trim(),
              aspectRatio,
              resolution,
              videoUrl: blobUrl,
              operationName: opName,
              status: 'completed',
              createdAt: Date.now(),
            };

            setCurrentVideo(newVideo);
            mediaGalleryService.addVideo({
              prompt: prompt.trim(),
              aspectRatio,
              resolution,
              videoUrl: blobUrl,
              status: 'completed',
            });

            clearInterval(timerIntervalRef.current);
            setIsGenerating(false);
            setGenerationPhase('idle');
            soundEffects.playConfirm();
          } else if (attempts >= maxAttempts) {
            clearInterval(pollIntervalRef.current);
            clearInterval(timerIntervalRef.current);
            setIsGenerating(false);
            setGenerationPhase('idle');
            setErrorMsg('Video generation timed out after 5 minutes.');
          }
        } catch (pollErr: any) {
          console.warn('Poll step exception:', pollErr);
        }
      }, 5000); // Poll every 5s
    } catch (err: any) {
      clearInterval(timerIntervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      console.error('Video generation error:', err);
      setErrorMsg(err.message || 'Video pipeline disruption');
      setErrorHint(
        'Note: Google Veo video models (veo-3.1-lite-generate-preview) require an active Google Cloud project with Vertex AI / Gemini API billing enabled.'
      );
      setIsGenerating(false);
      setGenerationPhase('idle');
      soundEffects.playAlert();
    }
  };

  const handleDownloadMp4 = () => {
    if (!currentVideo?.videoUrl) return;
    const a = document.createElement('a');
    a.href = currentVideo.videoUrl;
    a.download = `jarvis-motion-${Date.now()}.mp4`;
    a.click();
    soundEffects.playConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-950 border border-cyan-500/40 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_0_35px_rgba(0,240,255,0.25)] hud-bracket overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/30 bg-black/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-hud text-base font-bold text-cyan-300 tracking-wider">
                AI VIDEO STUDIO // MOTION SYNTHESIS
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                Model: veo-3.1-lite-generate-preview
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenGallery && (
              <button
                onClick={onOpenGallery}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 text-xs font-hud transition-colors"
                title="Open Media Gallery"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gallery</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Prompt Form */}
          <form onSubmit={handleStartGeneration} className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-hud text-cyan-300 uppercase tracking-wider">
                  Motion Synthesis Prompt
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPrompt('Cinematic smooth drone pan around futuristic glowing Blaze Revenant Arc Reactor pedestal at night, atmospheric neon volumetric fog');
                    soundEffects.playConfirm();
                  }}
                  className="flex items-center space-x-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-hud"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Inspire</span>
                </button>
              </div>

              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe scene action and camera motion (e.g. 'Dynamic camera swoop through futuristic cyber city, glowing billboards, raining light particles')..."
                className="w-full bg-black/80 border border-cyan-500/30 focus:border-cyan-400 rounded-lg p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/40 font-sans"
              />
            </div>

            {/* Prompt Quick Inspiration Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              <span className="text-[10px] text-slate-500 font-hud uppercase shrink-0">Sample:</span>
              {sampleVideoPrompts.map((sp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(sp);
                    soundEffects.playConfirm();
                  }}
                  className="px-2 py-1 rounded bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30 shrink-0 truncate max-w-[240px]"
                >
                  {sp}
                </button>
              ))}
            </div>

            {/* Config: Aspect Ratio & Resolution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-hud text-slate-400 uppercase tracking-wider block mb-1.5">
                  Aspect Ratio
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    className={`flex-1 py-1.5 rounded-lg border font-hud text-xs transition-colors ${
                      aspectRatio === '16:9'
                        ? 'bg-cyan-500 text-black font-bold border-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    16:9 Landscape
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('9:16')}
                    className={`flex-1 py-1.5 rounded-lg border font-hud text-xs transition-colors ${
                      aspectRatio === '9:16'
                        ? 'bg-cyan-500 text-black font-bold border-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    9:16 Portrait / Mobile
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-hud text-slate-400 uppercase tracking-wider block mb-1.5">
                  Resolution
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setResolution('720p')}
                    className={`flex-1 py-1.5 rounded-lg border font-hud text-xs transition-colors ${
                      resolution === '720p'
                        ? 'bg-cyan-500 text-black font-bold border-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    720p (High Performance)
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolution('1080p')}
                    className={`flex-1 py-1.5 rounded-lg border font-hud text-xs transition-colors ${
                      resolution === '1080p'
                        ? 'bg-cyan-500 text-black font-bold border-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    1080p Full HD
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Reference Image Upload */}
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-hud text-slate-300">
                  Reference Starting Frame (Optional)
                </span>
                {referenceImageBase64 && (
                  <button
                    type="button"
                    onClick={() => setReferenceImageBase64(null)}
                    className="text-[10px] text-red-400 hover:underline"
                  >
                    Remove Frame
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{referenceImageBase64 ? 'Change Frame' : 'Upload Image Frame'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {referenceImageBase64 && (
                  <img
                    src={referenceImageBase64}
                    alt="Reference"
                    className="w-12 h-12 object-cover rounded border border-cyan-500/40"
                  />
                )}
                <span className="text-[10px] text-slate-500">
                  {referenceImageBase64 ? 'Reference frame locked' : 'Provides visual context for video animation'}
                </span>
              </div>
            </div>

            {/* Generate Action Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-black font-hud font-bold text-sm tracking-wider uppercase transition-all flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              >
                {isGenerating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Video Stream ({elapsedSeconds}s)...</span>
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    <span>Generate Motion Video</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Active Rendering Progress Panel */}
          {isGenerating && (
            <div className="p-6 rounded-xl bg-black/80 border border-cyan-500/30 flex flex-col items-center justify-center space-y-3">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400 animate-spin" />
                <Video className="w-6 h-6 text-cyan-300 animate-pulse" />
              </div>

              <div className="text-center space-y-1">
                <div className="font-hud font-bold text-sm text-cyan-300">
                  {generationPhase === 'initiating' && 'DISPATCHING NEURAL VEO JOB...'}
                  {generationPhase === 'polling' && 'CALCULATING MOTION VECTORS...'}
                  {generationPhase === 'downloading' && 'STREAMING ENCODED MP4 ARTIFACT...'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Elapsed Time: {elapsedSeconds} seconds // Polling Google GenAI Veo cluster
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-hud font-bold">VIDEO GENERATION EXCEPTION:</span> {errorMsg}
                {errorHint && <p className="text-[11px] text-red-300/80">{errorHint}</p>}
              </div>
            </div>
          )}

          {/* Video Preview Player */}
          {currentVideo?.videoUrl && !isGenerating && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-cyan-300 text-xs font-hud">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-bold">VIDEO TELEMETRY READY</span>
                  <span className="text-slate-400 font-mono">({currentVideo.resolution} - {currentVideo.aspectRatio})</span>
                </div>

                <button
                  onClick={handleDownloadMp4}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-hud font-bold text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save MP4</span>
                </button>
              </div>

              {/* Video Player */}
              <div className="rounded-lg overflow-hidden border border-cyan-500/20 bg-black flex items-center justify-center">
                <video
                  src={currentVideo.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="max-h-[380px] w-full object-contain"
                />
              </div>

              <div className="text-[11px] text-slate-400 italic font-mono bg-black/40 p-2 rounded border border-slate-800">
                "{currentVideo.prompt}"
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
