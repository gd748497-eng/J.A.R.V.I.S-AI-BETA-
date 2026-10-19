import React from 'react';
import {
  Volume2,
  Copy,
  ExternalLink,
  Check,
  Clock,
  Bell,
  CheckCircle2,
  FileText,
  CloudSun,
  Smartphone,
  BookmarkCheck,
  Calculator,
  Image as ImageIcon,
  Video,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ChatMessage, HudAccentColor } from '../types';
import { soundEffects } from '../services/audioSynthesizer';

interface ChatViewProps {
  messages: ChatMessage[];
  accentColor: HudAccentColor;
  userName?: string;
  onSpeak: (text: string) => void;
  onSelectAppIntent?: (appName: string, query?: string) => void;
  onOpenStudio?: (type: string, prompt?: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  accentColor,
  userName = 'Sir',
  onSpeak,
  onSelectAppIntent,
  onOpenStudio,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    soundEffects.playConfirm();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getAccentGlow = () => {
    switch (accentColor) {
      case 'gold':
        return 'border-amber-500/30 shadow-[0_0_15px_rgba(255,183,3,0.1)]';
      case 'crimson':
        return 'border-red-500/30 shadow-[0_0_15px_rgba(255,0,85,0.1)]';
      case 'emerald':
        return 'border-emerald-500/30 shadow-[0_0_15px_rgba(0,245,212,0.1)]';
      case 'violet':
        return 'border-purple-500/30 shadow-[0_0_15px_rgba(181,23,158,0.1)]';
      case 'cyan':
      default:
        return 'border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.1)]';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 space-y-3.5">
      {/* Cinematic Greeting Hero if early in conversation */}
      {messages.length <= 1 && (
        <div className="text-center py-4 px-2 space-y-1.5 select-none animate-fadeIn">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/25 text-[10px] font-mono text-cyan-300 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>NEURAL MATRIX STABILIZED // ONLINE</span>
          </div>

          <h2 className="font-hud text-lg sm:text-2xl font-black text-cyan-300 tracking-widest uppercase hud-glow mt-2">
            “GREETINGS, {userName.toUpperCase()}. I AM J.A.R.V.I.S.”
          </h2>

          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Blaze Revenant neural personal intelligence active. Voice uplink enabled in English, हिन्दी, and Hinglish.
          </p>
        </div>
      )}

      {/* Message Feed */}
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        return (
          <div
            key={msg.id}
            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
          >
            {/* Holographic Header Tag */}
            <div className="flex items-center space-x-2 mb-1 px-1">
              <span className="text-[9px] font-hud uppercase tracking-widest text-slate-500">
                {isUser ? 'TRANSMISSION // USER' : 'SYNTHESIS // J.A.R.V.I.S.'}
              </span>
              {msg.language && (
                <span className="text-[8px] px-1 py-0.2 rounded bg-black/80 text-cyan-400 border border-cyan-500/20 font-mono uppercase">
                  {msg.language}
                </span>
              )}
              <span className="text-[8px] text-slate-600 font-mono">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Message Bubble Panel */}
            <div
              className={`relative px-4 py-3 rounded-xl text-xs sm:text-sm max-w-2xl backdrop-blur-xl ${
                isUser
                  ? 'bg-blue-950/30 border border-blue-500/30 text-blue-100 shadow-[0_4px_20px_rgba(0,119,255,0.1)]'
                  : `bg-black/60 border ${getAccentGlow()} text-slate-100 hud-bracket`
              }`}
            >
              {/* Message Content */}
              <div className="whitespace-pre-wrap leading-relaxed break-words font-sans">
                {msg.text}
              </div>

              {/* Tool Execution Cards */}
              {msg.toolInvocations && msg.toolInvocations.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-cyan-500/15 space-y-2">
                  {msg.toolInvocations.map((t, idx) => (
                    <ToolExecutionCard
                      key={idx}
                      tool={t}
                      onSelectAppIntent={onSelectAppIntent}
                      onOpenStudio={onOpenStudio}
                    />
                  ))}
                </div>
              )}

              {/* Verified Web Search Grounding Citations */}
              {msg.groundingSources && msg.groundingSources.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                  <span className="text-[9px] font-hud text-slate-500 uppercase tracking-widest block mb-1">
                    VERIFIED TELEMETRY SOURCES
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.groundingSources.map((source, sIdx) => (
                      <a
                        key={sIdx}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-900/80 border border-cyan-500/25 text-cyan-300 hover:text-cyan-200 text-[11px] hover:border-cyan-400 transition-colors"
                      >
                        <ExternalLink className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{source.title || 'Telemetry Link'}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Assistant Message Actions */}
              {!isUser && (
                <div className="mt-2 flex items-center justify-end space-x-2 pt-1 border-t border-slate-900">
                  <button
                    onClick={() => onSpeak(msg.text)}
                    className="p-1 text-slate-500 hover:text-cyan-300 transition-colors"
                    title="Speak Aloud (TTS)"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="p-1 text-slate-500 hover:text-cyan-300 transition-colors"
                    title="Copy Text"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Render dedicated visual cards for executed tools
const ToolExecutionCard: React.FC<{
  tool: any;
  onSelectAppIntent?: (appName: string, query?: string) => void;
  onOpenStudio?: (type: string, prompt?: string) => void;
}> = ({ tool, onSelectAppIntent, onOpenStudio }) => {
  const { name, args, result } = tool;

  if (name === 'openCreativeStudio') {
    const type = args.studioType || 'image';
    return (
      <div className="p-2.5 rounded-lg bg-black/80 border border-cyan-500/30 text-cyan-200 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {type === 'video' ? (
            <Video className="w-4 h-4 text-cyan-400 shrink-0" />
          ) : type === 'gallery' ? (
            <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
          ) : type === 'apk' ? (
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          <div>
            <div className="font-hud font-bold text-cyan-200 text-xs">
              {type === 'video' ? 'AI VIDEO STUDIO READY' : type === 'gallery' ? 'MEDIA REPOSITORY' : type === 'apk' ? 'ANDROID ASSISTANT & APK ENGINE' : 'AI IMAGE STUDIO READY'}
            </div>
            <div className="text-[10px] text-slate-400">
              {args.prompt ? `"${args.prompt}"` : 'Creative neural synthesis tools initialized'}
            </div>
          </div>
        </div>
        <button
          onClick={() => onOpenStudio?.(type, args.prompt)}
          className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-hud text-[10px] font-bold transition-colors shrink-0"
        >
          LAUNCH
        </button>
      </div>
    );
  }

  if (name === 'setTimer') {
    return (
      <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/25 text-cyan-200 text-xs">
        <div className="flex items-center space-x-2">
          <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <div>
            <span className="font-hud font-bold">TIMER ACTIVE:</span> {args.label || 'Countdown'} ({args.durationSeconds}s)
          </div>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-cyan-900/40 text-[9px] font-mono text-cyan-300">
          RUNNING
        </span>
      </div>
    );
  }

  if (name === 'setAlarm') {
    return (
      <div className="flex items-center justify-between p-2 rounded-lg bg-amber-950/30 border border-amber-500/25 text-amber-200 text-xs">
        <div className="flex items-center space-x-2">
          <Bell className="w-3.5 h-3.5 text-amber-400" />
          <div>
            <span className="font-hud font-bold">ALARM ARMED:</span> {args.time} - {args.label || 'Alarm'}
          </div>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-amber-900/40 text-[9px] font-mono text-amber-300">
          ARMED
        </span>
      </div>
    );
  }

  if (name === 'createReminder') {
    return (
      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/25 text-emerald-200 text-xs">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <div>
            <span className="font-hud font-bold">REMINDER LOGGED:</span> {args.title}
          </div>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-[9px] font-mono text-emerald-300 uppercase">
          {args.priority || 'NORMAL'}
        </span>
      </div>
    );
  }

  if (name === 'takeNote') {
    return (
      <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800 text-slate-200 text-xs space-y-1">
        <div className="flex items-center space-x-1.5 text-cyan-300 font-hud">
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold">NOTE ARCHIVED: {args.title}</span>
        </div>
        <p className="text-slate-300 italic">{args.content}</p>
      </div>
    );
  }

  if (name === 'getWeather' && result?.weather) {
    const w = result.weather;
    return (
      <div className="p-2.5 rounded-lg bg-black/60 border border-cyan-500/30 text-cyan-100 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CloudSun className="w-4 h-4 text-amber-400" />
            <div>
              <div className="font-hud font-bold text-xs text-cyan-200">{w.location}</div>
              <div className="text-[10px] text-slate-400">{w.condition}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-hud font-bold text-amber-300">{Math.round(w.temperature)}°C</div>
            <div className="text-[9px] text-slate-500">Feels like {Math.round(w.apparentTemperature)}°C</div>
          </div>
        </div>
      </div>
    );
  }

  if (name === 'launchAndroidApp') {
    return (
      <div className="p-2 rounded-lg bg-slate-900/80 border border-cyan-500/30 text-cyan-200 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <div>
            <div className="font-hud font-bold text-[11px]">ANDROID INTENT: {String(args.appName).toUpperCase()}</div>
            <div className="text-[9px] text-slate-400">{args.action || 'open'} {args.query ? `("${args.query}")` : ''}</div>
          </div>
        </div>
        <button
          onClick={() => onSelectAppIntent?.(args.appName, args.query)}
          className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-hud text-[10px] font-bold transition-colors"
        >
          DISPATCH
        </button>
      </div>
    );
  }

  if (name === 'saveMemory') {
    return (
      <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-500/25 text-purple-200 text-xs flex items-center space-x-2">
        <BookmarkCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
        <div>
          <span className="font-hud font-bold">PERMANENT MEMORY COMMITTED:</span> {args.fact}
        </div>
      </div>
    );
  }

  if (name === 'calculate' && result) {
    return (
      <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calculator className="w-3.5 h-3.5 text-cyan-400" />
          <div>
            <span className="font-mono text-slate-400">{args.expression} =</span>{' '}
            <span className="font-hud font-bold text-cyan-300 text-sm">{result.result}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-1 rounded bg-black/60 border border-slate-800 text-[10px] text-slate-500 font-mono">
      TOOL: {name} ({JSON.stringify(args)})
    </div>
  );
};
