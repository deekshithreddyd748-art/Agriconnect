import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { SCENES } from '../timeline';

const KEYWORDS = [
  'AgriConnect',
  'Farmers',
  'Machinery',
  'Labour',
  'Facilities',
  'Nearby Services',
  'Bookings',
];

function renderHighlightedText(rawText) {
  const parts = rawText.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      const isSpecial = KEYWORDS.some((k) => inner.includes(k));
      return (
        <span
          key={idx}
          style={{
            color: isSpecial ? '#4ADE80' : '#FDE047',
            fontWeight: 800,
          }}
        >
          {inner}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export const SubtitleBar = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;

  let activeCue = null;
  for (const scene of SCENES) {
    for (const sub of scene.subtitles) {
      const absStart = scene.startSec + sub.startOffset;
      const absEnd = scene.startSec + sub.endOffset;
      if (currentSec >= absStart && currentSec <= absEnd) {
        activeCue = { ...sub, absStart, absEnd };
        break;
      }
    }
    if (activeCue) break;
  }

  if (!activeCue) return null;

  const opacity = interpolate(
    currentSec,
    [activeCue.absStart, activeCue.absStart + 0.25, activeCue.absEnd - 0.25, activeCue.absEnd],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 34,
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: 1480,
        padding: '14px 30px',
        borderRadius: 16,
        backgroundColor: 'rgba(11, 46, 24, 0.88)',
        border: '1px solid rgba(74, 222, 128, 0.35)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
        color: '#FFFFFF',
        fontSize: 30,
        lineHeight: 1.35,
        fontWeight: 600,
        textAlign: 'center',
        letterSpacing: '0.01em',
        opacity,
        zIndex: 999,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {renderHighlightedText(activeCue.text)}
    </div>
  );
};
