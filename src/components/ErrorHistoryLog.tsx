import React from 'react';
import { AlertOctagon, RefreshCw, Trash2, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ErrorLogEntry } from '../types';

interface ErrorHistoryLogProps {
  logs: ErrorLogEntry[];
  onRetryAllErrors: () => void;
  onClearErrorLog: () => void;
  isProcessing: boolean;
}

export const ErrorHistoryLog: React.FC<ErrorHistoryLogProps> = ({
  logs,
  onRetryAllErrors,
  onClearErrorLog,
  isProcessing,
}) => {
  if (logs.length === 0) {
    return (
      <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs my-2 text-center text-slate-500 text-xs sm:text-sm">
        <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold mb-1">
          <CheckCircle2 className="w-4 h-4" />
          <span>Không phát sinh lỗi nào!</span>
        </div>
        <p className="text-slate-500 text-xs">Hệ thống đang hoạt động mượt mà với API Google Free Tier.</p>
      </div>
    );
  }

  const unresolvedLogs = logs.filter(l => !l.resolved);

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs my-1 flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <h3 className="font-semibold text-slate-900 text-sm">
            Lịch Sử Lỗi ({logs.length})
          </h3>
          {unresolvedLogs.length > 0 && (
            <span className="text-[10px] bg-rose-50 text-rose-700 font-medium px-2 py-0.2 rounded-full border border-rose-200">
              {unresolvedLogs.length} chưa xử lý
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unresolvedLogs.length > 0 && (
            <button
              onClick={onRetryAllErrors}
              disabled={isProcessing}
              className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-2xs transition-colors active:scale-[0.98]"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Thử lại tất cả ({unresolvedLogs.length})</span>
            </button>
          )}

          <button
            onClick={onClearErrorLog}
            className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-medium border border-slate-200 shadow-2xs transition-colors"
          >
            <Trash2 className="w-3 h-3 text-slate-400" />
            <span>Xóa nhật ký</span>
          </button>
        </div>
      </div>

      {/* Log Items */}
      <div className="max-h-72 overflow-y-auto pr-1 flex flex-col gap-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className={`p-3.5 rounded-xl border text-xs font-sans transition-all ${
              log.resolved
                ? 'bg-slate-50 border-slate-200 text-slate-500'
                : 'bg-rose-50/70 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded text-[11px]">
                  Phân cảnh #{log.sceneIndex} ({log.timeCode})
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                  {log.errorType}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{log.timestamp}</span>
              </div>
            </div>

            <p className="font-semibold text-rose-800 text-xs mt-1">
              {log.message}
            </p>

            {log.detail && (
              <p className="text-[11px] text-slate-700 font-mono mt-1 bg-white p-2.5 rounded-lg border border-slate-200 whitespace-pre-wrap break-all">
                {log.detail}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
