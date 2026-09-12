import { SRTSubtitle, SceneItem, SceneInterval } from '../types';

/**
 * Parses timestamp string "HH:MM:SS,mmm" or "HH:MM:SS.mmm" to seconds
 */
export function timeCodeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const cleanStr = timeStr.trim().replace('.', ',');
  const parts = cleanStr.split(':');
  if (parts.length < 3) return 0;

  const hours = parseFloat(parts[0]) || 0;
  const minutes = parseFloat(parts[1]) || 0;
  const secParts = parts[2].split(',');
  const seconds = parseFloat(secParts[0]) || 0;
  const milliseconds = parseFloat(secParts[1] || '0') || 0;

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

/**
 * Formats seconds to "HH:MM:SS" string
 */
export function secondsToTimeCode(totalSeconds: number): string {
  const secs = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const remainingSeconds = secs % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  
  return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
}

/**
 * Intelligently reads and decodes any SRT file regardless of encoding
 * Supports UTF-8, UTF-8 with BOM, UTF-16LE, UTF-16BE, ANSI (Windows-1252/ISO-8859-1)
 */
export async function readSRTFileContent(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // 1. Check UTF-8 BOM (EF BB BF)
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(bytes.subarray(3));
  }

  // 2. Check UTF-16LE BOM (FF FE)
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes.subarray(2));
  }

  // 3. Check UTF-16BE BOM (FE FF)
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes.subarray(2));
  }

  // 4. Heuristic check for UTF-16 without BOM (common in Windows subtitle editors)
  let nullCountOdd = 0;
  let nullCountEven = 0;
  const checkLen = Math.min(bytes.length, 600);
  for (let i = 0; i < checkLen; i++) {
    if (bytes[i] === 0) {
      if (i % 2 === 1) nullCountOdd++;
      else nullCountEven++;
    }
  }

  if (nullCountOdd > 15 && nullCountEven < 5) {
    return new TextDecoder('utf-16le').decode(bytes);
  }
  if (nullCountEven > 15 && nullCountOdd < 5) {
    return new TextDecoder('utf-16be').decode(bytes);
  }

  // 5. Try standard UTF-8 (strict)
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    // 6. Fallback to Windows-1252 / ANSI for legacy subtitle files
    try {
      return new TextDecoder('windows-1252').decode(bytes);
    } catch {
      return new TextDecoder('utf-8').decode(bytes);
    }
  }
}

/**
 * Ultra-resilient parser for SRT / WebVTT subtitle text:
 * - Normalizes all newline formats (\r\n, \r, \n)
 * - Strips BOM and accidental null bytes
 * - Matches varied timestamp formats (, or . decimal, varied arrows -->, ->, –>, —>)
 * - Handles optional cue IDs, WebVTT positioning tags, and irregular blank line gaps
 */
export function parseSRT(srtContent: string): SRTSubtitle[] {
  if (!srtContent || !srtContent.trim()) return [];

  // Strip BOM, null bytes, normalize all line endings
  let text = srtContent
    .replace(/^\uFEFF/, '')
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Strip WebVTT header if present
  text = text.replace(/^WEBVTT[^\n]*\n+/i, '');

  const lines = text.split('\n');
  const subtitles: SRTSubtitle[] = [];

  // Regex matching timestamp lines like "00:00:00,520 --> 00:00:03,056"
  const timeRegex = /^(\d{1,2}:\d{2}:\d{2}[,\.]\d{1,3})\s*(?:-->|->|–>|—>)\s*(\d{1,2}:\d{2}:\d{2}[,\.]\d{1,3})/;

  let currentStartTime = '';
  let currentEndTime = '';
  let currentTextLines: string[] = [];
  let cueId = 1;

  const saveCurrentCue = () => {
    if (currentStartTime && currentEndTime) {
      const cleanText = currentTextLines
        .join(' ')
        .replace(/<[^>]*>/g, '') // strip HTML/formatting tags
        .trim();
      if (cleanText) {
        subtitles.push({
          id: cueId++,
          startTime: currentStartTime,
          endTime: currentEndTime,
          startSeconds: timeCodeToSeconds(currentStartTime),
          endSeconds: timeCodeToSeconds(currentEndTime),
          text: cleanText,
        });
      }
    }
    currentStartTime = '';
    currentEndTime = '';
    currentTextLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check if this line is a timestamp line
    const match = trimmed.match(timeRegex);
    if (match) {
      // Save previous cue if any
      saveCurrentCue();
      currentStartTime = match[1];
      currentEndTime = match[2];
      continue;
    }

    // If we have an active timestamp, collect text lines until next cue or boundary
    if (currentStartTime) {
      // Blank line indicates boundary
      if (!trimmed) {
        saveCurrentCue();
        continue;
      }

      // Check if next line is a timestamp and this line is just an integer cue ID
      if (/^\d+$/.test(trimmed) && i + 1 < lines.length && timeRegex.test(lines[i + 1].trim())) {
        saveCurrentCue();
        continue;
      }

      // Otherwise, this line is subtitle text
      currentTextLines.push(trimmed);
    }
  }

  // Save the last cue
  saveCurrentCue();

  return subtitles;
}

/**
 * Groups SRT subtitles into chunked scenes by selected interval (e.g. 10s per scene)
 */
export function chunkSRTIntoScenes(subtitles: SRTSubtitle[], intervalSeconds: SceneInterval): SceneItem[] {
  if (!subtitles || subtitles.length === 0) return [];

  // Defensive fallback: ensure interval is a strictly positive number
  const validInterval = (typeof intervalSeconds === 'number' && intervalSeconds > 0) ? intervalSeconds : 10;

  const maxSeconds = Math.max(...subtitles.map(s => s.endSeconds), validInterval);
  const totalChunks = Math.max(1, Math.ceil(maxSeconds / validInterval));

  const scenes: SceneItem[] = [];

  for (let idx = 0; idx < totalChunks; idx++) {
    const startSec = idx * validInterval;
    const endSec = (idx + 1) * validInterval;

    // Find all subtitles overlapping with [startSec, endSec]
    const overlapping = subtitles.filter(s => {
      return s.startSeconds < endSec && s.endSeconds > startSec;
    });

    let srtText = overlapping.map(s => s.text).join(' ');

    // Fallback if no exact subtitle in window, get closest nearby subtitle text
    if (!srtText.trim()) {
      const prevSub = [...subtitles].reverse().find(s => s.endSeconds <= startSec);
      const nextSub = subtitles.find(s => s.startSeconds >= endSec);
      if (prevSub) {
        srtText = `[Bối cảnh nối tiếp]: ${prevSub.text}`;
      } else if (nextSub) {
        srtText = `[Bối cảnh chuẩn bị]: ${nextSub.text}`;
      } else {
        srtText = '[Cảnh hành động không lời thoại]';
      }
    }

    scenes.push({
      id: idx + 1,
      sceneIndex: idx + 1,
      startTimeCode: secondsToTimeCode(startSec),
      endTimeCode: secondsToTimeCode(endSec),
      startSeconds: startSec,
      endSeconds: endSec,
      srtText: srtText.trim(),
      prompt: '',
      status: 'pending',
      retryCount: 0
    });
  }

  return scenes;
}
