import React, { useState } from 'react';
import { Copy, Check, RefreshCw, AlertTriangle, Search, Filter, Sparkles, Clock, ChevronDown, ChevronUp, Upload, FileCheck2, Maximize2, Eye } from 'lucide-react';
import { SceneItem } from '../types';
import { PromptDetailModal } from './PromptDetailModal';

interface SceneListViewProps {
  scenes: SceneItem[];
  onRetryScene: (sceneIndex: number) => void;
  onRetryAllErrors?: () => void;
  onCopyAllPrompts: () => void;
  isProcessing: boolean;
  onImportClick?: () => void;
}

export const SceneListView: React.FC<SceneListViewProps> = ({
  scenes,
  onRetryScene,
  onRetryAllErrors,
  onCopyAllPrompts,
  isProcessing,
  onImportClick,
}) => {
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [expandedScenes, setExpandedScenes] = useState<Record<number, boolean>>({});
  const [modalScene, setModalScene] = useState<SceneItem | null>(null);

  const toggleExpand = (sceneIndex: number) => {
    setExpandedScenes(prev => ({ ...prev, [sceneIndex]: !prev[sceneIndex] }));
  };

  const handleCopyPrompt = (text: string, sceneId: number) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(sceneId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredScenes = scenes.filter(s => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'success' && s.status === 'success') ||
      (filter === 'error' && s.status === 'error') ||
      (filter === 'pending' && (s.status === 'pending' || s.status === 'processing'));

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      s.sceneIndex.toString().includes(query) ||
      s.srtText.toLowerCase().includes(query) ||
      (s.prompt && s.prompt.toLowerCase().includes(query));

    return matchesFilter && matchesSearch;
  });

  const successCount = scenes.filter(s => s.status === 'success').length;
  const errorCount = scenes.filter(s => s.status === 'error').length;
  const pendingCount = scenes.filter(s => s.status === 'pending' || s.status === 'processing').length;

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs my-1 flex flex-col gap-3">
      {/* Search & Filter Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-slate-700" />
          <h2 className="font-semibold text-slate-900 text-sm">
            Danh Sách Phân Cảnh ({scenes.length})
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo nội dung SRT hoặc prompt..."
              className="bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-44 sm:w-60 h-8 transition-colors shadow-2xs"
            />
          </div>

          {/* Filter Pills */}
          <div className="h-8 inline-flex items-center bg-slate-100/80 border border-slate-200 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`h-6.5 px-2.5 rounded-md font-medium text-xs transition-all ${
                filter === 'all'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Tất cả ({scenes.length})
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`h-6.5 px-2.5 rounded-md font-medium text-xs transition-all ${
                filter === 'success'
                  ? 'bg-white text-emerald-700 font-semibold shadow-2xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              Đã tạo ({successCount})
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`h-6.5 px-2.5 rounded-md font-medium text-xs transition-all ${
                filter === 'error'
                  ? 'bg-white text-rose-700 font-semibold shadow-2xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-rose-700'
              }`}
            >
              Lỗi ({errorCount})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`h-6.5 px-2.5 rounded-md font-medium text-xs transition-all ${
                filter === 'pending'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Chờ ({pendingCount})
            </button>
          </div>

          {/* Manual Retry All Errors Button */}
          {onRetryAllErrors && errorCount > 0 && (
            <button
              onClick={onRetryAllErrors}
              disabled={isProcessing}
              className={`h-8 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isProcessing
                  ? 'bg-rose-50 text-rose-300 border-rose-200 cursor-not-allowed'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 shadow-2xs active:scale-[0.98]'
              }`}
              title="Chạy lại ngay tất cả phân cảnh bị lỗi trong danh sách"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin text-rose-400' : 'text-rose-600'}`} />
              <span>Thử lại tất cả lỗi ({errorCount})</span>
            </button>
          )}

          {/* Copy All Prompts */}
          <button
            onClick={onCopyAllPrompts}
            disabled={successCount === 0}
            className={`h-8 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${
              successCount === 0
                ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs active:scale-[0.98]'
            }`}
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Sao chép tất cả ({successCount})</span>
          </button>
        </div>
      </div>

      {/* Scenes Container */}
      <div className="max-h-[520px] overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin">
        {filteredScenes.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-500 text-xs sm:text-sm bg-slate-50/70 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
            {scenes.length === 0 ? (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-md">
                  <p className="font-semibold text-slate-800 text-sm">
                    Bộ nhớ đệm đã được dọn sạch — Sẵn sàng nạp file mới!
                  </p>
                  <p className="text-xs text-slate-500">
                    Toàn bộ phân cảnh và lịch sử cũ đã được xóa. Thiết lập <strong>Nhân vật</strong> &amp; <strong>Phong cách</strong> được giữ nguyên. Hãy nạp file .SRT tiếp theo để bắt đầu xử lý.
                  </p>
                </div>
                {onImportClick && (
                  <button
                    onClick={onImportClick}
                    className="mt-1 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-slate-300" />
                    <span>Import File .SRT Tiếp Theo</span>
                  </button>
                )}
              </>
            ) : (
              <p className="font-medium">Không tìm thấy phân cảnh phù hợp với bộ lọc hiện tại.</p>
            )}
          </div>
        ) : (
          filteredScenes.map((scene) => {
            const isExpanded = expandedScenes[scene.sceneIndex] ?? true;

            return (
              <div
                key={scene.id}
                className={`border rounded-xl p-3.5 transition-all shadow-2xs ${
                  scene.status === 'success'
                    ? 'border-emerald-200/90 bg-emerald-50/20 hover:bg-emerald-50/30'
                    : scene.status === 'error'
                    ? 'border-rose-200 bg-rose-50/30'
                    : scene.status === 'processing'
                    ? 'border-indigo-300 bg-indigo-50/30 shadow-2xs'
                    : 'border-slate-200/90 bg-white'
                }`}
              >
                {/* Scene Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-700 font-mono font-medium text-xs px-2 py-0.5 rounded-md border border-slate-200/80">
                      #{scene.sceneIndex}
                    </span>
                    <span className="text-slate-400 font-mono text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {scene.startTimeCode} - {scene.endTimeCode}
                    </span>

                    {/* Status Badge */}
                    {scene.status === 'success' && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-full font-medium">
                        ✓ Đã tạo Prompt
                      </span>
                    )}
                    {scene.status === 'processing' && (
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.2 rounded-full font-medium animate-pulse">
                        ⏳ Đang tạo...
                      </span>
                    )}
                    {scene.status === 'error' && (
                      <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.2 rounded-full font-medium flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5 text-rose-500" /> Lỗi
                      </span>
                    )}
                    {scene.status === 'pending' && (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.2 rounded-full font-normal">
                        Đang chờ
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Retry button */}
                    {scene.status === 'error' && (
                      <button
                        onClick={() => onRetryScene(scene.sceneIndex)}
                        disabled={isProcessing}
                        className="h-6.5 text-[11px] bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 px-2 rounded-md flex items-center gap-1 transition-colors font-medium shadow-2xs"
                        title="Thử lại sinh prompt cho phân cảnh này"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Thử lại</span>
                      </button>
                    )}

                    {/* Copy Prompt Button */}
                    {scene.prompt && (
                      <button
                        onClick={() => handleCopyPrompt(scene.prompt, scene.id)}
                        className="h-6.5 text-[11px] bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 px-2 rounded-md border border-slate-200 flex items-center gap-1 transition-colors font-medium shadow-2xs"
                      >
                        {copiedId === scene.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-semibold">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Expand/Collapse Toggle */}
                    <button
                      onClick={() => toggleExpand(scene.sceneIndex)}
                      className="text-slate-400 hover:text-slate-700 p-0.5"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* SRT Content */}
                <div className="mt-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 font-sans">
                  <span className="text-slate-400 font-semibold text-[11px]">Nội dung SRT ({scene.endTimeCode}): </span>
                  <span className="italic">"{scene.srtText}"</span>
                </div>

                {/* Expanded Prompt View */}
                {isExpanded && (
                  <div className="mt-2">
                    {scene.prompt ? (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-sans">
                        <div className="text-[10px] text-emerald-400 font-bold mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span>PROMPT TẠO ẢNH SINH RA:</span>
                          </span>
                          {scene.generatedAt && (
                            <span className="text-[10px] text-slate-400 font-normal">{scene.generatedAt}</span>
                          )}
                        </div>

                        {/* 1-Line Preview with Xem Thêm Button */}
                        <div className="flex items-center gap-2 bg-slate-950/70 rounded-lg px-3 py-2 border border-slate-800/80">
                          <p className="truncate flex-1 text-slate-200 font-mono text-xs leading-normal select-all">
                            {scene.prompt}
                          </p>
                          <button
                            type="button"
                            onClick={() => setModalScene(scene)}
                            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/50 px-2 py-1 rounded-md transition-all cursor-pointer shadow-2xs"
                            title="Bấm để xem toàn bộ prompt trong hộp thoại"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Xem thêm</span>
                          </button>
                        </div>
                      </div>
                    ) : scene.status === 'error' ? (
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-xs text-rose-800 font-sans">
                        <strong className="font-bold">Lỗi xử lý: </strong>
                        {scene.errorMessage || 'Không thể tạo prompt từ API Google Free Tier.'}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic py-1">
                        (Chưa tạo prompt cho phân cảnh này)
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Full Prompt Detail Modal */}
      {modalScene && (
        <PromptDetailModal
          isOpen={Boolean(modalScene)}
          onClose={() => setModalScene(null)}
          sceneIndex={modalScene.sceneIndex}
          timeCode={`${modalScene.startTimeCode} - ${modalScene.endTimeCode}`}
          srtText={modalScene.srtText}
          prompt={modalScene.prompt}
          generatedAt={modalScene.generatedAt}
        />
      )}
    </div>
  );
};
