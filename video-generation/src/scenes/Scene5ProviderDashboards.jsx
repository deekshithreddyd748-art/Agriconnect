import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Tractor, Users, Warehouse, CheckCircle2, PlusCircle, ToggleRight, Bell } from 'lucide-react';
import { BrowserFrame, COLORS } from '../components/BrowserFrame';

const PROVIDERS = [
  {
    role: 'EQUIPMENT OWNER DASHBOARD',
    user: 'Suresh Patil · Equipment Owner',
    icon: Tractor,
    accent: '#14532D',
    badgeBg: '#DCFCE7',
    stats: [
      { label: 'Active Listings', val: '4' },
      { label: 'Pending Requests', val: '2' },
      { label: 'Accepted Bookings', val: '6' },
      { label: 'Completed Jobs', val: '14' },
    ],
    items: [
      { name: 'Mahindra Arjun Novo 605 DI Tractor', meta: 'Tractors · Rs 750 / hour', status: 'Available' },
      { name: 'Shaktiman 7-Feet Heavy Rotavator', meta: 'Rotavators · Rs 1,100 / acre', status: 'Available' },
      { name: 'Tractor-Mounted Boom Sprayer (400L)', meta: 'Sprayers · Rs 500 / acre', status: 'Maintenance' },
    ],
  },
  {
    role: 'LABOUR PROVIDER DASHBOARD',
    user: 'Mahesh Deshmukh · Labour Provider',
    icon: Users,
    accent: '#B45309',
    badgeBg: '#FEF3C7',
    stats: [
      { label: 'Workers Available', val: '8' },
      { label: 'Open Requests', val: '3' },
      { label: 'Accepted Work', val: '5' },
      { label: 'Completed Work', val: '19' },
    ],
    items: [
      { name: 'Sahyadri Harvest & Sowing Crew', meta: 'Skills: Harvesting, Sowing, Weeding · Rs 450/day', status: 'Available' },
      { name: 'Open Farmer Request: Wheat Harvesting', meta: 'Pandare · 6 Workers · 3 Days · Rs 500/day', status: 'Open Request' },
    ],
  },
  {
    role: 'FACILITY OWNER DASHBOARD',
    user: 'Vikram Kulkarni · Facility Owner',
    icon: Warehouse,
    accent: '#0369A1',
    badgeBg: '#E0F2FE',
    stats: [
      { label: 'Facility Listings', val: '2' },
      { label: 'Free Capacity', val: '320t' },
      { label: 'Pending Requests', val: '1' },
      { label: 'Completed Storage', val: '11' },
    ],
    items: [
      { name: 'Baramati Multi-Chamber Cold Storage', meta: 'Cold Storage · 320 / 500 tonnes free · Rs 35/tonne/day', status: 'Available' },
      { name: 'Graded Grain & Pulse Warehouse', meta: 'Warehouses · Dry Storage + Sorting', status: 'Available' },
    ],
  },
];

export const Scene5ProviderDashboards = () => {
  const frame = useCurrentFrame(); // 0..900 (30s = 10s per provider)
  const { fps } = useVideoConfig();

  const tabIdx = frame < 300 ? 0 : frame < 600 ? 1 : 2;
  const localFrame = frame % 300;
  const slideIn = spring({ frame: localFrame, fps, config: { damping: 16, stiffness: 90 } });
  const current = PROVIDERS[tabIdx];
  const Icon = current.icon;

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #EFF3EA 0%, #FFFFFF 50%, #DCFCE7 100%)',
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
        Empowering Every Agricultural Service Provider
      </div>

      <BrowserFrame
        url="agriconnect-emn4ha8ec-deekshithreddyd748-6042.vercel.app/provider/dashboard"
        userBadge={current.user}
        translateY={6}
      >
        <div
          style={{
            height: '100%',
            padding: '30px 52px',
            transform: `translateY(${interpolate(slideIn, [0, 1], [35, 0])}px)`,
            opacity: slideIn,
          }}
        >
          {/* Role Selector Pills */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  backgroundColor: current.badgeBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={32} color={current.accent} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: current.accent, letterSpacing: '0.08em' }}>
                  {current.role}
                </div>
                <div style={{ fontSize: 30, fontWeight: 900, color: COLORS.forest900 }}>
                  {current.user.split(' · ')[0]}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div
                style={{
                  padding: '12px 20px',
                  borderRadius: 14,
                  backgroundColor: COLORS.forest700,
                  color: '#FFFFFF',
                  fontSize: 15,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <PlusCircle size={18} /> Add New Listing
              </div>
              <div
                style={{
                  padding: '12px 18px',
                  borderRadius: 14,
                  backgroundColor: COLORS.forest50,
                  color: COLORS.forest800,
                  fontSize: 15,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <ToggleRight size={18} /> Availability
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 26 }}>
            {current.stats.map((st, idx) => {
              const pop = spring({ frame: localFrame - (12 + idx * 8), fps, config: { damping: 14 } });
              return (
                <div
                  key={st.label}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    border: `1.5px solid ${COLORS.earth200}`,
                    padding: '22px 24px',
                    transform: `scale(${interpolate(pop, [0, 1], [0.92, 1])})`,
                    opacity: pop,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.slate600, textTransform: 'uppercase' }}>
                    {st.label}
                  </div>
                  <div style={{ fontSize: 38, fontWeight: 900, color: COLORS.forest900, marginTop: 8 }}>
                    {st.val}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Listings + Notifications Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 22 }}>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 22,
                border: `1.5px solid ${COLORS.earth200}`,
                padding: 24,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.slate900, marginBottom: 16 }}>
                Active Service Management
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {current.items.map((item) => (
                  <div
                    key={item.name}
                    style={{
                      padding: 18,
                      borderRadius: 16,
                      border: `1px solid ${COLORS.earth200}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.slate900 }}>{item.name}</div>
                      <div style={{ fontSize: 14, color: COLORS.slate600, marginTop: 4 }}>{item.meta}</div>
                    </div>
                    <span
                      style={{
                        padding: '6px 14px',
                        borderRadius: 999,
                        backgroundColor: item.status === 'Maintenance' ? '#F1F5F9' : '#DCFCE7',
                        color: item.status === 'Maintenance' ? '#475569' : '#166534',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 22,
                border: `1.5px solid ${COLORS.earth200}`,
                padding: 24,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.slate900, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={20} color={COLORS.forest700} /> Recent Activity
              </div>
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  backgroundColor: COLORS.forest50,
                  border: '1px solid #BBF7D0',
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.forest900 }}>New Booking Request</div>
                <div style={{ fontSize: 13, color: COLORS.slate600, marginTop: 4 }}>
                  Ramesh Gowda requested your service for tomorrow.
                </div>
              </div>
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  border: `1px solid ${COLORS.earth200}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  color: COLORS.forest800,
                }}
              >
                <CheckCircle2 size={18} color={COLORS.fresh600} />
                Ready to accept bookings directly
              </div>
            </div>
          </div>
        </div>
      </BrowserFrame>
    </AbsoluteFill>
  );
};
