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
import {
  Users,
  Tractor,
  Warehouse,
  MapPin,
  Bell,
  Search,
  Heart,
  CalendarCheck,
  CheckCircle2,
  ArrowLeft,
  Home,
} from 'lucide-react';
import { BrowserFrame, COLORS } from '../components/BrowserFrame';

export const Scene4FarmerDashboard = () => {
  const frame = useCurrentFrame(); // 0..900 (30s)
  const { fps } = useVideoConfig();

  // 0..380: Actual FarmerDashboard Overview
  // 380..900: Machinery/Labour/Facility Discovery with Search, Save Favourite & Booking submission
  const enter = spring({ frame, fps, config: { damping: 16 } });
  const subSlide = spring({ frame: frame - 380, fps, config: { damping: 16, stiffness: 85 } });
  const searchTyped = 'Mahindra Tractor'.slice(
    0,
    Math.floor(interpolate(frame, [420, 495], [0, 16], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  );
  const favSaved = frame >= 530;
  const bookingSent = frame >= 690;

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #F8FAF5 0%, #DCFCE7 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Floating Header Tagline */}
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
          letterSpacing: '0.03em',
          boxShadow: '0 8px 20px rgba(11, 46, 24, 0.25)',
          zIndex: 20,
        }}
      >
        One Platform. Multiple Agricultural Services.
      </div>

      <BrowserFrame
        url={
          frame < 380
            ? 'agriconnect-emn4ha8ec-deekshithreddyd748-6042.vercel.app/farmer/dashboard'
            : 'agriconnect-emn4ha8ec-deekshithreddyd748-6042.vercel.app/machinery'
        }
        activeNav={frame >= 380 ? 'Machinery' : ''}
        userBadge="Ramesh · Farmer"
        scale={interpolate(enter, [0, 1], [0.94, 1])}
        translateY={6}
      >
        <div style={{ height: '100%', padding: '26px 46px', position: 'relative' }}>
          {/* View 1: Actual Farmer Dashboard */}
          {frame < 410 && (
            <div style={{ opacity: interpolate(subSlide, [0, 0.6], [1, 0]) }}>
              {/* Back / Home Strip */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div
                  style={{
                    padding: '8px 16px',
                    borderRadius: 12,
                    border: `1px solid ${COLORS.earth200}`,
                    backgroundColor: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ArrowLeft size={15} /> Back
                </div>
                <div
                  style={{
                    padding: '8px 16px',
                    borderRadius: 12,
                    border: `1px solid ${COLORS.earth200}`,
                    backgroundColor: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Home size={15} color={COLORS.forest700} /> Home
                </div>
              </div>

              {/* Farmer Welcome Card */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 24,
                  border: `1.5px solid ${COLORS.earth200}`,
                  padding: '20px 28px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 22,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <Img
                    src={staticFile('hero-farmer.jpg')}
                    style={{
                      width: 66,
                      height: 66,
                      borderRadius: 16,
                      objectFit: 'cover',
                      border: '2px solid #86EFAC',
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: COLORS.forest900 }}>
                      Welcome, Ramesh Gowda
                    </div>
                    <div style={{ fontSize: 15, color: COLORS.slate600, display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <MapPin size={15} color={COLORS.forest700} /> Mandya, Karnataka · Sugarcane
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div
                    style={{
                      padding: '10px 18px',
                      borderRadius: 14,
                      backgroundColor: COLORS.earth50,
                      border: `1px solid ${COLORS.earth200}`,
                      fontSize: 14,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Bell size={16} color={COLORS.forest700} /> Notifications (2)
                  </div>
                </div>
              </div>

              {/* Action Grid + KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 2fr', gap: 22, marginBottom: 22 }}>
                <div
                  style={{
                    backgroundColor: COLORS.forest700,
                    color: '#FFFFFF',
                    borderRadius: 24,
                    padding: 28,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 16,
                      backgroundColor: COLORS.fresh500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Users size={28} color={COLORS.forest900} />
                  </div>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 800 }}>Request Labour</div>
                    <div style={{ fontSize: 15, color: '#DCFCE7', marginTop: 6 }}>
                      Post worker needs & track real-time confirmations
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  {[
                    { title: 'Machinery Rentals', icon: Tractor, count: 'Tractors & Harvesters', bg: '#F0FDF4', color: '#14532D' },
                    { title: 'Nearby Workers', icon: Users, count: 'Skilled Labour Teams', bg: '#FEF3C7', color: '#B45309' },
                    { title: 'Post-Harvest Facilities', icon: Warehouse, count: 'Cold Storage & Dryers', bg: '#E0F2FE', color: '#0369A1' },
                    { title: 'Saved & Bookings', icon: CalendarCheck, count: 'Track Status & Reviews', bg: '#DCFCE7', color: '#15803D' },
                  ].map((c, idx) => {
                    const Icon = c.icon;
                    const pop = spring({ frame: frame - (40 + idx * 14), fps, config: { damping: 14 } });
                    return (
                      <div
                        key={c.title}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: 20,
                          border: `1.5px solid ${COLORS.earth200}`,
                          padding: 20,
                          transform: `scale(${interpolate(pop, [0, 1], [0.92, 1])})`,
                          opacity: pop,
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            backgroundColor: c.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 12,
                          }}
                        >
                          <Icon size={22} color={c.color} />
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.slate900 }}>
                          {c.title}
                        </div>
                        <div style={{ fontSize: 14, color: COLORS.slate600, marginTop: 4 }}>{c.count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* View 2: Machinery Search + Save + Booking Submission */}
          {frame >= 380 && (
            <div style={{ opacity: subSlide }}>
              {/* Search Bar & Category Pills */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 18,
                  border: `1.5px solid ${COLORS.earth200}`,
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  marginBottom: 22,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 12,
                    border: `2px solid ${COLORS.forest700}`,
                    padding: '0 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 16,
                    fontWeight: 700,
                    color: COLORS.slate900,
                  }}
                >
                  <Search size={18} color={COLORS.forest700} />
                  <span>{searchTyped || 'Search machinery, location...'}</span>
                </div>
                {['All Categories', 'Tractors', 'Harvesters', 'Within 15 km'].map((pill, i) => (
                  <div
                    key={pill}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 12,
                      backgroundColor: i === 1 ? COLORS.forest700 : COLORS.earth100,
                      color: i === 1 ? '#FFFFFF' : COLORS.slate900,
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {pill}
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 26 }}>
                {/* Left Service Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {[
                    {
                      title: 'Mahindra Arjun Novo 605 DI Tractor',
                      cat: 'Tractors',
                      img: 'machinery-tractor.jpg',
                      loc: 'Malegaon Bk · 4.2 km',
                      rate: 'Rs 750 / hour',
                      highlight: true,
                    },
                    {
                      title: 'Multi-Chamber Cold Storage',
                      cat: 'Cold Storage',
                      img: 'storage-warehouse.jpg',
                      loc: 'Baramati MIDC · 8.5 km',
                      rate: 'Rs 35 / tonne / day',
                      highlight: false,
                    },
                  ].map((card) => (
                    <div
                      key={card.title}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 22,
                        border: card.highlight ? `2.5px solid ${COLORS.forest700}` : `1.5px solid ${COLORS.earth200}`,
                        overflow: 'hidden',
                        boxShadow: '0 14px 32px rgba(15, 23, 42, 0.07)',
                      }}
                    >
                      <Img
                        src={staticFile(card.img)}
                        style={{ width: '100%', height: 220, objectFit: 'cover' }}
                      />
                      <div style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: COLORS.fresh600, textTransform: 'uppercase' }}>
                            {card.cat}
                          </span>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: 999,
                              backgroundColor: '#DCFCE7',
                              color: '#166534',
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Available
                          </span>
                        </div>
                        <div style={{ fontSize: 19, fontWeight: 800, color: COLORS.slate900, marginTop: 8 }}>
                          {card.title}
                        </div>
                        <div style={{ fontSize: 14, color: COLORS.forest700, fontWeight: 600, marginTop: 8 }}>
                          {card.loc}
                        </div>
                        <div
                          style={{
                            marginTop: 16,
                            paddingTop: 14,
                            borderTop: `1px solid ${COLORS.earth200}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{ fontSize: 18, fontWeight: 900, color: COLORS.forest900 }}>{card.rate}</span>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <div
                              style={{
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: '1px solid #FECDD3',
                                backgroundColor: card.highlight && favSaved ? '#FFF1F2' : '#FFFFFF',
                                color: '#BE123C',
                                fontSize: 13,
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                              }}
                            >
                              <Heart size={14} fill={card.highlight && favSaved ? '#F43F5E' : 'none'} />
                              {card.highlight && favSaved ? 'Saved' : 'Save'}
                            </div>
                            <div
                              style={{
                                padding: '8px 14px',
                                borderRadius: 10,
                                backgroundColor: COLORS.forest700,
                                color: '#FFFFFF',
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              Book Now
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Booking Panel */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 24,
                    border: `2px solid ${COLORS.earth200}`,
                    padding: 28,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 16px 38px rgba(15, 23, 42, 0.08)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: COLORS.forest900, marginBottom: 16 }}>
                      Submit Service Booking Request
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                      <div style={{ padding: 12, borderRadius: 12, backgroundColor: COLORS.earth50, border: `1px solid ${COLORS.earth200}` }}>
                        <div style={{ fontSize: 12, color: COLORS.slate600 }}>Service Date</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.slate900 }}>Tomorrow · 8:00 AM</div>
                      </div>
                      <div style={{ padding: 12, borderRadius: 12, backgroundColor: COLORS.earth50, border: `1px solid ${COLORS.earth200}` }}>
                        <div style={{ fontSize: 12, color: COLORS.slate600 }}>Duration</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.slate900 }}>4 Hours</div>
                      </div>
                    </div>
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 16,
                        backgroundColor: COLORS.forest50,
                        border: '1px solid #BBF7D0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.forest800 }}>Estimated Total</span>
                      <span style={{ fontSize: 26, fontWeight: 900, color: COLORS.forest900 }}>₹3,000</span>
                    </div>
                  </div>

                  {bookingSent ? (
                    <div
                      style={{
                        marginTop: 22,
                        padding: 18,
                        borderRadius: 16,
                        backgroundColor: '#ECFDF5',
                        border: '2px solid #34D399',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        fontSize: 17,
                        fontWeight: 800,
                        color: '#065F46',
                      }}
                    >
                      <CheckCircle2 size={24} color="#059669" />
                      Your booking request has been sent (Pending Provider Confirmation)
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: 22,
                        height: 54,
                        borderRadius: 14,
                        backgroundColor: COLORS.forest700,
                        color: '#FFFFFF',
                        fontSize: 18,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      Submit Booking Request
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </BrowserFrame>
    </AbsoluteFill>
  );
};
