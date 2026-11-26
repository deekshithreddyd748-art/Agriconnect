import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MapPin, Tractor, Users, Warehouse, Check, Bell, Calendar } from 'lucide-react';
import { BrowserFrame, COLORS } from '../components/BrowserFrame';

const PINS = [
  { x: 560, y: 210, label: 'Tractor · 4.2 km', color: '#14532D', icon: Tractor },
  { x: 740, y: 310, label: 'Harvest Crew · 6.8 km', color: '#D97706', icon: Users },
  { x: 430, y: 365, label: 'Cold Storage · 8.5 km', color: '#0369A1', icon: Warehouse },
];

export const Scene6NearbyMapAndBooking = () => {
  const frame = useCurrentFrame(); // 0..810 (27s)
  const { fps } = useVideoConfig();

  const radiusPulse = interpolate(frame % 60, [0, 60], [0.85, 1.15]);
  const isAccepted = frame >= 520;
  const bookingCardEnter = spring({ frame: frame - 350, fps, config: { damping: 16 } });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #F8FAF5 0%, #E0F2FE 40%, #DCFCE7 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 26,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 26px',
          borderRadius: 999,
          backgroundColor: COLORS.forest900,
          color: '#FFFFFF',
          fontSize: 20,
          fontWeight: 800,
          zIndex: 20,
        }}
      >
        Discover Nearby. Connect Easily.
      </div>

      <BrowserFrame
        url="agriconnect-emn4ha8ec-deekshithreddyd748-6042.vercel.app/nearby-map"
        activeNav="Nearby Map"
        userBadge="Ramesh · Farmer"
        translateY={6}
      >
        <div style={{ height: '100%', padding: '26px 46px', display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 26 }}>
          {/* Left: Interactive Nearby Map Visualization */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              border: `2px solid ${COLORS.earth200}`,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: COLORS.forest900, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={22} color={COLORS.forest700} /> Nearby Services Map
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['All', 'Equipment', 'Labour', 'Facilities'].map((tab, i) => (
                  <div
                    key={tab}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 10,
                      backgroundColor: i === 0 ? COLORS.forest700 : COLORS.earth100,
                      color: i === 0 ? '#FFFFFF' : COLORS.slate600,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {tab}
                  </div>
                ))}
              </div>
            </div>

            {/* Clean Vector Leaflet Map Replica */}
            <div
              style={{
                flex: 1,
                borderRadius: 18,
                backgroundColor: '#E6F0EC',
                border: '1px solid #CBD5E1',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Subtle Map Roads/Grid */}
              <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                <path d="M0 140 Q 400 180 900 110" stroke="#FFFFFF" strokeWidth="10" fill="none" />
                <path d="M120 0 Q 260 280 540 580" stroke="#FFFFFF" strokeWidth="8" fill="none" />
                <path d="M620 0 L 580 600" stroke="#FFFFFF" strokeWidth="6" fill="none" />
                <path d="M0 390 L 900 420" stroke="#CBD5E1" strokeWidth="4" strokeDasharray="8 6" fill="none" />
              </svg>

              {/* 15 km Radius Discovery Ring */}
              <div
                style={{
                  position: 'absolute',
                  left: 340,
                  top: 85,
                  width: 390,
                  height: 390,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(34, 197, 94, 0.12)',
                  border: '2.5px dashed #16A34A',
                  transform: `scale(${radiusPulse})`,
                }}
              />

              {/* Farmer Location Pin */}
              <div
                style={{
                  position: 'absolute',
                  left: 515,
                  top: 265,
                  padding: '6px 12px',
                  borderRadius: 999,
                  backgroundColor: COLORS.forest900,
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 800,
                  boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
                }}
              >
                Your Farm GPS (15 km)
              </div>

              {/* Service Pins */}
              {PINS.map((pin, idx) => {
                const Icon = pin.icon;
                const pop = spring({ frame: frame - (40 + idx * 25), fps, config: { damping: 12 } });
                return (
                  <div
                    key={pin.label}
                    style={{
                      position: 'absolute',
                      left: pin.x - 160,
                      top: pin.y - 40,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 14px',
                      borderRadius: 14,
                      backgroundColor: '#FFFFFF',
                      border: `2px solid ${pin.color}`,
                      boxShadow: '0 8px 20px rgba(0,0,0,0.14)',
                      transform: `scale(${pop})`,
                      opacity: pop,
                    }}
                  >
                    <Icon size={16} color={pin.color} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.slate900 }}>{pin.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Booking Request Status Workflow */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              border: `2px solid ${COLORS.earth200}`,
              padding: 26,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              opacity: bookingCardEnter,
              transform: `translateY(${interpolate(bookingCardEnter, [0, 1], [30, 0])}px)`,
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: COLORS.forest900 }}>
                  Booking Workflow
                </div>
                <span
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    backgroundColor: isAccepted ? '#DCFCE7' : '#FEF3C7',
                    color: isAccepted ? '#166534' : '#92400E',
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  {isAccepted ? 'Accepted' : 'Pending'}
                </span>
              </div>

              <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.slate900 }}>
                Mahindra Arjun Novo 605 DI Tractor
              </div>
              <div style={{ fontSize: 14, color: COLORS.slate600, display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <Calendar size={15} color={COLORS.forest700} /> 4 Hours · Estimated Total: Rs 3,000
              </div>

              <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: COLORS.earth50,
                    border: `1px solid ${COLORS.earth200}`,
                    fontSize: 14,
                    fontWeight: 700,
                    color: COLORS.slate900,
                  }}
                >
                  1. Farmer submits booking request
                </div>
                <div
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: isAccepted ? COLORS.forest50 : COLORS.earth50,
                    border: isAccepted ? '1.5px solid #4ADE80' : `1px solid ${COLORS.earth200}`,
                    fontSize: 14,
                    fontWeight: 700,
                    color: isAccepted ? COLORS.forest900 : COLORS.slate600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Check size={16} color={isAccepted ? COLORS.fresh600 : '#94A3B8'} />
                  2. Provider accepts booking request
                </div>
                <div
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: isAccepted ? '#F0FDF4' : COLORS.earth50,
                    border: isAccepted ? '1.5px solid #86EFAC' : `1px solid ${COLORS.earth200}`,
                    fontSize: 14,
                    fontWeight: 700,
                    color: isAccepted ? COLORS.forest800 : COLORS.slate600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Bell size={16} color={isAccepted ? COLORS.forest700 : '#94A3B8'} />
                  3. Real-time notification stored in database
                </div>
              </div>
            </div>

            <div
              style={{
                height: 52,
                borderRadius: 14,
                backgroundColor: isAccepted ? '#166534' : COLORS.forest700,
                color: '#FFFFFF',
                fontSize: 17,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Check size={19} /> {isAccepted ? 'Booking Confirmed' : 'Provider: Accept Booking'}
            </div>
          </div>
        </div>
      </BrowserFrame>
    </AbsoluteFill>
  );
};
