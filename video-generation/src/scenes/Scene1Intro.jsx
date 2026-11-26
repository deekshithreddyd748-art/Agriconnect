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
import { Sprout, Tractor, Users, Warehouse, ArrowRight, Compass } from 'lucide-react';
import { BrowserFrame, COLORS } from '../components/BrowserFrame';

export const Scene1Intro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase A (0-180 frames = 0-6s): Cinematic Indian field Ken Burns + Logo Reveal
  // Phase B (180-540 frames = 6-18s): Transition into live LandingPage in BrowserFrame
  const bgScale = interpolate(frame, [0, 540], [1.0, 1.16], { extrapolateRight: 'clamp' });
  const logoSpring = spring({ frame: frame - 15, fps, config: { damping: 14, stiffness: 90 } });
  const browserEnter = spring({ frame: frame - 175, fps, config: { damping: 16, stiffness: 80 } });
  const introFadeOut = interpolate(frame, [160, 200], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const browserOpacity = interpolate(frame, [175, 210], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const browserScale = interpolate(browserEnter, [0, 1], [0.84, 0.92]);
  const browserY = interpolate(browserEnter, [0, 1], [70, -34]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.forest900 }}>
      {/* Cinematic Field Background */}
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <Img
          src={staticFile('hero-farmer.jpg')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center right',
            transform: `scale(${bgScale})`,
            filter: 'brightness(0.68)',
          }}
        />
        <AbsoluteFill
          style={{
            background:
              'linear-gradient(110deg, rgba(11, 46, 24, 0.92) 0%, rgba(20, 83, 45, 0.72) 55%, rgba(11, 46, 24, 0.52) 100%)',
          }}
        />
      </AbsoluteFill>

      {/* Part A: Hero Title & Crest Reveal */}
      {introFadeOut > 0.02 && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: introFadeOut,
            transform: `scale(${interpolate(logoSpring, [0, 1], [0.86, 1])})`,
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 1180, padding: '0 40px' }}>
            <div
              style={{
                width: 120,
                height: 120,
                margin: '0 auto 28px',
                borderRadius: 34,
                backgroundColor: COLORS.fresh500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 24px 60px rgba(34, 197, 94, 0.45)',
              }}
            >
              <Sprout size={64} color={COLORS.forest900} strokeWidth={2.5} />
            </div>
            <div
              style={{
                fontSize: 96,
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '0.06em',
                lineHeight: 1.05,
                textShadow: '0 10px 30px rgba(0,0,0,0.4)',
              }}
            >
              AGRICONNECT
            </div>
            <div
              style={{
                marginTop: 22,
                fontSize: 38,
                fontWeight: 600,
                color: '#DCFCE7',
                letterSpacing: '0.01em',
              }}
            >
              Connecting Farmers to Essential Agricultural Services
            </div>
            <div
              style={{
                marginTop: 28,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 26px',
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#FFFFFF',
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              Built by Team ANOKA · Hyperlocal Rural Service Network
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* Part B: Animated Real AgriConnect Homepage Inside BrowserFrame */}
      {browserOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: browserOpacity,
          }}
        >
          <BrowserFrame scale={browserScale} translateY={browserY}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Real Hero Replica */}
              <div
                style={{
                  position: 'relative',
                  height: 495,
                  backgroundColor: COLORS.forest700,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 64px',
                }}
              >
                <Img
                  src={staticFile('hero-farmer.jpg')}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'right center',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(90deg, rgba(20, 83, 45, 0.96) 0%, rgba(20, 83, 45, 0.82) 55%, rgba(20, 83, 45, 0.25) 100%)',
                  }}
                />
                <div style={{ position: 'relative', zIndex: 2, maxWidth: 820, color: '#FFFFFF' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 18px',
                      borderRadius: 999,
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.28)',
                      fontSize: 15,
                      fontWeight: 700,
                      marginBottom: 22,
                    }}
                  >
                    <Compass size={16} color={COLORS.fresh500} />
                    AgriConnect • Hyperlocal Rural Service Network
                  </div>
                  <div style={{ fontSize: 54, fontWeight: 900, lineHeight: 1.12, marginBottom: 16 }}>
                    Empowering Farmers. Connecting Resources.
                  </div>
                  <div style={{ fontSize: 21, color: '#DCFCE7', lineHeight: 1.45, marginBottom: 28 }}>
                    Discover agricultural machinery, skilled labour, and post-harvest facilities available near your farm.
                  </div>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <div
                      style={{
                        padding: '14px 24px',
                        borderRadius: 14,
                        backgroundColor: COLORS.fresh500,
                        color: COLORS.forest900,
                        fontWeight: 800,
                        fontSize: 17,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Tractor size={18} /> Find Equipment
                    </div>
                    <div
                      style={{
                        padding: '14px 24px',
                        borderRadius: 14,
                        backgroundColor: '#FFFFFF',
                        color: COLORS.forest800,
                        fontWeight: 800,
                        fontSize: 17,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Users size={18} /> Find Labour
                    </div>
                    <div
                      style={{
                        padding: '14px 24px',
                        borderRadius: 14,
                        backgroundColor: 'rgba(255,255,255,0.16)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: 17,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Warehouse size={18} /> Explore Facilities
                    </div>
                    <div
                      style={{
                        padding: '14px 24px',
                        borderRadius: 14,
                        border: `1.5px solid ${COLORS.fresh500}`,
                        color: '#DCFCE7',
                        fontWeight: 700,
                        fontSize: 17,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      Join AgriConnect <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Statistics Strip */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 20,
                  padding: '0 64px',
                  marginTop: -36,
                  position: 'relative',
                  zIndex: 5,
                }}
              >
                {[
                  { label: 'Machinery Rental', val: 'Tractors & Harvesters' },
                  { label: 'Skilled Farm Crews', val: 'Verified Teams' },
                  { label: 'Post-Harvest Units', val: 'Cold Storage & Mills' },
                  { label: 'Hyperlocal Search', val: '5–25 km Radius' },
                ].map((stat, idx) => {
                  const cardS = spring({
                    frame: frame - (220 + idx * 10),
                    fps,
                    config: { damping: 14 },
                  });
                  return (
                    <div
                      key={stat.label}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 18,
                        border: `1.5px solid ${COLORS.earth200}`,
                        padding: '20px 24px',
                        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
                        transform: `translateY(${interpolate(cardS, [0, 1], [30, 0])}px)`,
                        opacity: cardS,
                      }}
                    >
                      <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.forest700 }}>
                        {stat.val}
                      </div>
                      <div style={{ fontSize: 15, color: COLORS.slate600, marginTop: 4, fontWeight: 600 }}>
                        {stat.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </BrowserFrame>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
