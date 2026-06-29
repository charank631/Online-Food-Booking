import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { restaurantApi, menuApi } from '../services/api';
import { Restaurant } from '../types';
import { useAuth } from '../context/AuthContext';

const s: Record<string, React.CSSProperties> = {
  hero: {
    position: 'relative', minHeight: 520, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    padding: '80px 24px 60px',
    background: 'radial-gradient(ellipse at 50% 30%, rgba(255,107,53,0.12) 0%, transparent 60%)',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
    width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,107,53,0.08), transparent 70%)',
    pointerEvents: 'none',
  },
  h1: {
    fontSize: 56, fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px',
    marginBottom: 18, position: 'relative', zIndex: 1,
  },
  gradient: {
    background: 'linear-gradient(135deg, var(--primary), var(--secondary), #f72585)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: 18, color: 'var(--text-300)', maxWidth: 480, lineHeight: 1.6,
    marginBottom: 40, position: 'relative', zIndex: 1,
  },
  searchWrap: {
    position: 'relative', width: '100%', maxWidth: 540, zIndex: 1,
  },
  searchInput: {
    width: '100%', padding: '18px 24px 18px 52px',
    borderRadius: 'var(--radius-full)', fontSize: 15,
    background: 'var(--bg-800)', border: '1px solid var(--glass-border)',
    color: 'var(--text-100)', outline: 'none', transition: 'var(--transition)',
    boxShadow: 'var(--shadow-md)',
  },
  searchIcon: {
    position: 'absolute' as const, left: 20, top: '50%', transform: 'translateY(-50%)',
    fontSize: 18, color: 'var(--text-400)', pointerEvents: 'none' as const,
  },
  section: { maxWidth: 1200, margin: '0 auto', padding: '48px 24px 80px' },
  sectionTitle: {
    fontSize: 28, fontWeight: 800, marginBottom: 32, display: 'flex',
    alignItems: 'center', gap: 12,
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 24,
  },
  card: {
    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    background: 'var(--bg-800)', border: '1px solid var(--glass-border)',
    transition: 'var(--transition)', cursor: 'pointer',
    display: 'flex', flexDirection: 'column' as const,
  },
  cardImg: {
    width: '100%', height: 200, objectFit: 'cover' as const,
    transition: 'transform 0.5s ease',
  },
  cardImgPlaceholder: {
    width: '100%', height: 200, display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'var(--bg-700)', fontSize: 48,
  },
  cardBody: { padding: '20px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column' as const },
  cardName: { fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--text-100)' },
  tag: {
    display: 'inline-flex', padding: '4px 12px', borderRadius: 'var(--radius-full)',
    background: 'var(--primary-light)', color: 'var(--primary)',
    fontSize: 12, fontWeight: 700, letterSpacing: '0.3px',
  },
  ratingBadge: {
    position: 'absolute' as const, top: 14, right: 14,
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 'var(--radius-full)', padding: '5px 12px',
    color: '#fff', fontWeight: 700, fontSize: 13,
  },
  cardMeta: {
    display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-400)',
    marginTop: 'auto' as const, paddingTop: 12,
    borderTop: '1px solid var(--border)',
  },
  skeleton: {
    borderRadius: 'var(--radius-lg)', height: 320,
    background: 'var(--bg-800)', border: '1px solid var(--glass-border)',
  },
  empty: {
    gridColumn: '1 / -1', textAlign: 'center' as const,
    padding: '60px 0', color: 'var(--text-400)', fontSize: 16,
  },
  stats: {
    display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginBottom: 32,
  },
  statPill: {
    background: 'var(--bg-800)', border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-full)', padding: '10px 24px',
    fontSize: 14, color: 'var(--text-300)', fontWeight: 600,
  },
  // Superadmin monitor card (non-clickable)
  monitorBadge: {
    position: 'absolute' as const, top: 14, left: 14,
    background: 'rgba(175,82,222,0.85)', backdropFilter: 'blur(8px)',
    borderRadius: 'var(--radius-full)', padding: '4px 10px',
    color: '#fff', fontWeight: 700, fontSize: 11,
  },
  superBanner: {
    background: 'linear-gradient(135deg, rgba(175,82,222,0.15), rgba(0,122,255,0.1))',
    border: '1px solid rgba(175,82,222,0.3)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '0 auto 0',
    maxWidth: 1200,
  },
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.role as string | undefined;

  const isCustomer = !userRole || userRole === 'customer';
  const isSuperAdmin = userRole === 'superadmin';
  const isRestaurantAdmin = userRole === 'restaurant_admin';
  const isDeliveryAgent = userRole === 'delivery_agent';

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [myRestaurant, setMyRestaurant] = useState<Restaurant | null>(null);
  const [myMenu, setMyMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // No redirects needed - each role renders its own view

  useEffect(() => {
    if (isRestaurantAdmin) {
      // Only fetch their own restaurant
      restaurantApi.myRestaurants().then((data: any) => {
        if (data && data.length > 0) {
          setMyRestaurant(data[0]);
          menuApi.getMenu(data[0].id).then((items: any) => {
            setMyMenu(items);
            setLoading(false);
          }).catch(() => setLoading(false));
        } else {
          setLoading(false);
        }
      }).catch(() => setLoading(false));
    } else {
      // Customer and superadmin see all restaurants
      restaurantApi.list()
        .then((data: any) => { setRestaurants(data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [isRestaurantAdmin]);

  const filtered = useMemo(() =>
    restaurants.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase())
    ), [restaurants, search]);

  // ─── Delivery Agent View ─────────────────────────────────────────
  if (isDeliveryAgent) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
          Ready to hit the road, <span style={s.gradient}>{user?.name}</span>?
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-400)', marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
          Check your Agent Dashboard to find available broadcasted deliveries and manage your active ones.
        </p>
        <button onClick={() => navigate('/agent-dashboard')} style={{
          background: 'var(--primary)', color: '#fff', padding: '16px 32px',
          borderRadius: 'var(--radius-full)', fontWeight: 800, fontSize: 16,
          border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(255,107,53,0.3)',
        }}>
          Go to Agent Dashboard 🛵
        </button>
      </div>
    );
  }

  // ─── Restaurant Admin View ─────────────────────────────────────────
  if (isRestaurantAdmin) {
    return (
      <div>
        {/* Admin Hero */}
        <section style={{ ...s.hero, minHeight: 280 }}>
          <div style={s.heroGlow} />
          <h1 style={{ ...s.h1, fontSize: 40 }} className="animate-fadeInUp">
            Welcome back, <span style={s.gradient}>{user?.name}</span>
          </h1>
          <p style={s.subtitle} className="animate-fadeInUp stagger-2">
            {myRestaurant
              ? `Managing ${myRestaurant.name} — ${myRestaurant.cuisine} cuisine`
              : 'Your restaurant management portal'}
          </p>
          <div style={{ display: 'flex', gap: 12 }} className="animate-fadeInUp stagger-3">
            <button onClick={() => navigate('/dashboard')} style={{
              background: 'var(--primary)', color: '#fff', padding: '14px 28px',
              borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: 15,
              border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,107,53,0.35)',
            }}>
              Go to Dashboard
            </button>
          </div>
        </section>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-400)' }}>Loading your restaurant...</div>
        ) : myRestaurant ? (
          <section style={s.section}>
            {/* Restaurant Card */}
            <div style={{
              borderRadius: 'var(--radius-lg)', overflow: 'hidden',
              background: 'var(--bg-800)', border: '1px solid rgba(255,107,53,0.25)',
              boxShadow: '0 8px 32px rgba(255,107,53,0.1)', marginBottom: 40,
            }}>
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                {myRestaurant.image_url && (
                  <img src={myRestaurant.image_url} alt={myRestaurant.name}
                    style={{ width: '100%', height: 260, objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                <div style={{
                  position: 'absolute', top: 20, left: 20,
                  background: 'var(--primary)', color: '#fff',
                  padding: '6px 16px', borderRadius: 'var(--radius-full)',
                  fontWeight: 800, fontSize: 13,
                }}>YOUR RESTAURANT</div>
                <div style={{
                  position: 'absolute', top: 20, right: 20,
                  background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-full)', padding: '5px 12px',
                  color: '#fff', fontWeight: 700, fontSize: 13,
                }}>⭐ {myRestaurant.rating}</div>
              </div>
              <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 16 }}>
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>{myRestaurant.name}</h2>
                  <div style={{ display: 'flex', gap: 16, color: 'var(--text-400)', fontSize: 14 }}>
                    <span>🍽️ {myRestaurant.cuisine}</span>
                    <span>📍 {myRestaurant.address}</span>
                    <span>📞 {myRestaurant.phone}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => navigate('/dashboard')} style={{
                    background: 'var(--primary)', color: '#fff', padding: '12px 24px',
                    borderRadius: 'var(--radius-md)', fontWeight: 700, border: 'none', cursor: 'pointer',
                  }}>Manage Orders</button>
                  <button onClick={() => { navigate('/dashboard'); setTimeout(() => { document.querySelector('[data-tab="MENU"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, 100); }} style={{
                    background: 'var(--bg-700)', color: 'var(--text-100)', padding: '12px 24px',
                    borderRadius: 'var(--radius-md)', fontWeight: 700, border: '1px solid var(--border)', cursor: 'pointer',
                  }}>Manage Menu</button>
                </div>
              </div>
            </div>

            {/* Menu Preview */}
            <h2 style={s.sectionTitle}>🍽️ Your Menu ({myMenu.length} items)</h2>
            {myMenu.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-400)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
                No menu items yet. <button onClick={() => navigate('/dashboard')} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Add items from Dashboard →</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {myMenu.map((item: any, idx: number) => (
                  <div key={item.id} style={{
                    display: 'flex', gap: 14, padding: 18,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-800)', border: '1px solid var(--glass-border)',
                    transition: 'var(--transition)',
                  }} className={`animate-fadeInUp stagger-${Math.min(idx + 1, 6)}`}>
                    <div style={{
                      width: 14, height: 14, borderRadius: 3, border: `2px solid ${item.is_veg ? 'var(--success)' : 'var(--danger)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4,
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.is_veg ? 'var(--success)' : 'var(--danger)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-400)', marginBottom: 6 }}>{item.category}</div>
                      {item.description && <div style={{ fontSize: 12, color: 'var(--text-400)', lineHeight: 1.4 }}>{item.description}</div>}
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 15, flexShrink: 0 }}>INR {item.price}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h2 style={{ fontWeight: 700, marginBottom: 12 }}>Awaiting Restaurant Assignment</h2>
            <p style={{ color: 'var(--text-400)', maxWidth: 400, margin: '0 auto' }}>
              Your partner account ({user?.email}) is ready! Please wait for the Superadmin to create and link your restaurant to this account.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ─── Customer / Superadmin View ─────────────────────────────────────
  const renderCard = (r: Restaurant, idx: number) => {
    const cardContent = (
      <div style={s.card} className={`animate-fadeInUp stagger-${Math.min(idx + 1, 6)}`}
        onMouseOver={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)';
          (e.currentTarget as HTMLElement).style.borderColor = isSuperAdmin ? 'rgba(175,82,222,0.3)' : 'rgba(255,107,53,0.3)';
          (e.currentTarget as HTMLElement).style.boxShadow = isSuperAdmin ? '0 12px 40px rgba(175,82,222,0.1)' : '0 12px 40px rgba(255,107,53,0.1)';
        }}
        onMouseOut={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--glass-border)';
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        }}>
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          {r.image_url ? (
            <img src={r.image_url} alt={r.name} style={s.cardImg}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div style={s.cardImgPlaceholder}>🍽️</div>
          )}
          <div style={s.ratingBadge}>⭐ {r.rating}</div>
          {isSuperAdmin && <div style={s.monitorBadge}>MONITOR</div>}
        </div>
        <div style={s.cardBody}>
          <h3 style={s.cardName}>{r.name}</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <span style={s.tag}>{r.cuisine}</span>
          </div>
          <div style={s.cardMeta}>
            <span>📍 {r.address}</span>
            <span>🕐 25–35 min</span>
          </div>
        </div>
      </div>
    );

    if (isCustomer || isSuperAdmin) {
      return (
        <Link key={r.id} to={`/restaurants/${r.id}`} style={{ textDecoration: 'none' }}>
          {cardContent}
        </Link>
      );
    }
    return <div key={r.id} style={{ cursor: 'default' }}>{cardContent}</div>;
  };

  return (
    <div>
      {isSuperAdmin && (
        <div style={{ padding: '16px 24px 0' }}>
          <div style={s.superBanner}>
            <span style={{ fontSize: 24 }}>👑</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Superadmin Platform Monitor</div>
              <div style={{ fontSize: 13, color: 'var(--text-400)' }}>
                You are viewing all restaurants in read-only monitoring mode. Go to <strong>Platform Dashboard</strong> to manage orders.
              </div>
            </div>
          </div>
        </div>
      )}

      <section style={s.hero}>
        <div style={s.heroGlow} />
        <h1 style={s.h1} className="animate-fadeInUp">
          {isSuperAdmin ? 'Platform Overview' : 'Craving Something'}<br />
          <span style={s.gradient}>{isSuperAdmin ? 'All Restaurants' : 'Delicious?'}</span>
        </h1>
        <p style={s.subtitle} className="animate-fadeInUp stagger-2">
          {isSuperAdmin
            ? 'Monitor all restaurants across the platform.'
            : 'Order from premium restaurants and get it delivered fresh to your doorstep in minutes.'}
        </p>
        <div style={s.searchWrap} className="animate-fadeInUp stagger-3">
          <span style={s.searchIcon}>🔍</span>
          <input
            style={s.searchInput}
            placeholder="Search restaurants or cuisines…"
            value={search} onChange={e => setSearch(e.target.value)}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
          />
        </div>
      </section>

      <section style={s.section}>
        <div style={s.stats}>
          <div style={s.statPill}>🍽️ {restaurants.length} Restaurants</div>
          <div style={s.statPill}>⚡ 30 min avg delivery</div>
          <div style={s.statPill}>🌟 4.3+ avg rating</div>
        </div>
        <h2 style={s.sectionTitle}>
          {isSuperAdmin ? '👑 All Platform Restaurants' : '🔥 Popular Near You'}
        </h2>
        {loading ? (
          <div style={s.grid}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skeleton" style={s.skeleton} />
            ))}
          </div>
        ) : (
          <div style={s.grid}>
            {filtered.map((r, idx) => renderCard(r, idx))}
            {filtered.length === 0 && (
              <div style={s.empty}>No restaurants found matching "{search}"</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
