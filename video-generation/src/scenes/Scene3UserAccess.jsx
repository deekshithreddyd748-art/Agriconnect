import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  Sprout,
  User,
  Phone,
  Mail,
  ArrowRight,
  Volume2,
  Tractor,
  Users,
  Warehouse,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { BrowserFrame, COLORS } from '../components/BrowserFrame';

const ROLES = [
  {
    id: 'farmer',
    emoji: '🌾',
    title: 'Farmer',
    desc: 'Hire equipment, hire labour, and store produce',
    icon: Sprout,
    bg: '#F0FDF4',
    color: '#14532D',
  },
  {
    id: 'equipment_owner',
    emoji: '🚜',
    title: 'Equipment Owner',
    desc: 'List tractors, harvesters, and implements for rent',
    icon: Tractor,
    bg: '#ECFDF5',
    color: '#047857',
  },
  {
    id: 'labour_provider',
    emoji: '👨‍🌾',
    title: 'Labour Provider',
    desc: 'Offer skilled or general farm labour services',
    icon: Users,
    bg: '#FEF3C7',
    color: '#B45309',
  },
  {
    id: 'facility_operator',
    emoji: '🏢',
    title: 'Facility Owner',
    desc: 'List storage, cold storage, and processing facilities',
    icon: Warehouse,
    bg: '#E0F2FE',
    color: '#0369A1',
  },
];

