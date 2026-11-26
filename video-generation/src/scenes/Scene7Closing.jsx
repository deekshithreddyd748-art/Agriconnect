import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Sprout, Tractor, Users, Warehouse } from 'lucide-react';
import { COLORS } from '../components/BrowserFrame';

export const Scene7Closing = () => {
  const frame = useCurrentFrame(); // 0..600 (20s)
  const { fps } = useVideoConfig();

  // Frames 0..220: Rapid clean visual montage
  // Frames 220..600: Final AgriConnect + Team ANOKA Logo Card
  const montageFade = interpolate(frame, [200, 240], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const crestSpring = spring({ frame: frame - 230, fps, config: { damping: 14, stiffness: 80 } });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.forest900 }}>
      {/* Part 1: Fast Montage Grid */}
      {frame < 245 && (
        <AbsoluteFill
          style={{
            backgroundColor: COLORS.earth50,
            padding: '70px 100px 130px',
            opacity: montageFade,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 28,
          }}
        >
          {[
            { title: 'Machinery Rentals', img: 'machinery-tractor.jpg', icon: Tractor, tag: 'Tractors & Harvesters' },
            { title: 'Agricultural Labour', img: 'labour-farm-team.jpg', icon: Users, tag: 'Skilled Farm Crews' },
            { title: 'Storage Facilities', img: 'storage-warehouse.jpg', icon: Warehouse, tag: 'Cold Storage & Grain Dryers' },
          ].map((tile, idx) => {
            const Icon = tile.icon;
            const s = spring({ frame: frame - idx * 14, fps, config: { damping: 14 } });
            return (
              <div
                key={tile.title}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 28,
                  border: `2px solid ${COLORS.earth200}`,
                  overflow: 'hidden',
                  boxShadow: '0 20px 50px rgba(15, 23, 42, 0.12)',
                  transform: `translateY(${interpolate(s, [0, 1], [60, 0])}px)`,
                  opacity: s,
                }}
              >
                <Img src={staticFile(tile.img)} style={{ width: '100%', height: 480, objectFit: 'cover' }} />
                <div style={{ padding: 28, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      backgroundColor: COLORS.forest50,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={28} color={COLORS.forest700} />
                  </div>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: COLORS.forest900 }}>{tile.title}</div>
                    <div style={{ fontSize: 16, color: COLORS.slate600, fontWeight: 600 }}>{tile.tag}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </AbsoluteFill>
      )}

      {/* Part 2: Final Branding Card */}
      {frame >= 210 && (
        <AbsoluteFill
          style={{
            background: 'radial-gradient(circle at 50% 35%, #16A34A 0%, #14532D 45%, #0B2E18 100%)',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: interpolate(frame, [210, 250], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          <div
            style={{
              textAlign: 'center',
              transform: `scale(${interpolate(crestSpring, [0, 1], [0.85, 1])})`,
              maxWidth: 1180,
            }}
          >
            <div
              style={{
                width: 132,
                height: 132,
                margin: '0 auto 30px',
                borderRadius: 36,
                backgroundColor: COLORS.fresh500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 24px 65px rgba(34, 197, 94, 0.5)',
              }}
            >
              <Sprout size={72} color={COLORS.forest900} strokeWidth={2.5} />
            </div>

            <div style={{ fontSize: 96, fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.07em' }}>
              AGRICONNECT
            </div>

            <div style={{ fontSize: 40, fontWeight: 700, color: '#DCFCE7', marginTop: 18 }}>
              Connecting Farmers. Empowering Agriculture.
            </div>

            <div
              style={{
                marginTop: 42,
                display: 'flex',
                justifyContent: 'center',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              {['Farmer', 'Equipment Owner', 'Labour Provider', 'Facility Owner'].map((role) => (
                <div
                  key={role}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 999,
                    backgroundColor: 'rgba(255,255,255,0.14)',
                    border: '1px solid rgba(255,255,255,0.28)',
                    color: '#FFFFFF',
                    fontSize: 19,
                    fontWeight: 700,
                  }}
                >
                  {role}
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 52,
                display: 'inline-block',
                padding: '14px 36px',
                borderRadius: 18,
                backgroundColor: '#FFFFFF',
                color: COLORS.forest900,
                fontSize: 28,
                fontWeight: 900,
                boxShadow: '0 16px 38px rgba(0, 0, 0, 0.35)',
              }}
            >
              Developed by Team ANOKA
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
