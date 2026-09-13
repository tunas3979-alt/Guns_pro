import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, PauseCircle, Clock, Zap, ShieldAlert, Cpu } from 'lucide-react';

interface QuotaRateLimitModalProps {
  isOpen: boolean;
  modelName: string;
  countdownSeconds: number;
  isDailyQuota?: boolean;
  message?: string;
  onRetryNow: () => void;
  onPauseBatch: () => void;
}

export const QuotaRateLimitModal: React.FC<QuotaRateLimitModalProps> = ({
  isOpen,
  modelName,
  countdownSeconds,
  isDailyQuota = false,
  message,
  onRetryNow,
  onPauseBatch,
}) => {
  const [currentCountdown, setCurrentCountdown] = useState<number>(countdownSeconds);

  useEffect(() => {
    setCurrentCountdown(countdownSeconds);
  }, [countdownSeconds]);

  useEffect(() => {
    if (!isOpen || currentCountdown <= 0) return;

    const timer = setInterval(() => {
      setCurrentCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onRetryNow(); // Auto retry when countdown hits 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, currentCountdown, onRetryNow]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m > 0) {
      return `${m}m ${s < 10 ? '0' : ''}${s}s`;
    }
    return `${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-2 border-amber-400 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500 animate-pulse" />

        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-1">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                429 Rate Limit
              </span>
              <span className="text-xs text-slate-400 font-mono">Google Gemini API</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Chạm Hạn Ngạch API
            </h3>

            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Phiên bản <strong className="text-slate-900 font-semibold">{modelName}</strong> tạm thời vượt quá giới hạn lượt gọi API (Rate Limit 429).
            </p>

            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tự động thử lại sau:</span>
                </span>
                <span className="text-lg font-extrabold font-mono text-amber-600 animate-pulse">
                  {formatTime(currentCountdown)}
                </span>
              </div>

              <div className="w-full bg-slate-200 h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(100, (currentCountdown / (countdownSeconds || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 font-normal italic">
              * Mặc định ứng dụng giữ nguyên phiên bản <strong>{modelName}</strong> và không tự đổi model. Sau khi hết đếm ngược, ứng dụng sẽ tự động tiếp tục xử lý.
            </p>

            <div className="mt-5 flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={onPauseBatch}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <PauseCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>Tạm dừng</span>
              </button>

              <button
                type="button"
                onClick={onRetryNow}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử lại ngay</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
