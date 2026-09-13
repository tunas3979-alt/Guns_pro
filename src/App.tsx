import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SRTSubtitle,
  SceneItem,
  ErrorLogEntry,
  APIQuotaStats,
  SceneInterval,
  ProcessingState,
  ConcurrencyMode,
} from './types';
import { parseSRT, chunkSRTIntoScenes, secondsToTimeCode, readSRTFileContent } from './utils/srtParser';
import { exportPromptsToTxt } from './utils/promptExporter';
import { HorizontalHeader } from './components/HorizontalHeader';
import { ControlToolbar } from './components/ControlToolbar';
import { SetupPanel } from './components/SetupPanel';
import { TomAndJerryProgressBar } from './components/TomAndJerryProgressBar';
import { StatusBar } from './components/StatusBar';
import { SceneListView } from './components/SceneListView';
import { ErrorHistoryLog } from './components/ErrorHistoryLog';
import { NetworkAlertModal } from './components/NetworkAlertModal';
import { QuotaRateLimitModal } from './components/QuotaRateLimitModal';
import { CompletionModal } from './components/CompletionModal';
import { CacheClearedSuccessModal } from './components/CacheClearedSuccessModal';
import { PasteSRTModal } from './components/PasteSRTModal';
import { ToastNotification, ToastMessage } from './components/ToastNotification';
import { completionAudioAlert } from './utils/audioAlert';

// Sample SRT Content for instant test preview if user doesn't upload file right away
const DEMO_SRT_CONTENT = `1
00:00:00,000 --> 00:00:08,000
Bình minh ló rạng trên đỉnh núi Tuyết Sơn. TJ sải bước trên con đường mòn nhỏ.

2
00:00:08,500 --> 00:00:18,000
Gió lạnh thổi qua làm chiếc áo khoác da tung bay. Cậu rút thanh kiếm bạc khỏi vỏ.

3
00:00:18,500 --> 00:00:28,000
Phía trước thung lũng, bóng dáng quái thú thần thoại bắt đầu xuất hiện trong làn sương mù.

4
00:00:28,500 --> 00:00:38,000
Đôi mắt quái thú phát ra ánh sáng đỏ rực. TJ siết chặt tay cầm, chuẩn bị vào thế chiến đấu.`;

