import React from 'react';
import { FileText, AlertCircle, PlayCircle, Clock, CheckCircle2, Zap } from 'lucide-react';
import { ProcessingState, ConcurrencyMode } from '../types';

interface StatusBarProps {
  fileName?: string;
  currentSceneIndex: number;
  totalScenes: number;
  unresolvedErrorsCount: number;
  totalErrorsCount: number;
  currentTimeCode: string;
  totalDurationTimeCode: string;
  processingState: ProcessingState;
  concurrencyMode?: ConcurrencyMode;
  activeWorkersCount?: number;
  onRetryAllErrors?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  fileName = 'Chưa tải file',
  currentSceneIndex,
  totalScenes,
  unresolvedErrorsCount,
  totalErrorsCount,
  currentTimeCode,
  totalDurationTimeCode,
  processingState,
  concurrencyMode = 'auto',
  activeWorkersCount = 0,
  onRetryAllErrors,
}) => {
  const isRunning = processingState === 'running';

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-xl px-3.5 py-1.5 shadow-2xs my-1 flex flex-wrap items-center justify-between gap-2 text-xs">
      {/* 1. File & Scene Progress Label */}
      <div className="h-7 inline-flex items-center gap-2 font-medium text-slate-700 bg-slate-50 border border-slate-200 px-2.5 rounded-lg">
        <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Tệp:</span>
          <span className="font-semibold text-slate-800 font-mono truncate max-w-[140px]">{fileName}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-400">Tiến trình:</span>
          <span className="font-semibold text-slate-900 font-mono">
            {currentSceneIndex}/{totalScenes}
          </span>
        </div>
      </div>

      {/* 2. SRT Time Progress Label */}
      <div className="h-7 inline-flex items-center gap-1.5 bg-slate-50 px-2.5 rounded-lg border border-slate-200 text-slate-600 font-mono text-[11px]">
        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
        <span>
          Khung giờ:{' '}
          <strong className="text-slate-800 font-semibold">{currentTimeCode || '00:00:00'}</strong>
          <span className="text-slate-300"> / </span>
          <span className="text-slate-500">{totalDurationTimeCode || '00:00:00'}</span>
        </span>
      </div>

      {/* 3. Thread Concurrency Indicator */}
      <div className="h-7 inline-flex items-center gap-1.5 bg-slate-50 px-2.5 rounded-lg border border-slate-200 text-slate-600 text-[11px]">
        <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>Luồng:</span>
        <span className="font-semibold text-slate-800 font-mono">
          {concurrencyMode === 'auto' ? 'Auto (Free Tier)' : `${concurrencyMode} Threads`}
        </span>
        {isRunning && (
          <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded bg-amber-100/70 text-amber-800 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {activeWorkersCount > 0 ? `${activeWorkersCount} đang chạy` : 'chờ'}
          </span>
        )}
      </div>

      {/* 4. Error Counter Label & Retry Trigger */}
      <div className="flex items-center gap-2">
        {unresolvedErrorsCount > 0 && onRetryAllErrors ? (
          <button
            type="button"
            onClick={onRetryAllErrors}
            disabled={isRunning}
            className={`h-7 inline-flex items-center gap-1.5 px-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              isRunning
                ? 'bg-rose-50 text-rose-400 border-rose-200 cursor-not-allowed'
                : 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300 shadow-2xs active:scale-[0.98]'
            }`}
            title="Thử lại thủ công ngay tất cả phân cảnh bị lỗi"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>
              Lỗi: <strong className="text-rose-700">{unresolvedErrorsCount}/{totalScenes}</strong> (Bấm chạy lại)
            </span>
          </button>
        ) : (
          <div
            className={`h-7 inline-flex items-center gap-1 px-2.5 rounded-lg border text-xs font-medium ${
              unresolvedErrorsCount > 0
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {unresolvedErrorsCount > 0 ? (
              <AlertCircle className="w-3 h-3 text-rose-500" />
            ) : (
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            )}
            <span>
              Lỗi:{' '}
              <span className="font-semibold">
                {unresolvedErrorsCount}/{totalScenes}
              </span>
            </span>
          </div>
        )}

        {totalErrorsCount > 0 && (
          <span className="text-[11px] text-slate-400 font-medium">
            (Tổng: {totalErrorsCount})
          </span>
        )}
      </div>
    </div>
  );
};
