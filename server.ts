import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Persistent Real API Usage Telemetry
const USAGE_FILE = path.join(process.cwd(), '.api_usage.json');

interface StoredUsage {
  currentDate: string; // YYYY-MM-DD in UTC
  requestsToday: number;
  totalRequestsAllTime: number;
}

let storedUsage: StoredUsage = {
  currentDate: new Date().toISOString().slice(0, 10),
  requestsToday: 0,
  totalRequestsAllTime: 0,
};

// Load persistent real usage on server start
try {
  if (fs.existsSync(USAGE_FILE)) {
    const raw = fs.readFileSync(USAGE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    const todayStr = new Date().toISOString().slice(0, 10);
    if (parsed.currentDate === todayStr) {
      storedUsage = {
        currentDate: todayStr,
        requestsToday: typeof parsed.requestsToday === 'number' ? parsed.requestsToday : 0,
        totalRequestsAllTime: typeof parsed.totalRequestsAllTime === 'number' ? parsed.totalRequestsAllTime : 0,
      };
    } else {
      storedUsage = {
        currentDate: todayStr,
        requestsToday: 0,
        totalRequestsAllTime: typeof parsed.totalRequestsAllTime === 'number' ? parsed.totalRequestsAllTime : 0,
      };
    }
  }
} catch (e) {
  console.warn('Could not read .api_usage.json, starting fresh', e);
}

function saveUsage() {
  try {
    fs.writeFileSync(USAGE_FILE, JSON.stringify(storedUsage, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save .api_usage.json:', e);
  }
}

// Sliding window of actual call timestamps for real RPM measurement (last 60s)
const recentCallTimestamps: number[] = [];

function recordRealApiCall(count: number = 1) {
  const now = Date.now();
  const todayStr = new Date().toISOString().slice(0, 10);
  if (storedUsage.currentDate !== todayStr) {
    storedUsage.currentDate = todayStr;
    storedUsage.requestsToday = 0;
  }
  storedUsage.requestsToday += count;
  storedUsage.totalRequestsAllTime += count;
  for (let i = 0; i < count; i++) {
    recentCallTimestamps.push(now);
  }
  saveUsage();
}

function getRealRPM(): number {
  const cutoff = Date.now() - 60000;
  while (recentCallTimestamps.length > 0 && recentCallTimestamps[0] < cutoff) {
    recentCallTimestamps.shift();
  }
  return recentCallTimestamps.length;
}

function getSecondsUntilMidnightUTC(): number {
  const now = new Date();
  const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return Math.max(0, Math.floor((nextMidnight.getTime() - now.getTime()) / 1000));
}

function getQuotaSnapshot(model: string = 'gemini-3.8-flash') {
  const isPro = model.includes('pro');
  const maxRPM = isPro ? 2 : 15;
  const maxRPD = isPro ? 50 : 1500;

  // Check date rollover
  const todayStr = new Date().toISOString().slice(0, 10);
  if (storedUsage.currentDate !== todayStr) {
    storedUsage.currentDate = todayStr;
    storedUsage.requestsToday = 0;
    saveUsage();
  }

  return {
    requestsInLastMinute: getRealRPM(),
    maxRPM,
    requestsToday: storedUsage.requestsToday,
    maxRPD,
    estimatedResetSeconds: getSecondsUntilMidnightUTC(),
    totalRequestsAllTime: storedUsage.totalRequestsAllTime,
    isRealTelemetry: true,
  };
}

// Lazy initializer for Gemini client to avoid crash if API key is not present immediately
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY_MISSING');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    defaultModel: 'gemini-3.8-flash',
    timestamp: new Date().toISOString(),
  });
});

// Real Authentic API Telemetry Quota Endpoint (Read-only, completely authoritative)
app.get('/api/quota-stats', (req, res) => {
  const model = (req.query.model as string) || 'gemini-3.8-flash';
  const snapshot = getQuotaSnapshot(model);
  res.json({
    success: true,
    ...snapshot,
    model,
    serverTime: new Date().toISOString(),
  });
});

