import React, { useState, useMemo } from 'react';
import { Clipboard, FileText, Check, AlertCircle, X, Sparkles, Clock, Layers } from 'lucide-react';
import { parseSRT, chunkSRTIntoScenes, secondsToTimeCode } from '../utils/srtParser';
import { SceneInterval } from '../types';
import { HUNTER_SRT_CONTENT } from '../data/hunterSrt';

interface PasteSRTModalProps {
  isOpen: boolean;
  onClose: () => void;
  interval: SceneInterval;
  onLoadContent: (content: string, fileName: string) => void;
}

export const PasteSRTModal: React.FC<PasteSRTModalProps> = ({
  isOpen,
  onClose,
  interval,
  onLoadContent,
}) => {
  const [content, setContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('Subtitles_Tu_Bo_Nho_Tam.srt');

  // Real-time analysis of pasted content
  const stats = useMemo(() => {
    if (!content.trim()) return null;
    const parsed = parseSRT(content);
    if (parsed.length === 0) return null;
    const chunked = chunkSRTIntoScenes(parsed, interval);
    const maxSec = Math.max(...parsed.map((p) => p.endSeconds), 0);
    return {
      subtitlesCount: parsed.length,
      scenesCount: chunked.length,
      duration: secondsToTimeCode(maxSec),
    };
  }, [content, interval]);

  if (!isOpen) return null;

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setContent(text);
      }
    } catch {
      // ignore
    }
  };

  const handleLoadHunterSample = () => {
    setContent(HUNTER_SRT_CONTENT);
    setFileName('Hunter_308_vs_65Creedmoor.srt');
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    onLoadContent(content, fileName || 'Subtitles.srt');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600">
              <Clipboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Dán nội dung File SRT trực tiếp</h3>
              <p className="text-[11px] text-slate-500">
                Dán văn bản phụ đề có timestamp để app tự động phân tích và tạo phân cảnh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="h-7.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors border border-slate-200 text-[11px]"
                title="Dán nhanh từ bộ nhớ đệm (Clipboard)"
              >
                <Clipboard className="w-3.5 h-3.5 text-slate-500" />
                <span>Dán từ Clipboard</span>
              </button>
              <button
                type="button"
                onClick={handleLoadHunterSample}
                className="h-7.5 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors border border-indigo-200 text-[11px]"
                title="Nạp nhanh file SRT Thợ Săn (308 Winchester vs 6.5 Creedmoor) bạn vừa gửi"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Nạp file SRT bạn vừa gửi (Thợ săn 308 vs 6.5)</span>
              </button>
            </div>

            {/* Subtitle name input */}
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Tên file (ví dụ: video_sub.srt)"
              className="h-7.5 px-2.5 text-[11px] font-mono rounded-lg border border-slate-200 bg-slate-50 text-slate-700 max-w-[200px]"
            />
          </div>

          {/* Text Area */}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Dán nội dung SRT vào đây...\n\nVí dụ:\n1\n00:00:00,520 --> 00:00:03,056\nFor years, you have probably heard the same thing.\n\n2\n00:00:03,140 --> 00:00:04,976\nThe three oh eight is obsolete...`}
              className="w-full h-64 p-3.5 font-mono text-xs text-slate-800 bg-slate-50/60 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y leading-relaxed"
            />
          </div>

          {/* Real-time Analysis Box */}
          {stats ? (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">{stats.subtitlesCount}</span>
                  <span className="text-emerald-700">câu thoại</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Thời lượng:</span>
                  <span className="font-mono font-semibold">{stats.duration}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Tạo thành:</span>
                  <span className="font-semibold text-slate-900 bg-emerald-200/60 px-1.5 py-0.5 rounded font-mono">
                    {stats.scenesCount} phân cảnh
                  </span>
                  <span className="text-emerald-700">({interval}s/cảnh)</span>
                </div>
              </div>
              <span className="text-[11px] font-medium bg-emerald-600 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                <Check className="w-3 h-3" /> Cấu trúc chuẩn
              </span>
            </div>
          ) : content.trim() ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-[11px]">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Chưa nhận diện được mốc thời gian chuẩn. Hãy chắc chắn có dòng chứa mốc thời gian định dạng{' '}
                <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">00:00:01,000 --&gt; 00:00:04,000</code>.
              </span>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-8.5 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!stats || stats.scenesCount === 0}
            className={`h-8.5 px-4 rounded-lg font-semibold text-xs flex items-center gap-2 transition-all shadow-2xs ${
              stats && stats.scenesCount > 0
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Nạp {stats ? `${stats.scenesCount} Phân Cảnh` : 'Phân Cảnh'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
