import { SceneItem } from '../types';

/**
 * Export generated prompts to TXT file separated by \n\n
 */
export function exportPromptsToTxt(scenes: SceneItem[], fileName: string = 'prompts_tj_gun.txt', includeTimecode: boolean = false) {
  const validScenes = scenes.filter(s => s.prompt && s.prompt.trim().length > 0);

  if (validScenes.length === 0) {
    alert('Chưa có prompt nào được khởi tạo để xuất file txt.');
    return;
  }

  const content = validScenes
    .map(s => {
      if (includeTimecode) {
        return `[Cảnh ${s.sceneIndex} | ${s.startTimeCode} - ${s.endTimeCode}]\n${s.prompt.trim()}`;
      }
      return s.prompt.trim();
    })
    .join('\n\n');

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