// Single Scene Prompt Generator Endpoint
app.post('/api/generate-prompt', async (req, res) => {
  try {
    const { characterInfo, visualStyle, srtText, timeRange, sceneIndex, model } = req.body;
    const requestedModel = model || 'gemini-3.8-flash';

    if (!srtText && !characterInfo && !visualStyle) {
      return res.status(400).json({ error: 'Missing required inputs' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `Bạn là một chuyên gia sáng tạo Prompt tạo ảnh AI chuyên nghiệp (Midjourney, DALL-E 3, Stable Diffusion). 
Nhiệm vụ của bạn là dựa vào 3 thông tin đầu vào:
1. Thông tin Nhân vật (Character Description): Mô tả nhất quán ngoại hình, trang phục, gương mặt nhân vật.
2. Style Ảnh (Visual Style): Phong cách nghệ thuật, ánh sáng, góc quay, chất liệu hình ảnh.
3. Nội dung Phân cảnh SRT (${timeRange}): Diễn biến câu chuyện, hành động, cảm xúc trong mốc thời gian này.

Yêu cầu xuất đầu ra:
Tạo duy nhất 1 đoạn Prompt mô tả hình ảnh chi tiết, cực kỳ sinh động bằng Tiếng Anh (hoặc kết hợp từ khóa nghệ thuật chuyên sâu), mô tả chính xác góc quay, nhân vật, bối cảnh, hành động và phong cách hình ảnh khớp với 10s phân cảnh này.
Chỉ trả về nội dung của Prompt tạo ảnh, không kèm lời giải thích hay dẫn dắt nào khác.`;

    const userPrompt = `[THÔNG TIN NHÂN VẬT]:
${characterInfo || 'Chưa cung cấp nhân vật cụ thể.'}

[CUSTOM VISUAL STYLE]:
${visualStyle || 'Cinematic, 8k resolution, detailed texture'}

[NỘI DUNG SRT PHÂN CẢNH ${sceneIndex || 1} (${timeRange || ''})]:
${srtText}

Hãy tạo Prompt ảnh hoàn chỉnh cho phân cảnh này:`;

    // Strictly call ONLY requestedModel — NO AUTO-FALLBACK
    const response = await ai.models.generateContent({
      model: requestedModel,
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const generatedPrompt = response.text ? response.text.trim() : '';

    // Real API call succeeded: record real API call telemetry
    recordRealApiCall(1);

    return res.json({
      success: true,
      sceneIndex,
      prompt: generatedPrompt,
      modelUsed: requestedModel,
      wasFallback: false,
      quotaStats: getQuotaSnapshot(requestedModel),
    });
  } catch (err: any) {
    console.error('Error in /api/generate-prompt:', err);
    
    // Categorize error for free tier and calculate intelligent retry duration
    let errorCode = 'UNKNOWN';
    let statusCode = 500;
    let message = err.message || 'Lỗi không xác định';

    let retryAfterSeconds = 60;
    let isDailyQuota = false;

    const reqModel = req.body.model || 'gemini-3.8-flash';
    const snapshot = getQuotaSnapshot(reqModel);
    if (snapshot.requestsToday >= snapshot.maxRPD) {
      isDailyQuota = true;
      retryAfterSeconds = snapshot.estimatedResetSeconds;
    } else {
      const oldestCall = recentCallTimestamps.length > 0 ? recentCallTimestamps[0] : null;
      if (oldestCall) {
        retryAfterSeconds = Math.max(5, Math.ceil((oldestCall + 60000 - Date.now()) / 1000));
      } else {
        retryAfterSeconds = 60;
      }
    }

    if (err.message === 'GEMINI_API_KEY_MISSING' || message.includes('API key')) {
      errorCode = 'API_KEY_INVALID';
      statusCode = 401;
      message = 'Chưa cấu hình GEMINI_API_KEY trên môi trường server.';
    } else if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
      errorCode = 'API_429_RATE_LIMIT';
      statusCode = 429;
      message = `Hạn mức API (${reqModel}) tạm thời bị chạm (429 Rate Limit).`;
    } else if (message.includes('503') || message.includes('UNAVAILABLE') || message.includes('overloaded')) {
      errorCode = 'API_503_OVERLOAD';
      statusCode = 503;
      message = 'Máy chủ Google API đang bị quá tải (503 Service Unavailable).';
      retryAfterSeconds = 15;
    }

    return res.status(statusCode).json({
      success: false,
      errorCode,
      error: message,
      retryAfterSeconds,
      isDailyQuota,
      modelUsed: reqModel,
      quotaStats: snapshot,
      details: err.stack || err.toString(),
    });
  }
});

// Batch Scene Prompt Generator Endpoint (Optimized for multiple scenes in 1 API call)
app.post('/api/generate-prompts-batch', async (req, res) => {
  try {
    const { characterInfo, visualStyle, scenes, model } = req.body;
    const requestedModel = model || 'gemini-3.8-flash';
    // scenes is an array of { sceneIndex, timeRange, srtText }

    if (!Array.isArray(scenes) || scenes.length === 0) {
      return res.status(400).json({ error: 'Danh sách scenes rỗng' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `Bạn là chuyên gia thiết kế Image Prompts cho phim/truyện.
Dựa trên Thông tin Nhân vật và Custom Visual Style, hãy tạo Prompt tạo ảnh độc lập cho từng phân cảnh trong danh sách.
Trả về dữ liệu dạng JSON thuần túy (Array các object) có cấu trúc:
[
  { "sceneIndex": 1, "prompt": "mô tả chi tiết bằng tiếng Anh" },
  { "sceneIndex": 2, "prompt": "mô tả chi tiết bằng tiếng Anh" }
]`;

    const scenesPayload = scenes.map(s => ({
      sceneIndex: s.sceneIndex,
      timeRange: s.timeRange,
      srtText: s.srtText,
    }));

    const userPrompt = `[THÔNG TIN NHÂN VẬT]:
${characterInfo || 'Mặc định'}

[CUSTOM VISUAL STYLE]:
${visualStyle || 'Cinematic, 8k resolution'}

[DANH SÁCH PHÂN CẢNH SRT CAN CHẠY PROMPT]:
${JSON.stringify(scenesPayload, null, 2)}

Hãy sinh Prompt ảnh cho tất cả ${scenes.length} phân cảnh trên theo đúng cấu trúc JSON yêu cầu.`;

    // Strictly call ONLY requestedModel — NO AUTO-FALLBACK
    const response = await ai.models.generateContent({
      model: requestedModel,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sceneIndex: { type: Type.INTEGER },
              prompt: { type: Type.STRING },
            },
            required: ['sceneIndex', 'prompt'],
          },
        },
      },
    });

    const jsonText = response.text ? response.text.trim() : '[]';
    const parsedPrompts = JSON.parse(jsonText);

    // Real API call succeeded: record real API call telemetry
    recordRealApiCall(1);

    return res.json({
      success: true,
      prompts: parsedPrompts,
      modelUsed: requestedModel,
      wasFallback: false,
      quotaStats: getQuotaSnapshot(requestedModel),
    });
  } catch (err: any) {
    console.error('Error in /api/generate-prompts-batch:', err);
    let errorCode = 'UNKNOWN';
    let statusCode = 500;
    let message = err.message || 'Lỗi server';

    let retryAfterSeconds = 60;
    let isDailyQuota = false;

    const reqModel = req.body.model || 'gemini-3.8-flash';
    const snapshot = getQuotaSnapshot(reqModel);
    if (snapshot.requestsToday >= snapshot.maxRPD) {
      isDailyQuota = true;
      retryAfterSeconds = snapshot.estimatedResetSeconds;
    } else {
      const oldestCall = recentCallTimestamps.length > 0 ? recentCallTimestamps[0] : null;
      if (oldestCall) {
        retryAfterSeconds = Math.max(5, Math.ceil((oldestCall + 60000 - Date.now()) / 1000));
      } else {
        retryAfterSeconds = 60;
      }
    }

    if (err.message === 'GEMINI_API_KEY_MISSING' || message.includes('API key')) {
      errorCode = 'API_KEY_INVALID';
      statusCode = 401;
      message = 'Thiếu GEMINI_API_KEY trên môi trường.';
    } else if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
      errorCode = 'API_429_RATE_LIMIT';
      statusCode = 429;
      message = `Hạn mức Google API Free Tier tạm thời bị chạm (429 Rate Limit) cho ${reqModel}.`;
    } else if (message.includes('503') || message.includes('UNAVAILABLE')) {
      errorCode = 'API_503_OVERLOAD';
      statusCode = 503;
      message = 'Dịch vụ Google API đang quá tải (503).';
      retryAfterSeconds = 15;
    }

    return res.status(statusCode).json({
      success: false,
      errorCode,
      error: message,
      retryAfterSeconds,
      isDailyQuota,
      modelUsed: reqModel,
      quotaStats: snapshot,
      details: err.toString(),
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TJ GUN 1.0 Server running on http://localhost:${PORT}`);
  });
}

startServer();
