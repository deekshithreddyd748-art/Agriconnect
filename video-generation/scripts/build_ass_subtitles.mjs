import fs from 'fs';
import { SCENES } from '../src/timeline.js';

function fmtAss(sec) {
  const cs = Math.max(0, Math.round(sec * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  const c = cs % 100;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
}

function toAssStyledText(raw) {
  // Highlight **Keyword** in bright Agriconnect green (&H80DE4A& in BGR) + bold
  return raw.replace(/\*\*([^*]+)\*\*/g, '{\\c&H80DE4A&\\b1}$1{\\c&HFFFFFF&\\b0}');
}

const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Segoe UI,40,&H00FFFFFF,&H0000FFFF,&H00123018,&HBE0B2E18,0,0,0,0,100,100,0.4,0,4,18,2,2,90,90,34,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

const events = [];
for (const sc of SCENES) {
  for (const cue of sc.subtitles) {
    const start = sc.startSec + cue.startOffset;
    const end = sc.startSec + cue.endOffset;
    events.push(
      `Dialogue: 0,${fmtAss(start)},${fmtAss(end)},Default,,0,0,0,,{\\fad(200,200)}${toAssStyledText(cue.text)}`
    );
  }
}

fs.mkdirSync('subtitles', { recursive: true });
fs.writeFileSync('subtitles/AgriConnect_Tutorial.ass', header + events.join('\n') + '\n', 'utf8');
console.log('Generated subtitles/AgriConnect_Tutorial.ass (' + events.length + ' styled cues)');
