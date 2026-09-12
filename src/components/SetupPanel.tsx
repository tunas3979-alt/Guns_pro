import React, { useState, useEffect } from 'react';
import { User, Sparkles, Wand2, Edit3, ChevronUp, ChevronDown, Check, SlidersHorizontal, Lock, Save, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SetupPanelProps {
  characterInfo: string;
  visualStyle: string;
  onSaveConfig?: (newCharacter: string, newStyle: string) => void;
  onCharacterInfoChange?: (val: string) => void;
  onVisualStyleChange?: (val: string) => void;
  disabled?: boolean;
}

const STYLE_PRESETS = [
  { label: 'Cinematic 8K', text: 'Cinematic film shot, 8k resolution, photorealistic, volumetric lighting, 35mm lens, depth of field' },
  { label: 'Anime Ghibli', text: 'Studio Ghibli style, hand-drawn anime aesthetic, vibrant watercolors, lush detail, warm sunlight' },
  { label: '3D Pixar Animation', text: '3D Pixar Pixar animation style, smooth rendered character, rich colors, soft ambient occlusion, expressive features' },
  { label: 'Cyberpunk Sci-Fi', text: 'Cyberpunk aesthetic, neon lighting, rain reflections, futuristic city background, vibrant blue and purple glow' },
  { label: 'Dark Fantasy Film', text: 'Dark fantasy concept art, atmospheric shadows, moody rim lighting, intricate details, photorealistic texture' },
];

const CHARACTER_TEMPLATES = [
  'Nam thanh niên 25 tuổi, tóc đen ngắn đánh rối nhẹ, mắt nâu sáng kiên định, mặc áo khoác da đen, phong thái dũng cảm.',
  'Nữ nhân vật chính 20 tuổi, mái tóc dài mây màu bạch kim, đôi mắt xanh lam trong veo, mặc váy dạ hội thanh lịch màu xanh ngọc.',
  'Lão sư phụ 60 tuổi, râu dài tóc bạc phơ, mặc áo dài truyền thống, gương mặt từ hòa, đôi mắt tinh anh sắc sảo.',
];

export const SetupPanel: React.FC<SetupPanelProps> = ({
  characterInfo,
  visualStyle,
  onSaveConfig,
  onCharacterInfoChange,
  onVisualStyleChange,
  disabled = false,
}) => {
  // Collapsed / Expanded state
  const [isExpanded, setIsExpanded] = useState(false);

  // Local draft states - strictly manual edits only!
  const [draftCharacter, setDraftCharacter] = useState(characterInfo);
  const [draftStyle, setDraftStyle] = useState(visualStyle);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Sync draft whenever panel opens or initial values load
  useEffect(() => {
    setDraftCharacter(characterInfo);
    setDraftStyle(visualStyle);
  }, [characterInfo, visualStyle, isExpanded]);

  const hasUnsavedChanges =
    draftCharacter !== characterInfo || draftStyle !== visualStyle;

  const handleOpenEdit = () => {
    if (disabled) return;
    setDraftCharacter(characterInfo);
    setDraftStyle(visualStyle);
    setIsExpanded(true);
  };

  const handleCancel = () => {
    setDraftCharacter(characterInfo);
    setDraftStyle(visualStyle);
    setIsExpanded(false);
  };

  const handleSaveManual = () => {
    if (onSaveConfig) {
      onSaveConfig(draftCharacter, draftStyle);
    } else {
      if (onCharacterInfoChange) onCharacterInfoChange(draftCharacter);
      if (onVisualStyleChange) onVisualStyleChange(draftStyle);
    }

    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      setIsExpanded(false);
    }, 600);
  };

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-xl shadow-2xs my-1 overflow-hidden transition-all">
      {/* 1. Compact Bar (Always visible) */}
      <div className="px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 bg-white">
        <div className="flex flex-wrap items-center gap-2 text-xs flex-1 min-w-[260px]">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] uppercase tracking-wider font-bold">CẤU HÌNH:</span>
          </div>

          {/* Security Guarantee Badge */}
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[10px] text-emerald-800 font-semibold shrink-0"
            title="Tuyệt đối chỉ có thể sửa và lưu bằng tay. Các thao tác tự động, nạp file hay dọn cache không thể thay đổi phần này."
          >
            <Lock className="w-2.5 h-2.5 text-emerald-600" />
            <span>Thủ công 100%</span>
          </div>

          {/* Character summary tag */}
          <div
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 max-w-[240px] sm:max-w-[320px] truncate cursor-pointer hover:bg-slate-100 transition-colors"
            title={characterInfo || 'Chưa nhập nhân vật'}
          >
            <User className="w-3 h-3 text-indigo-500 shrink-0" />
            <span className="text-slate-400 font-normal shrink-0">Nhân vật:</span>
            <span className="truncate font-medium text-slate-800">
              {characterInfo ? characterInfo : <em className="text-slate-400 not-italic">Chưa nhập</em>}
            </span>
          </div>

          {/* Style summary tag */}
          <div
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 max-w-[240px] sm:max-w-[320px] truncate cursor-pointer hover:bg-slate-100 transition-colors"
            title={visualStyle || 'Chưa chọn style'}
          >
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="text-slate-400 font-normal shrink-0">Style:</span>
            <span className="truncate font-medium text-slate-800">
              {visualStyle ? visualStyle : <em className="text-slate-400 not-italic">Chưa chọn</em>}
            </span>
          </div>
        </div>

        {/* Toggle / Edit Button */}
        <button
          type="button"
          onClick={() => (isExpanded ? handleCancel() : handleOpenEdit())}
          disabled={disabled}
          className={`h-7.5 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors shadow-2xs active:scale-[0.98] cursor-pointer ${
            isExpanded
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900 border-slate-200'
          }`}
          title={isExpanded ? 'Đóng chế độ chỉnh sửa' : 'Mở để chỉnh sửa và lưu cấu hình bằng tay'}
        >
          {isExpanded ? (
            <>
              <X className="w-3.5 h-3.5" />
              <span>Đóng</span>
              <ChevronUp className="w-3 h-3 text-slate-300" />
            </>
          ) : (
            <>
              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
              <span>Chỉnh sửa thủ công</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </>
          )}
        </button>
      </div>

      {/* 2. Expanded Manual Editor (Strictly Manual Edit & Save) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-200/80 bg-slate-50/50 p-3 sm:p-4 space-y-3"
          >
            {/* Top Protection Banner */}
            <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200/80 rounded-lg px-3 py-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium text-[11px] sm:text-xs">
                  <strong>Bảo vệ tuyệt đối:</strong> Cấu hình chỉ thay đổi khi bạn bấm <strong>"Lưu Cấu Hình"</strong>. Mọi tác vụ tự động, xóa cache, đổi file không thể làm thay đổi phần này.
                </span>
              </div>
              {hasUnsavedChanges && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold shrink-0">
                  Có thay đổi chưa lưu
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 1. Character Info (Thông tin nhân vật) */}
              <div className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>1. Thông tin nhân vật (Character)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Ngoại hình &amp; trang phục
                  </span>
                </div>

                <textarea
                  value={draftCharacter}
                  onChange={(e) => setDraftCharacter(e.target.value)}
                  disabled={disabled}
                  placeholder="Ví dụ: Nam chính 25 tuổi, cao 1m80, tóc đen ngắn, áo khoác da màu xám nhạt, ánh mắt kiên định..."
                  rows={3}
                  className="w-full bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-normal placeholder-slate-400 focus:outline-none transition-all resize-none shadow-2xs"
                />

                {/* Quick Character Templates */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-400 font-medium">Mẫu nhanh:</span>
                  {CHARACTER_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDraftCharacter(tmpl)}
                      disabled={disabled}
                      className="text-[11px] bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded-md border border-slate-200 font-medium transition-colors cursor-pointer"
                    >
                      Mẫu {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Custom Visual Style (Mô tả style ảnh) */}
              <div className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>2. Custom Visual Style</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Phong cách &amp; Góc quay
                  </span>
                </div>

                <textarea
                  value={draftStyle}
                  onChange={(e) => setDraftStyle(e.target.value)}
                  disabled={disabled}
                  placeholder="Ví dụ: Cinematic film style, 8k resolution, realistic lighting, octane render, vivid colors..."
                  rows={3}
                  className="w-full bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-normal placeholder-slate-400 focus:outline-none transition-all resize-none shadow-2xs"
                />

                {/* Style Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-400 font-medium">Gợi ý:</span>
                  {STYLE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDraftStyle(preset.text)}
                      disabled={disabled}
                      className="text-[11px] bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded-md border border-slate-200 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5 text-amber-500" />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Action Controls: Save and Cancel */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Bấm <strong>"Lưu Cấu Hình"</strong> để áp dụng và lưu cố định vào bộ nhớ.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="h-8 inline-flex items-center gap-1 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Hủy bỏ</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveManual}
                  className={`h-8 inline-flex items-center gap-1.5 px-4 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer ${
                    savedFeedback
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-[0.98]'
                  }`}
                >
                  {savedFeedback ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Đã lưu thành công!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Lưu Cấu Hình (Manual Save)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


