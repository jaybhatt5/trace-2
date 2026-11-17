import React from 'react';
import { Camera, Film } from 'lucide-react';

interface SkeletonImageProps {
  mediaType?: 'image' | 'video';
  height?: string;
  className?: string;
  showScanningBeam?: boolean;
}

export const SkeletonImage: React.FC<SkeletonImageProps> = ({
  mediaType = 'image',
  height = 'h-72',
  className = '',
  showScanningBeam = true,
}) => {
  const Icon = mediaType === 'video' ? Film : Camera;

  return (
    <div
      className={`relative w-full ${height} rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/90 overflow-hidden flex flex-col items-center justify-center ${className}`}
      role="status"
    >
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="flex flex-col items-center gap-2.5 z-10 text-zinc-400 dark:text-zinc-600">
        <Icon className="w-8 h-8 animate-pulse" />
        <span className="text-xs font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          Scanning {mediaType === 'video' ? 'Video Frame Stream' : 'Raster Image'}...
        </span>
      </div>

      {/* Laser Scanning Beam */}
      {showScanningBeam && (
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-[scan_2.2s_ease-in-out_infinite]" />
      )}

      {/* Corner target reticles */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-zinc-400 dark:border-zinc-600" />
      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-zinc-400 dark:border-zinc-600" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-zinc-400 dark:border-zinc-600" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-zinc-400 dark:border-zinc-600" />
    </div>
  );
};
