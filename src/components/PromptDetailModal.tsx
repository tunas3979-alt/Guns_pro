import React, { useState } from 'react';
import { Copy, Check, X, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PromptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sceneIndex: number;
  timeCode: string;
  srtText: string;
  prompt: string;
  generatedAt?: string;
}

export const PromptDetailModal: React.FC<PromptDetailModalProps> = ({
  isOpen,
  onClose,
  sceneIndex,
  timeCode,
  srtText,
  prompt,
  generatedAt,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                Scene #{sceneIndex}
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {timeCode}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
            {/* Subtitle context */}
            <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-slate-500 font-semibold block mb-1">Nội dung phụ đề SRT:</span>
              <p className="text-slate-800 italic leading-relaxed">"{srtText}"</p>
            </div>

            {/* Prompt full display */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Chi tiết toàn bộ Prompt tạo ảnh:</span>
                </span>
                {generatedAt && (
                  <span className="text-[11px] text-slate-400 font-mono">{generatedAt}</span>
                )}
              </div>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs leading-relaxed border border-slate-800 whitespace-pre-wrap selection:bg-indigo-600 selection:text-white max-h-[300px] overflow-y-auto">
                {prompt}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-slate-400">
              Tổng số ký tự: <strong className="font-mono text-slate-600">{prompt.length}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-4 h-8 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép Prompt</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 h-8 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
