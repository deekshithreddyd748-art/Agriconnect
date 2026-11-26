import React from 'react';
import { Sprout, Lock, Globe } from 'lucide-react';

export const COLORS = {
  forest900: '#0B2E18',
  forest800: '#114424',
  forest700: '#14532D',
  forest50: '#F0FDF4',
  fresh500: '#22C55E',
  fresh600: '#16A34A',
  earth50: '#F8FAF5',
  earth100: '#EFF3EA',
  earth200: '#DCE3D5',
  harvest600: '#D97706',
  harvest100: '#FEF3C7',
  slate900: '#0F172A',
  slate600: '#475569',
};

export const BrowserFrame = ({
  url = 'agriconnect-emn4ha8ec-deekshithreddyd748-6042.vercel.app',
  activeNav = '',
  userBadge = null,
  scale = 0.92,
  opacity = 1,
  translateY = -36,
  children,
}) => {
  return (
    <div
      style={{
        width: 1580,
        height: 850,
        borderRadius: 28,
        backgroundColor: '#FFFFFF',
        border: `2px solid ${COLORS.earth200}`,
        boxShadow: '0 32px 80px rgba(11, 46, 24, 0.25)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transform: `translateY(${translateY}px) scale(${scale})`,
        opacity,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Top Browser Chrome */}
      <div
        style={{
          height: 52,
          backgroundColor: '#F1F5F9',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 16,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ width: 13, height: 13, borderRadius: '50%', backgroundColor: '#F87171' }} />
          <div style={{ width: 13, height: 13, borderRadius: '50%', backgroundColor: '#FBBF24' }} />
          <div style={{ width: 13, height: 13, borderRadius: '50%', backgroundColor: '#34D399' }} />
        </div>
        <div
          style={{
            flex: 1,
            maxWidth: 780,
            margin: '0 auto',
            height: 32,
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 15,
            color: '#475569',
            fontWeight: 600,
          }}
        >
          <Lock size={14} color={COLORS.forest700} />
          <span>https://{url}</span>
        </div>
      </div>

      {/* Actual AgriConnect Navbar Replica */}
      <div
        style={{
          height: 68,
          backgroundColor: '#FFFFFF',
          borderBottom: `1px solid ${COLORS.earth200}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 36px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: COLORS.forest700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sprout size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: COLORS.forest800, lineHeight: 1.1 }}>
              AgriConnect
            </div>
            <div style={{ fontSize: 11, color: COLORS.fresh600, fontWeight: 600 }}>
              Empowering Farmers. Connecting Resources.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {['Machinery', 'Labour', 'Facilities', 'Nearby Map', 'How It Works'].map((item) => {
            const active = activeNav === item;
            return (
              <div
                key={item}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: active ? 700 : 500,
                  backgroundColor: active ? COLORS.forest50 : 'transparent',
                  color: active ? COLORS.forest700 : COLORS.slate600,
                }}
              >
                {item}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: `1px solid ${COLORS.earth200}`,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.slate900,
            }}
          >
            <Globe size={15} color={COLORS.forest700} />
            English · ಕ · हि
          </div>
          {userBadge ? (
            <div
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                backgroundColor: COLORS.forest50,
                color: COLORS.forest700,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {userBadge}
            </div>
          ) : (
            <div
              style={{
                padding: '9px 18px',
                borderRadius: 10,
                backgroundColor: COLORS.forest700,
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Start / Continue
            </div>
          )}
        </div>
      </div>

      {/* Screen Content */}
      <div
        style={{
          flex: 1,
          backgroundColor: COLORS.earth50,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
};
