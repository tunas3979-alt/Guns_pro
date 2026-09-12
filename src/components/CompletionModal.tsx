import React, { useEffect, useState } from 'react';
import { Download, Volume2, VolumeX, CheckCircle2, Sparkles, FileText, BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { completionAudioAlert } from '../utils/audioAlert';

interface CompletionModalProps {
  isOpen: boolean;
  loadedFileName: string;
  totalScenes: number;
  onConfirmDownload: () => void;
  onDismiss: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  loadedFileName,
  totalScenes,
  onConfirmDownload,
  onDismiss,
}) => {
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Compute exact target download filename: tên file import + PromptTJ.txt
  const baseName = loadedFileName.replace(/\.[^/.]+$/, '');
  const targetFileName = `${baseName}PromptTJ.txt`;

  const toggleMute = () => {
    if (isAudioMuted) {
      completionAudioAlert.start();
      setIsAudioMuted(false);
    } else {
      completionAudioAlert.stop();
      setIsAudioMuted(true);
    }
  };

  const handleConfirm = () => {
    completionAudioAlert.stop();
    onConfirmDownload();
  };

  const handleCloseOnly = () => {
    completionAudioAlert.stop();
    onDismiss();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
        >
          {/* Top Banner with animated chime indicator */}
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>Tiến độ đã đạt 100%!</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h3>
                <p className="text-[11px] text-slate-300">
                  Đã sinh xong toàn bộ {totalScenes} phân cảnh
                </p>
              </div>
            </div>

            {/* Mute button */}
            <button
              type="button"
              onClick={toggleMute}
              className={`p-1.5 rounded-lg border transition-colors ${
                isAudioMuted
                  ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  : 'bg-indigo-600/30 border-indigo-500/40 text-indigo-300 hover:text-white animate-pulse'
              }`}
              title={isAudioMuted ? 'Bật lại chuông thông báo' : 'Tắt tiếng chuông'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-5 space-y-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3">
              <FileText className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 overflow-hidden">
                <div className="text-slate-500 font-medium">Tên file xuất tải về:</div>
                <div className="font-mono font-semibold text-slate-800 break-all text-[13px] bg-white px-2 py-1 rounded border border-slate-200">
                  {targetFileName}
                </div>
                <div className="text-[11px] text-slate-400">
                  (Được định dạng tự động: [Tên file import] + PromptTJ)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-lg">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-[11px] leading-tight text-amber-900">
                Nhạc chuông thông báo đang lặp lại liên tục cho đến khi bạn bấm xác nhận tải file bên dưới.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleConfirm}
                className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Xác nhận Tải File TXT &amp; Dừng Chuông</span>
              </button>

              <button
                type="button"
                onClick={handleCloseOnly}
                className="w-full h-8 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-medium border border-slate-200 transition-colors"
              >
                Đóng &amp; Tắt chuông (Tôi sẽ tải sau)
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