export default function App() {
  // App Setup States - Strictly Manual! Loaded from persistent storage if set by user
  const [characterInfo, setCharacterInfo] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('tj_character_info');
      if (saved !== null) return saved;
    } catch {
      // ignore
    }
    return 'Nam chiến binh TJ 25 tuổi, cao 1m82, tóc ngắn đánh rối màu đen, mặc áo khoác da xám phong trần, ánh mắt kiên định sắc bén.';
  });
  const [visualStyle, setVisualStyle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('tj_visual_style');
      if (saved !== null) return saved;
    } catch {
      // ignore
    }
    return 'Cinematic 8k resolution, dramatic volumetric lighting, photorealistic, 35mm lens, high contrast, fantasy atmosphere';
  });
  const [sceneInterval, setSceneInterval] = useState<SceneInterval>(10);

  // File & Scene States
  const [loadedFileName, setLoadedFileName] = useState<string>('demo_kịch_bản_tj_gun.srt');
  const [subtitles, setSubtitles] = useState<SRTSubtitle[]>([]);
  const [scenes, setScenes] = useState<SceneItem[]>([]);
  
  // Processing Control States
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [concurrencyMode, setConcurrencyMode] = useState<ConcurrencyMode>('auto');
  const [activeWorkersCount, setActiveWorkersCount] = useState<number>(0);
  const concurrencyModeRef = useRef<ConcurrencyMode>('auto');
  const [autoRetryErrors, setAutoRetryErrors] = useState<boolean>(true);
  const autoRetryErrorsRef = useRef<boolean>(true);
  const [activeTab, setActiveTab] = useState<'scenes' | 'errors'>('scenes');

  const handleToggleAutoRetryErrors = () => {
    setAutoRetryErrors((prev) => {
      const next = !prev;
      autoRetryErrorsRef.current = next;
      setToast({
        id: Date.now().toString(),
        type: 'info',
        title: next ? 'Đã bật Tự động thử lại lỗi' : 'Đã tắt Tự động thử lại lỗi',
        description: next
          ? 'Hệ thống sẽ tự động thử lại các phân cảnh bị lỗi sau khi xử lý xong lượt danh sách ban đầu.'
          : 'Hệ thống sẽ dừng lại khi hoàn thành lượt quét ban đầu mà không tự động thử lại câu lỗi.',
      });
      return next;
    });
  };
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState<boolean>(false);
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isRecentlyCleared, setIsRecentlyCleared] = useState<boolean>(false);
  const mainFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    concurrencyModeRef.current = concurrencyMode;
  }, [concurrencyMode]);
  
  // Error & Log States
  const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>([]);
  
  // Network & Connectivity States
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineDuration, setOfflineDuration] = useState<number>(0);

  // Selected AI Model / API (Defaults to gemini-3.8-flash which has active quota)
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('tj_selected_model');
      if (stored && stored !== 'gemini-2.5-flash' && stored !== 'gemini-2.0-flash') {
        return stored;
      }
      return 'gemini-3.8-flash';
    } catch {
      return 'gemini-3.8-flash';
    }
  });

  // Authentic Real API Telemetry Metrics (Synchronized directly with server API gateway)
  const [quotaStats, setQuotaStats] = useState<APIQuotaStats>({
    requestsInLastMinute: 0,
    maxRPM: 15,
    requestsToday: 0, // Real 0, NEVER hardcoded mock number!
    maxRPD: 1500,
    estimatedResetSeconds: 0,
    isRealTelemetry: true,
  });

  // Quota & Rate Limit Modal state
  const [quotaModalState, setQuotaModalState] = useState<{
    isOpen: boolean;
    modelName: string;
    countdownSeconds: number;
    isDailyQuota: boolean;
    message?: string;
  }>({
    isOpen: false,
    modelName: 'Gemini 3.8 Flash',
    countdownSeconds: 60,
    isDailyQuota: false,
  });

  // Fetch real authoritative API telemetry from server
  const fetchRealQuotaStats = useCallback(async (modelToQuery?: string) => {
    try {
      const target = modelToQuery || selectedModel;
      const res = await fetch(`/api/quota-stats?model=${encodeURIComponent(target)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setQuotaStats({
            requestsInLastMinute: data.requestsInLastMinute,
            maxRPM: data.maxRPM,
            requestsToday: data.requestsToday,
            maxRPD: data.maxRPD,
            estimatedResetSeconds: data.estimatedResetSeconds,
            totalRequestsAllTime: data.totalRequestsAllTime,
            isRealTelemetry: true,
          });
        }
      }
    } catch {
      // Network hiccup - ignore
    }
  }, [selectedModel]);

  // Periodic and initial fetch of real API stats
  useEffect(() => {
    fetchRealQuotaStats();
    const timer = window.setInterval(() => {
      fetchRealQuotaStats();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [fetchRealQuotaStats]);

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    try {
      localStorage.setItem('tj_selected_model', modelId);
    } catch {
      // ignore
    }
    fetchRealQuotaStats(modelId);
  };

  // Ref locks to handle async queue processing loops
  const processingRef = useRef<boolean>(false);
  const scenesRef = useRef<SceneItem[]>([]);
  scenesRef.current = scenes;

  // Initialize with Demo SRT on first load
  useEffect(() => {
    const parsed = parseSRT(DEMO_SRT_CONTENT);
    setSubtitles(parsed);
    const chunked = chunkSRTIntoScenes(parsed, sceneInterval);
    setScenes(chunked);
  }, []);

  // Re-chunk scenes when interval setting changes
  const handleIntervalChange = (newInterval: SceneInterval) => {
    setSceneInterval(newInterval);
    if (subtitles.length > 0) {
      const chunked = chunkSRTIntoScenes(subtitles, newInterval);
      setScenes(chunked);
    }
  };

  // Listen to network online / offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineDuration(0);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Offline duration counter
  useEffect(() => {
    let timer: number | undefined;
    if (!isOnline) {
      timer = window.setInterval(() => {
        setOfflineDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setOfflineDuration(0);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [isOnline]);

  // Cleanup audio alert on unmount
  useEffect(() => {
    return () => {
      completionAudioAlert.stop();
    };
  }, []);

  // Handle SRT File Upload with intelligent multi-encoding support
  const handleSRTFileUpload = async (file: File) => {
    completionAudioAlert.stop();
    setShowCompletionModal(false);
    setShowClearCacheModal(false);
    setLoadedFileName(file.name);

    try {
      const content = await readSRTFileContent(file);
      if (content) {
        const parsed = parseSRT(content);
        if (parsed.length === 0) {
          setToast({
            id: Date.now().toString(),
            type: 'error',
            title: 'Không thể phân tích phân cảnh nào từ file!',
            description: `Tệp "${file.name}" không tìm thấy mốc thời gian chuẩn. Hãy đảm bảo file chứa cú pháp "HH:MM:SS,mmm --> HH:MM:SS,mmm" hoặc dùng nút "Dán SRT" để dán trực tiếp.`,
          });
          return;
        }

        setSubtitles(parsed);
        const chunked = chunkSRTIntoScenes(parsed, sceneInterval);
        setScenes(chunked);
        setErrorLogs([]);
        setProcessingState('idle');
        setToast({
          id: Date.now().toString(),
          type: 'success',
          title: 'Đã nạp file .SRT thành công!',
          description: `Đã nạp tệp "${file.name}" gồm ${parsed.length} câu thoại, chia thành ${chunked.length} phân cảnh (${sceneInterval}s/cảnh).`,
        });
      }
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Lỗi đọc tệp .SRT',
        description: `Không thể đọc file "${file.name}": ${err?.message || 'Lỗi không xác định'}.`,
      });
    }
  };

  // Handle direct raw SRT text (from Paste modal or quick presets)
  const handleLoadRawSRT = (content: string, fileName: string = 'Kịch_bản_phụ_đề.srt') => {
    completionAudioAlert.stop();
    setShowCompletionModal(false);
    setShowClearCacheModal(false);
    setLoadedFileName(fileName);

    const parsed = parseSRT(content);
    if (parsed.length === 0) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Không tìm thấy phân cảnh nào!',
        description: 'Nội dung phụ đề không có mốc thời gian chuẩn (HH:MM:SS,mmm --> HH:MM:SS,mmm). Vui lòng kiểm tra lại.',
      });
      return;
    }

    setSubtitles(parsed);
    const chunked = chunkSRTIntoScenes(parsed, sceneInterval);
    setScenes(chunked);
    setErrorLogs([]);
    setProcessingState('idle');
    setToast({
      id: Date.now().toString(),
      type: 'success',
      title: 'Đã nạp phụ đề thành công!',
      description: `Đã nạp thành công "${fileName}" gồm ${parsed.length} câu thoại, tạo thành ${chunked.length} phân cảnh (${sceneInterval}s/cảnh).`,
    });
  };

  // Server health check / Ping
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setIsOnline(true);
        setOfflineDuration(0);
        return true;
      }
    } catch {
      setIsOnline(false);
    }
    return false;
  }, []);

  // Helper to append Error Log
  const addErrorLog = (
    sceneIndex: number,
    timeCode: string,
    errorType: ErrorLogEntry['errorType'],
    message: string,
    detail: string = ''
  ) => {
    const newEntry: ErrorLogEntry = {
      id: `${Date.now()}-${sceneIndex}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      sceneIndex,
      timeCode,
      errorType,
      message,
      detail,
      resolved: false,
    };
    setErrorLogs((prev) => [newEntry, ...prev]);
  };

  // Generate Prompt API Call for a single scene
  const generatePromptForScene = async (scene: SceneItem): Promise<{ success: boolean; prompt?: string; error?: string; errorCode?: string; retryAfterSeconds?: number }> => {
    try {
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterInfo,
          visualStyle,
          srtText: scene.srtText,
          timeRange: `${scene.startTimeCode} - ${scene.endTimeCode}`,
          sceneIndex: scene.sceneIndex,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update real API telemetry directly from authoritative backend response
        if (data.quotaStats) {
          setQuotaStats({
            requestsInLastMinute: data.quotaStats.requestsInLastMinute,
            maxRPM: data.quotaStats.maxRPM,
            requestsToday: data.quotaStats.requestsToday,
            maxRPD: data.quotaStats.maxRPD,
            estimatedResetSeconds: data.quotaStats.estimatedResetSeconds,
            totalRequestsAllTime: data.quotaStats.totalRequestsAllTime,
            isRealTelemetry: true,
          });
        } else {
          fetchRealQuotaStats();
        }
        return { success: true, prompt: data.prompt };
      } else {
        // Handle API Rate Limit (429) - Trigger countdown modal without changing model
        if (data.errorCode === 'API_429_RATE_LIMIT') {
          const retrySecs = data.retryAfterSeconds || 60;
          setQuotaModalState({
            isOpen: true,
            modelName: selectedModel,
            countdownSeconds: retrySecs,
            isDailyQuota: !!data.isDailyQuota,
            message: data.error,
          });
        }

        return {
          success: false,
          error: data.error || 'Lỗi không thể sinh prompt',
          errorCode: data.errorCode || 'UNKNOWN',
          retryAfterSeconds: data.retryAfterSeconds,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: 'Mất kết nối tới server proxy backend.',
        errorCode: 'NETWORK_OFFLINE',
      };
    }
  };

  // Main Background Concurrent Queue Processing Pool
  const runBatchProcessing = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessingState('running');

    // 1. Determine worker count & pacing delay based on Concurrency Mode & Model
    const mode = concurrencyModeRef.current;
    let targetWorkers = 1;
    let interRequestDelay = 2000;

    if (mode === 'auto') {
      // Auto mode: Prioritize Free Tier rate limits (15 RPM for Flash, 2 RPM for Pro)
      if (selectedModel === 'gemini-2.5-pro') {
        targetWorkers = 1;
        interRequestDelay = 30000; // 2 RPM safety for Pro
      } else {
        targetWorkers = 2; // 2 concurrent workers for Free Tier Flash
        interRequestDelay = 2500; // Pacing keeps total rate ~10-12 RPM, well below 15 RPM limit
      }
    } else if (mode === 1) {
      targetWorkers = 1;
      interRequestDelay = 1500;
    } else if (mode === 2) {
      targetWorkers = 2;
      interRequestDelay = 1800;
    } else if (mode === 3) {
      targetWorkers = 3;
      interRequestDelay = 1000; // Maximum speed
    }

    let currentActiveWorkers = 0;
    const updateActiveWorkers = (delta: number) => {
      currentActiveWorkers += delta;
      setActiveWorkersCount(Math.max(0, currentActiveWorkers));
    };

    // Worker instance function
    const worker = async (workerId: number) => {
      updateActiveWorkers(1);

      try {
        while (processingRef.current) {
          // Re-check internet connection
          if (!navigator.onLine) {
            setIsOnline(false);
            addErrorLog(0, '00:00:00', 'NETWORK_OFFLINE', 'Kết nối Internet bị ngắt.', 'Đang tạm hoãn chạy các luồng để chờ khôi phục mạng.');
            setProcessingState('paused');
            processingRef.current = false;
            break;
          }

          // Atomically find next pending scene
          const currentList = scenesRef.current;
          const targetIndex = currentList.findIndex((s) => s.status === 'pending');

          if (targetIndex === -1) {
            // No more pending scenes in queue
            break;
          }

          const targetScene = currentList[targetIndex];

          // Atomically lock scene to 'processing' in state and ref immediately
          setScenes((prev) =>
            prev.map((s, idx) =>
              idx === targetIndex ? { ...s, status: 'processing', errorMessage: undefined } : s
            )
          );
          scenesRef.current = scenesRef.current.map((s, idx) =>
            idx === targetIndex ? { ...s, status: 'processing', errorMessage: undefined } : s
          );

          // Call API
          const result = await generatePromptForScene(targetScene);

          // Check if user paused or stopped while request was in-flight
          if (!processingRef.current) {
            if (result.success && result.prompt) {
              setScenes((prev) =>
                prev.map((s, idx) =>
                  idx === targetIndex
                    ? {
                        ...s,
                        status: 'success',
                        prompt: result.prompt!,
                        generatedAt: new Date().toLocaleTimeString('vi-VN'),
                      }
                    : s
                )
              );
              scenesRef.current = scenesRef.current.map((s, idx) =>
                idx === targetIndex
                  ? {
                      ...s,
                      status: 'success',
                      prompt: result.prompt!,
                      generatedAt: new Date().toLocaleTimeString('vi-VN'),
                    }
                  : s
              );
            }
            break;
          }

          if (result.success && result.prompt) {
            // Mark scene success
            setScenes((prev) =>
              prev.map((s, idx) =>
                idx === targetIndex
                  ? {
                      ...s,
                      status: 'success',
                      prompt: result.prompt!,
                      generatedAt: new Date().toLocaleTimeString('vi-VN'),
                    }
                  : s
              )
            );
            scenesRef.current = scenesRef.current.map((s, idx) =>
              idx === targetIndex
                ? {
                    ...s,
                    status: 'success',
                    prompt: result.prompt!,
                    generatedAt: new Date().toLocaleTimeString('vi-VN'),
                  }
                : s
            );
          } else {
            // Handle Error & Free Tier Auto-batch delay
            const errType: ErrorLogEntry['errorType'] =
              (result.errorCode as ErrorLogEntry['errorType']) || 'UNKNOWN';

            setScenes((prev) =>
              prev.map((s, idx) =>
                idx === targetIndex
                  ? {
                      ...s,
                      status: 'error',
                      errorMessage: result.error,
                      retryCount: (s.retryCount || 0) + 1,
                    }
                  : s
              )
            );
            scenesRef.current = scenesRef.current.map((s, idx) =>
              idx === targetIndex
                ? {
                    ...s,
                    status: 'error',
                    errorMessage: result.error,
                    retryCount: (s.retryCount || 0) + 1,
                  }
                : s
            );

            addErrorLog(
              targetScene.sceneIndex,
              `${targetScene.startTimeCode} - ${targetScene.endTimeCode}`,
              errType,
              result.error || 'Tạo prompt thất bại',
              `Chi tiết phân cảnh #${targetScene.sceneIndex} (Luồng #${workerId}): "${targetScene.srtText.substring(0, 60)}..."`
            );

            // If 429 Rate limit, backoff using calculated retryAfterSeconds (or 60s default)
            if (errType === 'API_429_RATE_LIMIT') {
              const backoffMs = Math.max(5000, ((result as any).retryAfterSeconds || 60) * 1000);
              await new Promise((r) => setTimeout(r, backoffMs));
            }
          }

          // Throttle gap per worker
          await new Promise((r) => setTimeout(r, interRequestDelay));

          // Sync authentic real API telemetry from server
          fetchRealQuotaStats();
        }
      } finally {
        updateActiveWorkers(-1);
      }
    };

    // 2. Launch concurrent workers pool
    const workers = Array.from({ length: targetWorkers }, (_, i) => worker(i + 1));
    await Promise.all(workers);

    // 3. Auto-Retry Loop for Failed Scenes after finishing initial batch
    if (processingRef.current && autoRetryErrorsRef.current) {
      const failedScenes = scenesRef.current.filter(
        (s) => s.status === 'error' && (s.retryCount || 0) < 5
      );
      if (failedScenes.length > 0) {
        setToast({
          id: Date.now().toString(),
          type: 'info',
          title: 'Tự động thử lại các phân cảnh bị lỗi...',
          description: `Đã hoàn thành lượt danh sách ban đầu. Tìm thấy ${failedScenes.length} phân cảnh bị lỗi, tự động nghỉ 3.5s giải phóng hạn mức API trước khi chạy lại...`,
        });

        // Pause 3.5 seconds to let API rate limits cool down
        await new Promise((r) => setTimeout(r, 3500));

        if (processingRef.current) {
          // Convert failed scenes back to pending status
          setScenes((prev) =>
            prev.map((s) =>
              s.status === 'error' && (s.retryCount || 0) < 5
                ? { ...s, status: 'pending', errorMessage: undefined }
                : s
            )
          );
          scenesRef.current = scenesRef.current.map((s) =>
            s.status === 'error' && (s.retryCount || 0) < 5
              ? { ...s, status: 'pending', errorMessage: undefined }
              : s
          );

          // Relaunch worker pool recursively for newly pending failed scenes
          processingRef.current = false;
          await runBatchProcessing();
          return;
        }
      }
    }

    // 4. Check if completely finished
    if (processingRef.current) {
      const remainingPending = scenesRef.current.some(
        (s) => s.status === 'pending' || s.status === 'processing'
      );
      if (!remainingPending) {
        setProcessingState('completed');
        processingRef.current = false;
        setActiveWorkersCount(0);
        setShowCompletionModal(true);
        completionAudioAlert.start();
      }
    }
  };

  // Button Handlers
  const handleStart = () => {
    if (scenes.length === 0) return;
    completionAudioAlert.stop();
    setShowCompletionModal(false);
    runBatchProcessing();
  };

  const handlePause = () => {
    completionAudioAlert.stop();
    setShowCompletionModal(false);
    processingRef.current = false;
    setProcessingState('paused');
    setActiveWorkersCount(0);
    setScenes((prev) =>
      prev.map((s) => (s.status === 'processing' ? { ...s, status: 'pending' } : s))
    );
    scenesRef.current = scenesRef.current.map((s) =>
      s.status === 'processing' ? { ...s, status: 'pending' } : s
    );
  };

  const handleResume = () => {
    completionAudioAlert.stop();
    setShowCompletionModal(false);
    runBatchProcessing();
  };

  const handleStop = () => {
    completionAudioAlert.stop();
    setShowCompletionModal(false);
    processingRef.current = false;
    setProcessingState('stopped');
    setActiveWorkersCount(0);
    setScenes((prev) =>
      prev.map((s) => (s.status === 'processing' ? { ...s, status: 'pending' } : s))
    );
    scenesRef.current = scenesRef.current.map((s) =>
      s.status === 'processing' ? { ...s, status: 'pending' } : s
    );
  };

  const handleConcurrencyModeChange = (mode: ConcurrencyMode) => {
    setConcurrencyMode(mode);
    concurrencyModeRef.current = mode;
    const modeLabel =
      mode === 'auto'
        ? 'Tự động (Ưu tiên Free Tier 2 luồng điều tiết an toàn)'
        : `${mode} luồng song song`;
    setToast({
      id: Date.now().toString(),
      type: 'info',
      title: 'Đã đổi tốc độ luồng xử lý',
      description: `Đang áp dụng: ${modeLabel}.`,
    });
  };

  // Strictly Manual Save for Configuration:
  // "phần cấu hình tôi muốn chỉ có thể edit và save bằng manual, các thao tác tự động khác tuyệt đối không thể làm thay đổi được phần này"
  const handleSaveManualConfig = (newCharacter: string, newStyle: string) => {
    setCharacterInfo(newCharacter);
    setVisualStyle(newStyle);
    try {
      localStorage.setItem('tj_character_info', newCharacter);
      localStorage.setItem('tj_visual_style', newStyle);
    } catch {
      // ignore
    }
    setToast({
      id: Date.now().toString(),
      type: 'success',
      title: 'Đã lưu cấu hình thủ công thành công!',
      description: 'Thông tin Nhân vật & Style đã được lưu cố định. Mọi thao tác tự động khác tuyệt đối không thể thay đổi phần này.',
    });
  };

  // Clear Cache & History Handler:
  // "tôi chỉ muốn bấm nút xóa cache, hiện hộp thoại thông báo đã xóa xong, xóa lịch sử, xóa cache và các thứ liên quan đến app để app chạy mượt mà hơn. tuyệt đối trong mọi trường hợp không xóa cấu hình. hãy làm lại nút xóa cache"
  const handleClearCacheAndHistory = () => {
    // 1. Dừng ngay âm thanh thông báo và các cờ chạy nền
    completionAudioAlert.stop();
    setShowCompletionModal(false);
    processingRef.current = false;
    setProcessingState('idle');

    // 2. Xóa sạch lịch sử lỗi, phân cảnh cũ, phụ đề để giải phóng RAM giúp app chạy mượt mà
    setErrorLogs([]);
    setScenes([]);
    setSubtitles([]);
    setLoadedFileName('');

    // 3. TUYỆT ĐỐI KHÔNG XÓA CẤU HÌNH:
    // characterInfo, visualStyle, sceneInterval, customApiKey, selectedModel ĐƯỢC GIỮ NGUYÊN 100%!

    // 4. Hiệu ứng nút bấm phản hồi
    setIsRecentlyCleared(true);
    setTimeout(() => setIsRecentlyCleared(false), 3500);

    // 5. Mở ngay hộp thoại thông báo xác nhận đã xóa xong
    setShowClearCacheModal(true);

    // 6. Kèm theo Toast thông báo nổi
    setToast({
      id: Date.now().toString(),
      type: 'success',
      title: 'Đã dọn dẹp cache & lịch sử thành công!',
      description: 'Bộ nhớ đã được giải phóng để app chạy mượt mà. Cấu hình Nhân vật & Phong cách được bảo lưu 100%.',
    });
  };

  // Retry Single Scene
  const handleRetryScene = (sceneIndex: number) => {
    setScenes((prev) =>
      prev.map((s) =>
        s.sceneIndex === sceneIndex ? { ...s, status: 'pending', errorMessage: undefined } : s
      )
    );
    scenesRef.current = scenesRef.current.map((s) =>
      s.sceneIndex === sceneIndex ? { ...s, status: 'pending', errorMessage: undefined } : s
    );
    if (processingState !== 'running') {
      runBatchProcessing();
    }
  };

  // Retry All Failed Errors
  const handleRetryAllErrors = () => {
    setScenes((prev) =>
      prev.map((s) => (s.status === 'error' ? { ...s, status: 'pending', errorMessage: undefined } : s))
    );
    scenesRef.current = scenesRef.current.map((s) =>
      s.status === 'error' ? { ...s, status: 'pending', errorMessage: undefined } : s
    );
    setErrorLogs((prev) => prev.map((l) => ({ ...l, resolved: true })));
    if (processingState !== 'running') {
      runBatchProcessing();
    }
  };

  // Export Prompts TXT
  // Định dạng tên file: [tên file import] + PromptTJ
  const handleExportTxt = () => {
    completionAudioAlert.stop();
    setShowCompletionModal(false);
    const baseName = loadedFileName.replace(/\.[^/.]+$/, '');
    exportPromptsToTxt(scenes, `${baseName}PromptTJ.txt`);
  };

  const handleConfirmDownload = () => {
    completionAudioAlert.stop();
    setShowCompletionModal(false);
    handleExportTxt();
  };

  // Copy All Prompts
  const handleCopyAllPrompts = () => {
    const validPrompts = scenes
      .filter((s) => s.status === 'success' && s.prompt)
      .map((s) => s.prompt)
      .join('\n\n');

    if (validPrompts) {
      navigator.clipboard.writeText(validPrompts);
      alert(`Đã sao chép thành công ${scenes.filter((s) => s.status === 'success').length} Prompt vào khay nhớ tạm!`);
    }
  };

  // Computed Values
  const totalScenesCount = scenes.length;
  const completedScenesCount = scenes.filter((s) => s.status === 'success').length;
  const unresolvedErrorsCount = scenes.filter((s) => s.status === 'error').length;
  const totalErrorsCount = errorLogs.length;

  const currentProcessingScene = scenes.find((s) => s.status === 'processing') || scenes.find((s) => s.status === 'pending');
  const currentSceneIndex = currentProcessingScene ? currentProcessingScene.sceneIndex : (completedScenesCount || 0);

  const currentTimeCode = currentProcessingScene ? currentProcessingScene.startTimeCode : '00:00:00';
  const lastScene = scenes[scenes.length - 1];
  const totalDurationTimeCode = lastScene ? lastScene.endTimeCode : '00:00:00';

  const progressPercent = totalScenesCount > 0 ? (completedScenesCount / totalScenesCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* 1. Horizontal Header */}
      <HorizontalHeader
        quotaStats={quotaStats}
        isOnline={isOnline}
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
        onManualPing={checkHealth}
      />

      {/* Main Horizontal Dashboard Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col gap-3">
        {/* 2. Setup Panel (Character Info & Custom Visual Style) - Strictly Manual! */}
        <SetupPanel
          characterInfo={characterInfo}
          visualStyle={visualStyle}
          onSaveConfig={handleSaveManualConfig}
          onCharacterInfoChange={setCharacterInfo}
          onVisualStyleChange={setVisualStyle}
          disabled={processingState === 'running'}
        />

        {/* 3. Horizontal Control Toolbar */}
        <ControlToolbar
          processingState={processingState}
          interval={sceneInterval}
          concurrencyMode={concurrencyMode}
          onConcurrencyModeChange={handleConcurrencyModeChange}
          autoRetryErrors={autoRetryErrors}
          onToggleAutoRetryErrors={handleToggleAutoRetryErrors}
          onRetryAllErrors={handleRetryAllErrors}
          unresolvedErrorsCount={unresolvedErrorsCount}
          hasSRTLoaded={scenes.length > 0}
          totalScenesCount={totalScenesCount}
          completedScenesCount={completedScenesCount}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          onClearCache={handleClearCacheAndHistory}
          onExportTxt={handleExportTxt}
          onSRTFileUpload={handleSRTFileUpload}
          onOpenPasteModal={() => setShowPasteModal(true)}
          onIntervalChange={handleIntervalChange}
          loadedFileName={loadedFileName}
          isRecentlyCleared={isRecentlyCleared}
        />

        {/* 4. Real-time Status Labels */}
        <StatusBar
          fileName={loadedFileName}
          currentSceneIndex={currentSceneIndex}
          totalScenes={totalScenesCount}
          unresolvedErrorsCount={unresolvedErrorsCount}
          totalErrorsCount={totalErrorsCount}
          currentTimeCode={currentTimeCode}
          totalDurationTimeCode={totalDurationTimeCode}
          processingState={processingState}
          concurrencyMode={concurrencyMode}
          activeWorkersCount={activeWorkersCount}
          onRetryAllErrors={handleRetryAllErrors}
        />

        {/* 5. Animated Tom & Jerry Chase Progress Bar (0% - 100%) */}
        <TomAndJerryProgressBar
          progress={progressPercent}
          currentScene={completedScenesCount}
          totalScenes={totalScenesCount}
        />

        {/* 6. Main Workspace Tabs: Scenes List vs Error Log */}
        <div className="w-full flex flex-wrap items-center justify-between gap-2.5 mt-2 mb-0.5">
          <div className="h-8.5 inline-flex items-center bg-slate-100/80 border border-slate-200 p-0.5 rounded-lg">
            <button
              onClick={() => setActiveTab('scenes')}
              className={`h-7.5 px-3 rounded-md font-medium text-xs transition-all flex items-center gap-1.5 ${
                activeTab === 'scenes'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Phân Cảnh SRT &amp; Prompt</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeTab === 'scenes' ? 'bg-slate-100 text-slate-700 font-semibold' : 'text-slate-400'
              }`}>
                {scenes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('errors')}
              className={`h-7.5 px-3 rounded-md font-medium text-xs transition-all flex items-center gap-1.5 ${
                activeTab === 'errors'
                  ? 'bg-white text-rose-700 font-semibold shadow-2xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Lịch Sử Lỗi</span>
              {errorLogs.length > 0 && (
                <span className="bg-rose-50 text-rose-600 font-semibold text-[10px] px-1.5 py-0.5 rounded-full border border-rose-200">
                  {errorLogs.length}
                </span>
              )}
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Tự động tối ưu Free Tier Google Gemini</span>
          </div>
        </div>

        {/* 7. Tab View Content */}
        {activeTab === 'scenes' ? (
          <SceneListView
            scenes={scenes}
            onRetryScene={handleRetryScene}
            onRetryAllErrors={handleRetryAllErrors}
            onCopyAllPrompts={handleCopyAllPrompts}
            isProcessing={processingState === 'running'}
            onImportClick={() => mainFileInputRef.current?.click()}
          />
        ) : (
          <ErrorHistoryLog
            logs={errorLogs}
            onRetryAllErrors={handleRetryAllErrors}
            onClearErrorLog={() => setErrorLogs([])}
            isProcessing={processingState === 'running'}
          />
        )}
      </main>

      {/* Hidden File Input for empty state trigger */}
      <input
        type="file"
        ref={mainFileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleSRTFileUpload(file);
            e.target.value = '';
          }
        }}
        accept=".srt,.txt,.vtt"
        className="hidden"
      />

      {/* 8. Floating Network Alert & 100s Auto-Reconnect Modal */}
      <NetworkAlertModal
        isOnline={isOnline}
        offlineDurationSeconds={offlineDuration}
        onManualReconnect={checkHealth}
      />

      {/* 8.5. Quota & Rate Limit (429) Countdown Modal */}
      <QuotaRateLimitModal
        isOpen={quotaModalState.isOpen}
        modelName={quotaModalState.modelName}
        countdownSeconds={quotaModalState.countdownSeconds}
        isDailyQuota={quotaModalState.isDailyQuota}
        message={quotaModalState.message}
        onRetryNow={() => {
          setQuotaModalState((prev) => ({ ...prev, isOpen: false }));
          if (processingState === 'paused' || processingState === 'idle') {
            runBatchProcessing();
          }
        }}
        onPauseBatch={() => {
          setQuotaModalState((prev) => ({ ...prev, isOpen: false }));
          handlePause();
        }}
      />

      {/* 9. 100% Completion Notification Modal with Endless Looping Alarm */}
      <CompletionModal
        isOpen={showCompletionModal}
        loadedFileName={loadedFileName}
        totalScenes={totalScenesCount}
        onConfirmDownload={handleConfirmDownload}
        onDismiss={() => {
          completionAudioAlert.stop();
          setShowCompletionModal(false);
        }}
      />

      {/* 10. Cache Cleared Success Confirmation Modal */}
      <CacheClearedSuccessModal
        isOpen={showClearCacheModal}
        onClose={() => setShowClearCacheModal(false)}
        onImportNextFile={() => mainFileInputRef.current?.click()}
      />

      {/* 11. Paste Raw SRT Content Modal */}
      <PasteSRTModal
        isOpen={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        interval={sceneInterval}
        onLoadContent={(content, name) => handleLoadRawSRT(content, name)}
      />

      {/* 12. Toast Notification Banner */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
