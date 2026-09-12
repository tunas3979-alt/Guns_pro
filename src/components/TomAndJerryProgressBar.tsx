import React from 'react';
import { motion } from 'motion/react';

interface TomAndJerryProgressBarProps {
  progress: number; // 0 to 100
  currentScene: number;
  totalScenes: number;
  statusText?: string;
}

export const TomAndJerryProgressBar: React.FC<TomAndJerryProgressBarProps> = ({
  progress,
  currentScene,
  totalScenes,
  statusText,
}) => {
  const safeProgress = Math.min(100, Math.max(0, progress));
  
  // Jerry runs ahead, Tom chases behind!
  const jerryPos = Math.min(96, Math.max(4, safeProgress));
  const tomPos = Math.max(0, jerryPos - 8);

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 shadow-2xs my-1">
      {/* Header Info */}
      <div className="flex items-center justify-between text-xs mb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-slate-500 font-medium">
            Tiến độ:
          </span>
          <span className="text-slate-900 font-bold text-sm font-mono">
            {safeProgress.toFixed(1)}%
          </span>
          {totalScenes > 0 && (
            <span className="text-slate-400 text-[11px] font-mono">
              ({currentScene}/{totalScenes} phân cảnh)
            </span>
          )}
        </div>
        <div className="text-slate-500 text-[11px] font-medium bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200 flex items-center gap-1.5">
          <span>{statusText || (safeProgress === 100 ? '🎉 Hoàn tất kịch bản' : '🐱 Tom & Jerry 🐭')}</span>
        </div>
      </div>

      {/* Sleek Progress Track */}
      <div className="relative h-7 bg-slate-100 rounded-full border border-slate-200 p-0.5 overflow-visible flex items-center">
        {/* Filled Progress Bar */}
        <motion.div
          className="h-full bg-slate-900 rounded-full transition-all duration-300"
          style={{ width: `${Math.max(2, safeProgress)}%` }}
        />

        {/* Tom (Cat) - Miniature Tracker */}
        <motion.div
          className="absolute z-10 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
          animate={{ left: `${tomPos}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <motion.div
            animate={{ y: [0, -1.5, 0] }}
            transition={{ repeat: Infinity, duration: 0.4 }}
            className="w-6 h-6 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center shadow-xs text-xs select-none"
            title="Tom"
          >
            🐱
          </motion.div>
        </motion.div>

        {/* Jerry (Mouse) - Miniature Leader */}
        <motion.div
          className="absolute z-20 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
          animate={{ left: `${jerryPos}%` }}
          transition={{ type: 'spring', stiffness: 140, damping: 18 }}
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ repeat: Infinity, duration: 0.35 }}
            className="w-6 h-6 bg-amber-400 border border-amber-300 rounded-full flex items-center justify-center shadow-xs text-xs select-none"
            title="Jerry"
          >
            🐭
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
