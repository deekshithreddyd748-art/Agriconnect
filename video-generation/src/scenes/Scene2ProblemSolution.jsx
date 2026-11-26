import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Tractor, Users, Warehouse, MapPin } from 'lucide-react';
import { COLORS } from '../components/BrowserFrame';

const PILLARS = [
  {
    title: 'Machinery',
    subtitle: 'Tractors, Harvesters, Rotavators & Seed Drills',
    image: 'machinery-tractor.jpg',
    icon: Tractor,
    accent: '#22C55E',
    bg: '#F0FDF4',
  },
  {
    title: 'Labour',
    subtitle: 'Skilled Farm Crews & Harvest Workers',
    image: 'labour-farm-team.jpg',
    icon: Users,
    accent: '#D97706',
    bg: '#FEF3C7',
  },
  {
    title: 'Agricultural Facilities',
    subtitle: 'Cold Storage, Warehouses & Grain Dryers',
    image: 'storage-warehouse.jpg',
    icon: Warehouse,
    accent: '#0284C7',
    bg: '#E0F2FE',
  },
];

export const Scene2ProblemSolution = () => {
  const frame = useCurrentFrame(); // 0..600 frames (20s)
  const { fps } = useVideoConfig();

  // Frames 0..320: Full cinematic photo showcase cycling across the 3 agricultural scenes
  // Frames 320..600: Unified 4-pillar AgriConnect solution cards
  const activePhotoIdx = frame < 110 ? 0 : frame < 220 ? 1 : 2;
  const solutionReveal = spring({ frame: frame - 320, fps, config: { damping: 15, stiffness: 85 } });
  const showSolution = frame >= 305;

  const currentPhoto = PILLARS[activePhotoIdx];
  const photoZoom = interpolate(frame % 110, [0, 110], [1.02, 1.12]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.earth50 }}>
      {/* Photo Showcase (First 11s) */}
      {frame < 345 && (
        <AbsoluteFill
          style={{
            opacity: interpolate(frame, [305, 345], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          <Img
            src={staticFile(currentPhoto.image)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${photoZoom})`,
            }}
          />
          <AbsoluteFill
            style={{
              background:
                'linear-gradient(180deg, rgba(11, 46, 24, 0.35) 0%, rgba(11, 46, 24, 0.85) 100%)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '0 100px',
            }}
          >
            <div style={{ textAlign: 'center', marginTop: -40 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 26px',
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  color: '#FFFFFF',
                  fontSize: 22,
                  fontWeight: 700,
                  marginBottom: 22,
                }}
              >
                RURAL COORDINATION CHALLENGE
              </div>
              <div
                style={{
                  fontSize: 78,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  textShadow: '0 8px 28px rgba(0,0,0,0.45)',
                }}
              >
                {currentPhoto.title}
              </div>
              <div style={{ fontSize: 32, color: '#DCFCE7', fontWeight: 600, marginTop: 14 }}>
                {currentPhoto.subtitle}
              </div>
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* Solution Grid (Seconds 11..20) */}
      {showSolution && (
        <AbsoluteFill
          style={{
            background: 'linear-gradient(145deg, #F8FAF5 0%, #EFF3EA 50%, #DCFCE7 100%)',
            padding: '72px 110px 130px',
            justifyContent: 'center',
            opacity: interpolate(frame, [305, 340], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            transform: `translateY(${interpolate(solutionReveal, [0, 1], [40, 0])}px)`,
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 46 }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: COLORS.fresh600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              One Simple Digital Platform
            </div>
            <div style={{ fontSize: 58, fontWeight: 900, color: COLORS.forest900, marginTop: 8 }}>
              Everything Your Farm Needs in One Place
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 26,
            }}
          >
            {[
              ...PILLARS,
              {
                title: 'Nearby Services',
                subtitle: 'Hyperlocal 5–25 km GPS Discovery',
                image: 'hero-farmer.jpg',
                icon: MapPin,
                accent: '#14532D',
                bg: '#DCFCE7',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              const s = spring({ frame: frame - (330 + idx * 14), fps, config: { damping: 14 } });
              return (
                <div
                  key={item.title}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 26,
                    border: `2px solid ${COLORS.earth200}`,
                    overflow: 'hidden',
                    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
                    transform: `translateY(${interpolate(s, [0, 1], [50, 0])}px) scale(${interpolate(
                      s,
                      [0, 1],
                      [0.94, 1]
                    )})`,
                    opacity: s,
                  }}
                >
                  <div style={{ height: 220, overflow: 'hidden', position: 'relative' }}>
                    <Img
                      src={staticFile(item.image)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ padding: 28 }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        backgroundColor: item.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                      }}
                    >
                      <Icon size={30} color={item.accent} />
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.slate900 }}>
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        color: COLORS.slate600,
                        marginTop: 10,
                        lineHeight: 1.4,
                      }}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
