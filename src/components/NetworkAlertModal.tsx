import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface NetworkAlertModalProps {
  isOnline: boolean;
  offlineDurationSeconds: number; // How long connection has been lost
  onManualReconnect: () => void;
}

export const NetworkAlertModal: React.FC<NetworkAlertModalProps> = ({
  isOnline,
  offlineDurationSeconds,
  onManualReconnect,
}) => {
  const [autoRetryCountdown, setAutoRetryCountdown] = useState<number>(100);

  // If offline for > 30s, run 100s countdown loop to re-check connection
  useEffect(() => {
    if (isOnline) {
      setAutoRetryCountdown(100);
      return;
    }

    if (offlineDurationSeconds >= 30) {
      const interval = setInterval(() => {
        setAutoRetryCountdown((prev) => {
          if (prev <= 1) {
            onManualReconnect();
            return 100; // Reset countdown for next 100s cycle
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOnline, offlineDurationSeconds, onManualReconnect]);

  if (isOnline) return null;

  const isOver30s = offlineDurationSeconds >= 30;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full p-4 bg-white border-2 border-rose-400 rounded-2xl shadow-2xl text-slate-800 backdrop-blur-lg">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600 shrink-0 mt-0.5">
          <WifiOff className="w-5 h-5 animate-bounce" />
        </div>

        <div className="flex-1">
          <h4 className="font-extrabold text-rose-700 text-sm flex items-center gap-2">
            <span>MẤT KẾT NỐI MẠNG HOẶC CHẬP CHỜN!</span>
          </h4>

          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Hệ thống tạm dừng tiến trình tạo prompt để bảo vệ dữ liệu kịch bản.
          </p>

          {isOver30s ? (
            <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-700 font-medium">
                Mất mạng trên 30s. Tự động kiểm tra trong:{' '}
                <strong className="text-rose-600 font-mono text-sm">{autoRetryCountdown}s</strong>
              </span>
              <button
                onClick={onManualReconnect}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Kiểm tra ngay</span>
              </button>
            </div>
          ) : (
            <div className="mt-2 text-[11px] text-rose-600 font-medium italic">
              Đã mất kết nối {offlineDurationSeconds}s. Nếu vượt quá 30s sẽ bắt đầu đếm ngược 100s/lần tự động kiểm tra lại.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
