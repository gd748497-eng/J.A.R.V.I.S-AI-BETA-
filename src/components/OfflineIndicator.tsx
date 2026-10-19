import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-4 z-50 flex items-center space-x-2.5 rounded-lg bg-amber-950/90 border border-amber-500/60 px-3.5 py-2 text-xs font-mono text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.3)] backdrop-blur-md animate-bounce">
      <div className="relative flex items-center justify-center">
        <WifiOff className="w-4 h-4 text-amber-400" />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
      </div>
      <div>
        <span className="font-hud font-bold tracking-wider block">OFFLINE MODE ACTIVE</span>
        <span className="text-[10px] text-amber-300/80">Local Core Cache & Voice Synthesizer Ready</span>
      </div>
    </div>
  );
};
