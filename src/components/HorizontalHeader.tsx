import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Wifi, WifiOff, Zap, Clock, AlertTriangle, RefreshCw, Cpu, ChevronDown, Check, Sparkles, Lock } from 'lucide-react';
import { APIQuotaStats, AVAILABLE_API_MODELS, APIModelOption } from '../types';

interface HorizontalHeaderProps {
  quotaStats: APIQuotaStats;
  isOnline: boolean;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onManualPing?: () => void;
}

export const HorizontalHeader: React.FC<HorizontalHeaderProps> = ({
  quotaStats,
  isOnline,
  selectedModel,
  onSelectModel,
  onManualPing,
}) => {
  const [resetCountdown, setResetCountdown] = useState<string>('00:00:00');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    if (isModelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModelDropdownOpen]);

  // Format seconds to HH:MM:SS
  useEffect(() => {
    let seconds = quotaStats.estimatedResetSeconds;
    const timer = setInterval(() => {
      if (seconds > 0) {
        seconds -= 1;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        const pad = (n: number) => n.toString().padStart(2, '0');
        setResetCountdown(`${pad(h)}h ${pad(m)}m ${pad(s)}s`);
      } else {
        setResetCountdown('00h 00m 00s');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [quotaStats.estimatedResetSeconds]);

  const rpmPercent = Math.min(100, Math.round((quotaStats.requestsInLastMinute / quotaStats.maxRPM) * 100));
  const rpdPercent = Math.min(100, Math.round((quotaStats.requestsToday / quotaStats.maxRPD) * 100));

  const currentModel = AVAILABLE_API_MODELS.find((m) => m.id === selectedModel) || {
    id: selectedModel,
    name: selectedModel,
    shortName: selectedModel,
    provider: 'Google Gemini',
    description: 'Tùy chỉnh',
    tier: 'API Model',
  };

  return (
    <header className="w-full bg-white border-b border-slate-200/90 text-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs sticky top-0 z-50 backdrop-blur-md">
      {/* Brand Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center font-bold text-sm text-white shadow-2xs tracking-tight select-none">
          TJ
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base tracking-tight text-slate-900">
              TJ GUN <span className="text-indigo-600 font-bold">1.0</span>
            </h1>
            <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.2 rounded-full border border-slate-200">
              Free Tier Auto-Batch
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-normal hidden sm:block">
            Tự động tách SRT &amp; tạo Prompt tạo ảnh
          </p>
        </div>
      </div>

      {/* Center & Right: Quota, API Selector & Network Indicators (Horizontal) */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* API Model Selector & Status */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="h-7.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-lg px-2.5 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer group"
            title="Nhấp để đổi mô hình API"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-400 font-normal">API:</span>
              <span className="font-semibold text-slate-800 font-mono">
                {currentModel.name}
              </span>
            </div>
            <ChevronDown className={`w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Model Selection Dropdown Menu */}
          {isModelDropdownOpen && (
            <div className="absolute top-full right-0 sm:right-auto sm:left-0 mt-1.5 w-72 bg-white rounded-xl shadow-lg border border-slate-200/95 py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Chọn API Model
                </span>
                <span className="text-[10px] text-indigo-600 font-medium">
                  {AVAILABLE_API_MODELS.length} phiên bản
                </span>
              </div>

              <div className="py-1">
                {AVAILABLE_API_MODELS.map((model) => {
                  const isSelected = model.id === selectedModel;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        onSelectModel(model.id);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-start justify-between gap-2 text-xs hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-indigo-50/60' : ''
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold ${isSelected ? 'text-indigo-700' : 'text-slate-800'}`}>
                            {model.name}
                          </span>
                          {model.isRecommended && (
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.2 rounded-full border border-emerald-200">
                              Khuyên dùng
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">
                          {model.description}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {model.tier}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RPM Meter - Real Telemetry */}
        <div 
          className="h-7.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 flex items-center gap-1.5 select-none" 
          title="Tốc độ gọi API thực tế đo lường trong 60 giây gần nhất. Bất biến và hoàn toàn tự động."
        >
          <Zap className={`w-3.5 h-3.5 ${rpmPercent > 80 ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-400 font-normal">RPM:</span>
            <span className="font-semibold text-slate-800 font-mono">
              {quotaStats.requestsInLastMinute}/{quotaStats.maxRPM}
            </span>
          </div>
        </div>

        {/* Daily Quota Meter - Real Telemetry */}
        <div 
          className="h-7.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 flex items-center gap-1.5 select-none" 
          title="Số request API thực tế đã gọi hôm nay. Đo lường trực tiếp từ máy chủ, tuyệt đối không thể sửa bằng bất kỳ lệnh nào."
        >
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-400 font-normal">Ngày:</span>
            <span className="font-semibold text-slate-800 font-mono">
              {quotaStats.requestsToday}/{quotaStats.maxRPD}
            </span>
          </div>
        </div>

        {/* Quota Reset Countdown - Real Clock */}
        <div 
          className="h-7.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 flex items-center gap-1.5 select-none" 
          title="Thời gian thực đếm ngược đến lúc Google API reset hạn mức ngày (00:00 UTC)."
        >
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-400 font-normal">Reset:</span>
            <span className="font-mono font-medium text-slate-700">{resetCountdown}</span>
          </div>
        </div>

        {/* Immutable Telemetry Badge */}
        <div 
          className="hidden xl:flex items-center gap-1 h-7.5 px-2 bg-slate-100/70 border border-slate-200/80 rounded-lg text-[10px] text-slate-500 font-medium select-none"
          title="Chỉ số API thực tế được lấy từ cổng kết nối API gateway. Tuyệt đối không thể can thiệp hay sửa bằng bất kỳ lệnh nào."
        >
          <Lock className="w-3 h-3 text-slate-400" />
          <span>Chỉ số API thực</span>
        </div>

        {/* Network Status Badge */}
        <div
          className={`h-7.5 flex items-center gap-1.5 px-2.5 rounded-full text-xs font-medium border transition-colors ${
            isOnline
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200 animate-bounce'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-600" />
              <span className="text-[11px]">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-rose-600" />
              <span className="text-[11px]">Offline</span>
            </>
          )}

          {onManualPing && (
            <button
              onClick={onManualPing}
              className="ml-0.5 text-slate-400 hover:text-slate-700 transition-colors"
              title="Kiểm tra kết nối server"
            >
              <RefreshCw className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