export const Scene3UserAccess = () => {
  const frame = useCurrentFrame(); // 0..600 (20s)
  const { fps } = useVideoConfig();

  // Frames 0..270: Profile Identification Card (/login without OTP or password!)
  // Frames 270..600: Role Selection Card (/select-role showing 4 roles)
  const enter = spring({ frame, fps, config: { damping: 16 } });
  const rolePhaseProgress = spring({ frame: frame - 270, fps, config: { damping: 16, stiffness: 85 } });

  const fullNameText = 'Ramesh Gowda';
  const mobileText = '9876543210';
  const typedNameLen = Math.floor(interpolate(frame, [30, 105], [0, fullNameText.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const typedMobileLen = Math.floor(interpolate(frame, [115, 190], [0, mobileText.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const btnClicked = frame >= 220 && frame <= 265;

  const activeRoleIndex = frame < 370 ? 0 : frame < 440 ? 1 : frame < 510 ? 2 : frame < 560 ? 3 : 0;

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #EFF3EA 0%, #F8FAF5 50%, #DCFCE7 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <BrowserFrame
        url={
          frame < 270
            ? 'agriconnect-emn4ha8ec-deekshithreddyd748-6042.vercel.app/login'
            : 'agriconnect-emn4ha8ec-deekshithreddyd748-6042.vercel.app/select-role'
        }
        scale={interpolate(enter, [0, 1], [0.92, 1])}
        translateY={-18}
      >
        <div
          style={{
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* Left Screen: Profile Entry Card */}
          <div
            style={{
              position: 'absolute',
              width: 660,
              backgroundColor: '#FFFFFF',
              borderRadius: 28,
              border: `2px solid ${COLORS.earth200}`,
              padding: '36px 42px',
              boxShadow: '0 24px 50px rgba(15, 23, 42, 0.08)',
              transform: `translateX(${interpolate(rolePhaseProgress, [0, 1], [0, -1400])}px)`,
              opacity: interpolate(rolePhaseProgress, [0, 0.7], [1, 0]),
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: 12,
                  border: `1px solid ${COLORS.earth200}`,
                  fontSize: 13,
                  fontWeight: 700,
                  color: COLORS.slate600,
                }}
              >
                ← Back to Home
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    backgroundColor: COLORS.forest50,
                    border: '1px solid #86EFAC',
                    color: COLORS.forest800,
                    fontSize: 13,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Volume2 size={15} /> Voice Readout
                </div>
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    border: `1px solid ${COLORS.earth200}`,
                    fontSize: 13,
                    fontWeight: 700,
                    color: COLORS.slate900,
                  }}
                >
                  EN | ಕನ್ನಡ | हिन्दी
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.forest900 }}>
                Enter your name and mobile number to continue
              </div>
              <div style={{ fontSize: 14, color: COLORS.slate600, marginTop: 6 }}>
                No password or OTP required. Returning mobile numbers open your existing profile.
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 14,
                backgroundColor: COLORS.forest50,
                border: '1px solid #BBF7D0',
                fontSize: 13,
                color: COLORS.forest900,
                marginBottom: 18,
                fontWeight: 600,
              }}
            >
              <Info size={16} color={COLORS.forest700} />
              Quick mobile profile identification — simple access for rural farmers.
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.slate900, marginBottom: 6 }}>
                Full Name *
              </div>
              <div
                style={{
                  height: 50,
                  borderRadius: 14,
                  border: `2px solid ${typedNameLen > 0 ? COLORS.forest700 : COLORS.earth200}`,
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 18,
                  fontWeight: 600,
                  color: COLORS.slate900,
                }}
              >
                <User size={18} color="#94A3B8" />
                <span>{fullNameText.slice(0, typedNameLen)}</span>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.slate900, marginBottom: 6 }}>
                Mobile Number *
              </div>
              <div style={{ display: 'flex', height: 50 }}>
                <div
                  style={{
                    padding: '0 16px',
                    borderRadius: '14px 0 0 14px',
                    backgroundColor: COLORS.earth100,
                    border: `2px solid ${COLORS.earth200}`,
                    borderRight: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 800,
                    color: COLORS.forest900,
                    fontSize: 16,
                  }}
                >
                  <Phone size={16} color={COLORS.forest700} /> +91
                </div>
                <div
                  style={{
                    flex: 1,
                    borderRadius: '0 14px 14px 0',
                    border: `2px solid ${typedMobileLen > 0 ? COLORS.forest700 : COLORS.earth200}`,
                    padding: '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: COLORS.slate900,
                  }}
                >
                  {mobileText.slice(0, typedMobileLen)}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.slate900, marginBottom: 6 }}>
                Email Address (Optional)
              </div>
              <div
                style={{
                  height: 48,
                  borderRadius: 14,
                  border: `1.5px solid ${COLORS.earth200}`,
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 15,
                  color: '#94A3B8',
                }}
              >
                <Mail size={17} />
                <span>Optional — e.g., name@example.com</span>
              </div>
            </div>

            <div
              style={{
                height: 54,
                borderRadius: 14,
                backgroundColor: btnClicked ? COLORS.forest900 : COLORS.forest700,
                transform: `scale(${btnClicked ? 0.97 : 1})`,
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              Continue <ArrowRight size={20} />
            </div>
          </div>

          {/* Right Screen: Role Selection (/select-role) */}
          <div
            style={{
              position: 'absolute',
              width: 1060,
              backgroundColor: '#FFFFFF',
              borderRadius: 28,
              border: `2px solid ${COLORS.earth200}`,
              padding: '38px 46px',
              boxShadow: '0 24px 50px rgba(15, 23, 42, 0.08)',
              transform: `translateX(${interpolate(rolePhaseProgress, [0, 1], [1400, 0])}px)`,
              opacity: rolePhaseProgress,
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 26 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.forest700 }}>
                Namaste, Ramesh Gowda · +91 9876543210
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: COLORS.forest900, marginTop: 6 }}>
                Select Your Role on AgriConnect
              </div>
              <div style={{ fontSize: 17, color: COLORS.slate600, marginTop: 4 }}>
                Choose how you want to use AgriConnect on your dashboard.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 26 }}>
              {ROLES.map((r, idx) => {
                const Icon = r.icon;
                const active = activeRoleIndex === idx;
                return (
                  <div
                    key={r.id}
                    style={{
                      padding: 24,
                      borderRadius: 20,
                      border: active ? `3px solid ${COLORS.forest700}` : `2px solid ${COLORS.earth200}`,
                      backgroundColor: active ? COLORS.forest50 : '#FFFFFF',
                      boxShadow: active ? '0 10px 24px rgba(20, 83, 45, 0.14)' : 'none',
                      transform: `scale(${active ? 1.02 : 1})`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        backgroundColor: r.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={28} color={r.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: COLORS.forest900 }}>
                          {r.title}
                        </span>
                        {active && <CheckCircle2 size={24} color={COLORS.forest700} />}
                      </div>
                      <div style={{ fontSize: 15, color: COLORS.slate600, marginTop: 6, lineHeight: 1.4 }}>
                        {r.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                height: 54,
                borderRadius: 14,
                backgroundColor: COLORS.forest700,
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              Continue to Dashboard <ArrowRight size={20} />
            </div>
          </div>
        </div>
      </BrowserFrame>
    </AbsoluteFill>
  );
};
