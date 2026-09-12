import React from 'react';
import { CheckCircle2, ShieldCheck, X, FilePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CacheClearedSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportNextFile?: () => void;
}

export const CacheClearedSuccessModal: React.FC<CacheClearedSuccessModalProps> = ({
  isOpen,
  onClose,
  onImportNextFile,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
        >
          {/* Top banner */}
          <div className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">
                  Đã Xóa Cache &amp; Lịch Sử Thành Công!
                </h3>
                <p className="text-[11px] text-emerald-100">
                  Ứng dụng đã được dọn sạch bộ nhớ &amp; chạy mượt mà
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-700/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Absolute Guarantee */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950 space-y-1">
                <div className="font-bold text-emerald-800">
                  Cấu hình được bảo lưu tuyệt đối 100%:
                </div>
                <ul className="list-disc list-inside text-[11px] text-emerald-900 space-y-0.5 leading-relaxed">
                  <li><strong>Thông tin nhân vật (Character Info):</strong> Được giữ nguyên hoàn toàn.</li>
                  <li><strong>Phong cách thị giác (Visual Style):</strong> Được giữ nguyên hoàn toàn.</li>
                  <li><strong>Khung thời gian phân cảnh:</strong> Được giữ nguyên hoàn toàn.</li>
                </ul>
              </div>
            </div>

            {/* What was cleared */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
              <div className="font-semibold text-slate-700">Các phần đã được dọn dẹp sạch sẽ:</div>
              <div className="text-[11px] text-slate-500 space-y-0.5">
                <div>✓ Bộ nhớ cache tạm thời &amp; hàng đợi xử lý</div>
                <div>✓ Lịch sử báo lỗi kết nối và chuông lặp</div>
                <div>✓ Dữ liệu file cũ để giải phóng RAM cho trình duyệt</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              {onImportNextFile && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onImportNextFile();
                  }}
                  className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
                >
                  <FilePlus className="w-4 h-4 text-emerald-400" />
                  <span>Chọn &amp; Nạp File .SRT Tiếp Theo</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Hoàn tất &amp; Đóng hộp thoại
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
