/**
 * TJ GUN 1.0 - Data Types & Interfaces
 */

export interface SRTSubtitle {
  id: number;
  startTime: string; // "00:00:01,200"
  endTime: string;   // "00:00:04,500"
  startSeconds: number;
  endSeconds: number;
  text: string;
}

export type SceneStatus = 'pending' | 'processing' | 'success' | 'error' | 'paused';

export interface SceneItem {
  id: number;
  sceneIndex: number;
  startTimeCode: string; // "00:00:00"
  endTimeCode: string;   // "00:00:10"
  startSeconds: number;
  endSeconds: number;
  srtText: string;
  prompt: string;
  status: SceneStatus;
  errorMessage?: string;
  retryCount?: number;
  generatedAt?: string;
}

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  sceneIndex: number;
  timeCode: string;
  errorType: 'API_429_RATE_LIMIT' | 'API_503_OVERLOAD' | 'NETWORK_OFFLINE' | 'API_KEY_INVALID' | 'PARSE_ERROR' | 'UNKNOWN';
  message: string;
  detail: string;
  resolved: boolean;
}

export interface APIQuotaStats {
  requestsInLastMinute: number;
  maxRPM: number; // 15 for free tier
  requestsToday: number;
  maxRPD: number; // 1500 for free tier
  estimatedResetSeconds: number; // Seconds until UTC midnight reset
  totalRequestsAllTime?: number;
  isRealTelemetry?: boolean;
}

export type SceneInterval = 5 | 10 | 15 | 20;

export type ConcurrencyMode = 'auto' | 1 | 2 | 3;

export type ProcessingState = 'idle' | 'running' | 'paused' | 'stopped' | 'completed';

export interface APIModelOption {
  id: string;
  name: string;
  shortName: string;
  provider: string;
  description: string;
  tier: string;
  isRecommended?: boolean;
}

export const AVAILABLE_API_MODELS: APIModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    shortName: '3.8 Flash',
    provider: 'Google Gemini',
    description: 'Thế hệ mới nhất, sáng tạo prompt chi tiết cao, hạn mức dồi dào',
    tier: 'Free Tier (Khuyên dùng)',
    isRecommended: true,
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    shortName: 'Flash Latest',
    provider: 'Google Gemini',
    description: 'Bản Flash cập nhật mới nhất, xử lý nhanh chóng và ổn định',
    tier: 'Free Tier 15 RPM',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    shortName: '3.1 Flash Lite',
    provider: 'Google Gemini',
    description: 'Tốc độ phản hồi cực nhanh, tối ưu hạn ngạch Free Tier',
    tier: 'Free Tier Tốc Độ Cao',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    shortName: '2.5 Flash',
    provider: 'Google Gemini',
    description: 'Phiên bản cũ (Dễ chạm ngưỡng 20 request/ngày của Free Tier)',
    tier: 'Giới hạn 20 RPD',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    shortName: '3.1 Pro',
    provider: 'Google Gemini',
    description: 'Tư duy logic chuyên sâu, câu từ điện ảnh nghệ thuật',
    tier: 'Free Tier 2 RPM',
  },
];
