import fs from 'fs';
import { SCENES } from '../src/timeline.js';

function formatSrtTime(sec) {
  const totalMs = Math.max(0, Math.round(sec * 1000));
  const hrs = Math.floor(totalMs / 3600000);
  const mins = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

let srtLines = [];
let idx = 1;
for (const scene of SCENES) {
  for (const cue of scene.subtitles) {
    const start = scene.startSec + cue.startOffset;
    const end = scene.startSec + cue.endOffset;
    const cleanText = cue.text.replace(/\*\*/g, '');
    srtLines.push(`${idx}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${cleanText}\n`);
    idx += 1;
  }
}

fs.mkdirSync('subtitles', { recursive: true });
fs.writeFileSync('subtitles/AgriConnect_Tutorial.srt', srtLines.join('\n'), 'utf8');
console.log('Generated subtitles/AgriConnect_Tutorial.srt (' + (idx - 1) + ' cues)');
