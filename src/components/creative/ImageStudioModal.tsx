import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Download,
  Image as ImageIcon,
  Copy,
  Check,
  Maximize2,
  RefreshCw,
  AlertCircle,
  FolderPlus,
  Layers,
} from 'lucide-react';
import { GeneratedImage } from '../../types';
import { mediaGalleryService } from '../../services/mediaGalleryService';
import { soundEffects } from '../../services/audioSynthesizer';

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGallery?: () => void;
}

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  onClose,
  onOpenGallery,
}) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('hologram');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [savedToGallery, setSavedToGallery] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!isOpen) return null;

  const styles = [
    { id: 'hologram', label: 'Holographic HUD', desc: 'Glowing cyan laser vector blueprint on dark field' },
    { id: 'blueprint', label: 'Blaze Blueprint', desc: 'Technical CAD schematics with engineering annotations' },
    { id: 'cyberpunk', label: 'Cyberpunk Neon', desc: 'Futuristic metropolis with volumetric reflections' },
    { id: 'photorealistic', label: 'Photorealistic 8K', desc: 'Hyper-detailed cinematic photography' },
    { id: 'cinematic', label: 'Cinematic Concept', desc: 'Epic sci-fi blockbuster movie still' },
    { id: 'anime_mecha', label: 'Anime Mecha', desc: 'Armored titanium combat robot anime style' },
  ];

  const aspectRatios: Array<{ id: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'; label: string; iconShape: string }> = [
    { id: '1:1', label: '1:1 Square', iconShape: 'w-4 h-4' },
    { id: '16:9', label: '16:9 Wide', iconShape: 'w-5 h-3' },
    { id: '9:16', label: '9:16 Mobile', iconShape: 'w-3 h-5' },
    { id: '4:3', label: '4:3 Standard', iconShape: 'w-4 h-3.5' },
    { id: '3:4', label: '3:4 Portrait', iconShape: 'w-3.5 h-4' },
  ];

  const samplePrompts = [
    'Blaze Revenant neural core arc reactor assembly line in 3D holographic projection',
    'Futuristic tactical HUD visor display tracking atmospheric flight telemetry',
    'Autonomous AI drone hovering above neon skyline with glowing propulsion thrusters',
    'Quantum processor chip schematic glowing with crystalline energy conduits',
  ];

  const handleEnhancePrompt = () => {
    if (!prompt.trim()) {
      setPrompt('Blaze Revenant Mark 85 holographic power core with glowing repulsor telemetry');
    } else {
      setPrompt(`${prompt.trim()}, intricate mechanical details, cinematic volumetric rim lighting, 8k resolution, Blaze Revenant aesthetic`);
    }
    soundEffects.playConfirm();
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMsg(null);
    setSavedToGallery(false);
    soundEffects.playProcessingPulse();

    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style,
          aspectRatio,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Image generation failed');
      }

      const generated: GeneratedImage = {
        id: 'img-' + Date.now(),
        prompt: prompt.trim(),
        style,
        aspectRatio,
        imageUrl: data.imageUrl,
        createdAt: Date.now(),
      };

      setCurrentImage(generated);
      // Auto save to gallery
      mediaGalleryService.addImage({
        prompt: prompt.trim(),
        style,
        aspectRatio,
        imageUrl: data.imageUrl,
      });
      setSavedToGallery(true);
      soundEffects.playConfirm();
    } catch (err: any) {
      console.error('Image Studio error:', err);
      setErrorMsg(err.message || 'Rendering matrix disruption');
      soundEffects.playAlert();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!currentImage) return;
    const a = document.createElement('a');
    a.href = currentImage.imageUrl;
    a.download = `jarvis-render-${Date.now()}.png`;
    a.click();
    soundEffects.playConfirm();
  };

  const handleCopyPrompt = () => {
    if (!currentImage) return;
    navigator.clipboard.writeText(currentImage.prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-950 border border-cyan-500/40 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_0_35px_rgba(0,240,255,0.25)] hud-bracket overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/30 bg-black/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-hud text-base font-bold text-cyan-300 tracking-wider">
                AI IMAGE STUDIO // NEURAL SYNTHESIZER
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                Model: gemini-3.1-flash-lite-image
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Prompt Section */}
          <form onSubmit={handleGenerate} className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-hud text-cyan-300 uppercase tracking-wider">
                  Visual Generation Prompt
                </label>
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  className="flex items-center space-x-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-hud"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Enhance Prompt</span>
                </button>
              </div>

              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your concept (e.g. 'Holographic suit HUD displaying orbital re-entry trajectory with glowing cyan telemetry')..."
                className="w-full bg-black/80 border border-cyan-500/30 focus:border-cyan-400 rounded-lg p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/40 font-sans"
              />
            </div>

            {/* Prompt Quick Inspiration Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              <span className="text-[10px] text-slate-500 font-hud uppercase shrink-0">Sample:</span>
              {samplePrompts.map((sp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(sp);
                    soundEffects.playConfirm();
                  }}
                  className="px-2 py-1 rounded bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30 shrink-0 truncate max-w-[220px]"
                >
                  {sp}
                </button>
              ))}
            </div>

            {/* Visual Style Selection */}
            <div>
              <label className="text-xs font-hud text-slate-400 uppercase tracking-wider block mb-1.5">
                Stylistic Matrix
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {styles.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    className={`p-2 rounded-lg border text-left transition-colors ${
                      style === s.id
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-hud font-bold text-xs">{s.label}</div>
                    <div className="text-[10px] text-slate-500 truncate">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selection */}
            <div>
              <label className="text-xs font-hud text-slate-400 uppercase tracking-wider block mb-1.5">
                Aspect Ratio
              </label>
              <div className="flex flex-wrap gap-2">
                {aspectRatios.map((ar) => (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => setAspectRatio(ar.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-hud transition-colors ${
                      aspectRatio === ar.id
                        ? 'bg-cyan-500 text-black font-bold border-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className={`border border-current rounded-sm ${ar.iconShape}`} />
                    <span>{ar.label}</span>
                  </button>
                ))}
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
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Neural Rendering in Progress...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Synthesize Image Telemetry</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-hud font-bold">GENERATION EXCEPTION:</span> {errorMsg}
                <p className="text-[11px] text-red-300/80">
                  Note: The image generation model requires an API key with standard GenAI capabilities. If quota limits are reached, please check your project setup.
                </p>
              </div>
            </div>
          )}

          {/* Loading Hologram Animation */}
          {isGenerating && (
            <div className="p-8 rounded-xl bg-black/60 border border-cyan-500/30 flex flex-col items-center justify-center space-y-3">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
                <div className="absolute inset-2 rounded-full border-2 border-cyan-500/30" />
                <Sparkles className="w-8 h-8 text-cyan-300 animate-pulse" />
              </div>
              <div className="text-center">
                <span className="font-hud font-bold text-sm text-cyan-300 block">
                  SYNTHESIZING PIXEL VECTORS
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Diffusing visual latents under {style.toUpperCase()} protocol...
                </span>
              </div>
            </div>
          )}

          {/* Generated Result Preview */}
          {currentImage && !isGenerating && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-cyan-300 text-xs font-hud">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-bold">RENDER TELEMETRY COMPLETE</span>
                  <span className="text-slate-400 font-mono">({currentImage.aspectRatio})</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={handleCopyPrompt}
                    className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
                    title="Copy Prompt"
                  >
                    {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setIsLightboxOpen(true)}
                    className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
                    title="View Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-hud font-bold text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save PNG</span>
                  </button>
                </div>
              </div>

              {/* Image Preview Container */}
              <div className="relative rounded-lg overflow-hidden border border-cyan-500/20 bg-black flex items-center justify-center max-h-[380px]">
                <img
                  src={currentImage.imageUrl}
                  alt={currentImage.prompt}
                  className="max-h-[380px] w-auto object-contain cursor-pointer"
                  onClick={() => setIsLightboxOpen(true)}
                />
              </div>

              <div className="text-[11px] text-slate-400 italic font-mono bg-black/40 p-2 rounded border border-slate-800">
                "{currentImage.prompt}"
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && currentImage && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 border border-cyan-500 text-cyan-300"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={currentImage.imageUrl}
            alt={currentImage.prompt}
            className="max-w-full max-h-[85vh] object-contain rounded-lg border border-cyan-500/50 shadow-[0_0_40px_rgba(0,240,255,0.3)]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
