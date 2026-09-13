import React, { useRef } from 'react';
import { Play, Pause, Square, RotateCcw, Download, Upload, Clock, SlidersHorizontal, Check, Zap, Clipboard, RefreshCw } from 'lucide-react';
import { ProcessingState, SceneInterval, ConcurrencyMode } from '../types';

interface ControlToolbarProps {
  processingState: ProcessingState;
  interval: SceneInterval;
  concurrencyMode: ConcurrencyMode;
  onConcurrencyModeChange: (mode: ConcurrencyMode) => void;
  autoRetryErrors?: boolean;
  onToggleAutoRetryErrors?: () => void;
  onRetryAllErrors?: () => void;
  unresolvedErrorsCount?: number;
  hasSRTLoaded: boolean;
  totalScenesCount: number;
  completedScenesCount: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onClearCache: () => void;
  onExportTxt: () => void;
  onSRTFileUpload: (file: File) => void;
  onOpenPasteModal?: () => void;
  onIntervalChange: (newInterval: SceneInterval) => void;
  loadedFileName?: string;
  isRecentlyCleared?: boolean;
}

export const ControlToolbar: React.FC<ControlToolbarProps> = ({
  processingState,
  interval,
  concurrencyMode,
  onConcurrencyModeChange,
  autoRetryErrors = true,
  onToggleAutoRetryErrors,
  onRetryAllErrors,
  unresolvedErrorsCount = 0,
  hasSRTLoaded,
  totalScenesCount,
  completedScenesCount,
  onStart,
  onPause,
  onResume,
  onStop,
  onClearCache,
  onExportTxt,
  onSRTFileUpload,
  onOpenPasteModal,
  onIntervalChange,
  loadedFileName,
  isRecentlyCleared,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSRTFileUpload(file);
      // Reset input value so same file can be chosen again if needed
      e.target.value = '';
    }
  };

  const isRunning = processingState === 'running';
  const isPaused = processingState === 'paused';
  const isIdle = processingState === 'idle' || processingState === 'stopped' || processingState === 'completed';

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 my-1">
      {/* Left: SRT File Upload & Duration Selector */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".srt,.txt,.vtt"
          className="hidden"
        />

        {/* Upload SRT Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isRunning}
          className={`h-8 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
            isRunning
              ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
              : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-2xs active:scale-[0.98]'
          }`}
          title="Chọn tệp phụ đề .SRT từ máy tính (hỗ trợ mọi định dạng encoding UTF-8, UTF-16, ANSI)"
        >
          <Upload className="w-3.5 h-3.5 text-slate-300" />
          <span>{loadedFileName ? 'Đổi tệp SRT' : 'Import File SRT'}</span>
        </button>

        {/* Paste Raw SRT Button */}
        {onOpenPasteModal && (
          <button
            onClick={onOpenPasteModal}
            disabled={isRunning}
            className={`h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
              isRunning
                ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 active:scale-[0.98]'
            }`}
            title="Dán trực tiếp nội dung file phụ đề SRT từ clipboard"
          >
            <Clipboard className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Dán SRT</span>
          </button>
        )}

        {/* Loaded File Info Badge */}
        {loadedFileName && (
          <div className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-mono bg-slate-50 border border-slate-200 text-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="truncate max-w-[150px] font-medium">{loadedFileName}</span>
            <span className="text-slate-400 text-[11px]">({totalScenesCount} cảnh)</span>
          </div>
        )}

        {/* Time Interval Selector (5s, 10s, 15s, 20s) */}
        <div className="h-8 inline-flex items-center bg-slate-100/80 border border-slate-200 rounded-lg p-0.5 text-xs">
          <div className="flex items-center gap-1 px-2 text-slate-500 text-[11px] font-medium border-r border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="hidden sm:inline">Khung:</span>
          </div>
          {([5, 10, 15, 20] as SceneInterval[]).map((num) => (
            <button
              key={num}
              onClick={() => onIntervalChange(num)}
              disabled={isRunning}
              className={`h-6.5 px-2 rounded-md font-medium text-xs transition-all ${
                interval === num
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900'
              } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={`Chia kịch bản SRT theo từng ${num}s per prompt`}
            >
              {num}s
            </button>
          ))}
        </div>

        {/* Concurrency / Thread Speed Selector (Auto, 1, 2, 3) */}
        <div className="h-8 inline-flex items-center bg-slate-100/80 border border-slate-200 rounded-lg p-0.5 text-xs">
          <div className="flex items-center gap-1 px-2 text-slate-500 text-[11px] font-medium border-r border-slate-200">
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="hidden sm:inline">Luồng:</span>
          </div>
          {(['auto', 1, 2, 3] as ConcurrencyMode[]).map((mode) => {
            const isSelected = concurrencyMode === mode;
            return (
              <button
                key={mode.toString()}
                type="button"
                onClick={() => onConcurrencyModeChange(mode)}
                className={`h-6.5 px-2 rounded-md font-medium text-xs transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200/90'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title={
                  mode === 'auto'
                    ? 'Auto (Tối ưu Free Tier): Tự động 2 luồng song song với nhịp độ an toàn (10-12 RPM), chống lỗi 429'
                    : mode === 1
                    ? '1 Luồng: Chạy tuần tự 1 prompt một lúc'
                    : mode === 2
                    ? '2 Luồng: Chạy song song 2 prompt đồng thời'
                    : '3 Luồng: Tối đa 3 prompt đồng loạt (tốc độ cao)'
                }
              >
                <span>{mode === 'auto' ? 'Auto' : `${mode}`}</span>
                {mode === 'auto' && (
                  <span className="hidden md:inline-block text-[9px] bg-emerald-100 text-emerald-700 font-semibold px-1 rounded">
                    Free
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Auto-Retry Errors Toggle Button */}
        {onToggleAutoRetryErrors && (
          <button
            type="button"
            onClick={onToggleAutoRetryErrors}
            className={`h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              autoRetryErrors
                ? 'bg-amber-50 hover:bg-amber-100/90 text-amber-800 border-amber-300 shadow-2xs font-semibold'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
            }`}
            title="Tự động thử lại tất cả phân cảnh bị lỗi sau khi đã hoàn thành hết nội dung danh sách ban đầu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRetryErrors ? 'text-amber-600 animate-spin-slow' : 'text-slate-400'}`} />
            <span>Tự thử lại lỗi: <strong className={autoRetryErrors ? 'text-amber-700' : 'text-slate-600'}>{autoRetryErrors ? 'Bật' : 'Tắt'}</strong></span>
          </button>
        )}
      </div>

      {/* Right: Main Action Control Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto py-0.5">
        {/* Start Button */}
        {isIdle && (
          <button
            onClick={onStart}
            disabled={!hasSRTLoaded}
            className={`h-8 inline-flex items-center gap-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all border ${
              !hasSRTLoaded
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-2xs active:scale-[0.98]'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Bắt Đầu</span>
          </button>
        )}

        {/* Pause Button */}
        {isRunning && (
          <button
            onClick={onPause}
            className="h-8 inline-flex items-center gap-1.5 px-3.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-white border border-amber-500 shadow-2xs active:scale-[0.98] transition-all"
          >
            <Pause className="w-3 h-3 fill-current" />
            <span>Tạm Dừng</span>
          </button>
        )}

        {/* Resume Button */}
        {isPaused && (
          <button
            onClick={onResume}
            className="h-8 inline-flex items-center gap-1.5 px-3.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600 shadow-2xs active:scale-[0.98] transition-all"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Tiếp Tục</span>
          </button>
        )}

        {/* Stop Button */}
        {(isRunning || isPaused) && (
          <button
            onClick={onStop}
            className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white border border-rose-600 shadow-2xs active:scale-[0.98] transition-all"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Dừng Hẳn</span>
          </button>
        )}

        {/* Manual Retry All Errors Button */}
        {onRetryAllErrors && unresolvedErrorsCount > 0 && (
          <button
            type="button"
            onClick={onRetryAllErrors}
            disabled={isRunning}
            className={`h-8 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isRunning
                ? 'bg-rose-50 text-rose-300 border-rose-200 cursor-not-allowed'
                : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-600 shadow-2xs active:scale-[0.98]'
            }`}
            title="Chạy lại ngay lập tức tất cả các phân cảnh đang bị lỗi"
          >
            <RotateCcw className="w-3.5 h-3.5 text-white" />
            <span>Thử Lại Lỗi ({unresolvedErrorsCount})</span>
          </button>
        )}

        {/* Clear Cache & History Button */}
        <button
          onClick={onClearCache}
          disabled={isRunning}
          className={`h-8 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${
            isRunning
              ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
              : isRecentlyCleared
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs font-semibold'
              : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200 shadow-2xs active:scale-[0.98]'
          }`}
          title="Làm mới tiến trình & xóa lịch sử trước khi chạy file tiếp theo. Giữ nguyên Character & Visual Style setup."
        >
          {isRecentlyCleared ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in-50 duration-200" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="hidden sm:inline">
            {isRecentlyCleared ? 'Đã Xóa Cache!' : 'Xóa Cache'}
          </span>
          <span className="sm:hidden">
            {isRecentlyCleared ? 'Đã Xóa!' : 'Reset'}
          </span>
        </button>

        {/* Export TXT Button */}
        <button
          onClick={onExportTxt}
          disabled={completedScenesCount === 0}
          className={`h-8 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium transition-all border ${
            completedScenesCount === 0
              ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs active:scale-[0.98]'
          }`}
          title="Xuất file .txt toàn bộ prompt đã sinh ra (cách nhau \n\n)"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Xuất TXT ({completedScenesCount})</span>
        </button>
      </div>
    </div>
  );
};
