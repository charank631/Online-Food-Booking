import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurantApi, menuApi } from '../services/api';
import { Restaurant, MenuItem } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const s: Record<string, React.CSSProperties> = {
  header: {
    padding: '48px 24px', borderBottom: '1px solid var(--glass-border)',
    background: 'var(--bg-800)',
  },
  headerInner: { maxWidth: 960, margin: '0 auto' },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    color: 'var(--text-400)', fontSize: 14, fontWeight: 600,
    marginBottom: 20, transition: 'var(--transition)', cursor: 'pointer',
  },
  name: { fontSize: 40, fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 },
  meta: { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const },
  tag: {
    padding: '6px 16px', borderRadius: 'var(--radius-full)',
    background: 'var(--primary-light)', color: 'var(--primary)',
    fontSize: 13, fontWeight: 700,
  },
  metaItem: { fontSize: 14, color: 'var(--text-300)' },
  content: { maxWidth: 960, margin: '0 auto', padding: '32px 24px 80px' },
  catBar: {
    display: 'flex', gap: 10, overflowX: 'auto' as const, paddingBottom: 16,
    marginBottom: 28, borderBottom: '1px solid var(--border)',
  },
  catBtn: {
    whiteSpace: 'nowrap' as const, padding: '10px 22px',
    borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: 13,
    transition: 'var(--transition)', cursor: 'pointer', flexShrink: 0,
  },
  catActive: {
    background: 'var(--primary)', color: '#fff',
    boxShadow: '0 4px 16px rgba(255,107,53,0.3)',
  },
  catInactive: {
    background: 'var(--bg-700)', color: 'var(--text-300)',
    border: '1px solid var(--border)',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px,1fr))', gap: 16 },
  item: {
    display: 'flex', gap: 16, padding: 20, borderRadius: 'var(--radius-md)',
    background: 'var(--bg-800)', border: '1px solid var(--glass-border)',
    transition: 'var(--transition)',
  },
  vegDot: {
    width: 14, height: 14, borderRadius: 3, border: '2px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    marginTop: 3,
  },
  vegInner: { width: 6, height: 6, borderRadius: '50%' },
  itemName: { fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'var(--text-100)' },
  itemPrice: { fontSize: 15, fontWeight: 800, color: 'var(--primary)', marginBottom: 6 },
  itemDesc: { fontSize: 13, color: 'var(--text-400)', lineHeight: 1.5 },
  addBtn: {
    padding: '10px 28px', borderRadius: 'var(--radius-md)',
    background: 'transparent', border: '2px solid var(--primary)',
    color: 'var(--primary)', fontWeight: 700, fontSize: 14,
    transition: 'var(--transition)', whiteSpace: 'nowrap' as const, alignSelf: 'center',
  },
  qtyCtrl: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'var(--bg-700)', borderRadius: 'var(--radius-md)',
    padding: '4px 8px', border: '1px solid var(--border)', alignSelf: 'center',
  },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 'var(--radius-sm)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-600)', color: 'var(--text-200)',
    fontWeight: 700, fontSize: 16, transition: 'var(--transition)',
  },
  qty: { fontWeight: 800, fontSize: 15, minWidth: 20, textAlign: 'center' as const },
};

export default function Menu() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, changeQty, items: cartItems, itemCount } = useCart();
  const { user } = useAuth();
  const userRole = user?.role as string | undefined;
  const isCustomer = !userRole || userRole === 'customer';
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [activeCat, setActiveCat] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([restaurantApi.get(id), menuApi.getMenu(id)])
      .then(([r, m]: any) => { setRestaurant(r); setMenu(m); setLoading(false); })
      .catch(console.error);
  }, [id]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(menu.map(m => m.category)));
    return ['All', ...cats];
  }, [menu]);

  const filtered = useMemo(() =>
    activeCat === 'All' ? menu : menu.filter(m => m.category === activeCat),
  [menu, activeCat]);

  if (loading) return (
    <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-400)' }}>
      Loading menu…
    </div>
  );
  if (!restaurant) return (
    <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-400)' }}>
      Restaurant not found
    </div>
  );

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={s.header}>
        <div style={s.headerInner}>
          <button style={s.backBtn} onClick={() => navigate(-1)}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = 'var(--primary)'; }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-400)'; }}>
            ← Back
          </button>
          <h1 style={s.name}>{restaurant.name}</h1>
          <div style={s.meta}>
            <span style={s.tag}>{restaurant.cuisine}</span>
            <span style={s.metaItem}>⭐ {restaurant.rating}</span>
            <span style={s.metaItem}>📍 {restaurant.address}</span>
            <span style={s.metaItem}>🕐 25–35 min</span>
          </div>
        </div>
      </div>

      {!isCustomer && (
        <div style={{
          margin: '0 auto', maxWidth: 960, padding: '14px 24px',
          background: 'linear-gradient(135deg, rgba(175,82,222,0.12), rgba(0,122,255,0.08))',
          border: '1px solid rgba(175,82,222,0.25)', borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-300)',
        }}>
          <span style={{ fontSize: 18 }}>👑</span>
          <span><strong>Superadmin view</strong> — This menu is displayed in read-only monitoring mode. No ordering is possible.</span>
        </div>
      )}

      <div style={s.content}>
        <div style={s.catBar}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              style={{ ...s.catBtn, ...(activeCat === cat ? s.catActive : s.catInactive) }}>
              {cat}
            </button>
          ))}
        </div>

        <div style={s.grid}>
          {filtered.map((item, idx) => {
            const inCart = cartItems.find(c => c.menuItem.id === item.id);
            return (
              <div key={item.id} style={s.item}
                className={`animate-fadeInUp stagger-${Math.min(idx+1, 6)}`}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,107,53,0.2)'; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--glass-border)'; }}>
                <div style={{ ...s.vegDot, borderColor: item.is_veg ? 'var(--success)' : 'var(--danger)' }}>
                  <div style={{ ...s.vegInner, background: item.is_veg ? 'var(--success)' : 'var(--danger)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={s.itemName}>{item.name}</div>
                  <div style={s.itemPrice}>₹{item.price.toFixed(0)}</div>
                  {item.description && <div style={s.itemDesc}>{item.description}</div>}
                </div>
                {inCart ? (
                  isCustomer ? (
                    <div style={s.qtyCtrl}>
                      <button style={s.qtyBtn} onClick={() => changeQty(item.id, -1)}>−</button>
                      <span style={s.qty}>{inCart.quantity}</span>
                      <button style={s.qtyBtn} onClick={() => changeQty(item.id, 1)}>+</button>
                    </div>
                  ) : null
                ) : (
                  isCustomer ? (
                    <button style={s.addBtn} onClick={() => addItem(item, restaurant.id, restaurant.name)}
                      onMouseOver={e => { 
                        (e.currentTarget as HTMLElement).style.background = 'var(--primary)';
                        (e.currentTarget as HTMLElement).style.color = '#fff';
                      }}
                      onMouseOut={e => { 
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = 'var(--primary)';
                      }}>
                      ADD
                    </button>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-400)', fontStyle: 'italic' }}>View only</span>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {isCustomer && itemCount > 0 && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }} className="animate-fadeInUp">
          <button onClick={() => navigate('/cart')} style={{
            background: 'var(--primary)', color: '#fff', padding: '16px 32px',
            borderRadius: 30, fontSize: 16, fontWeight: 800,
            boxShadow: '0 8px 32px rgba(255,107,53,0.4)',
            border: 'none', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center',
            transition: 'transform 0.2s'
          }}
          onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            🛒 View Cart <span style={{opacity: 0.5}}>|</span> {itemCount} Item{itemCount > 1 ? 's' : ''} 
          </button>
        </div>
      )}
    </div>
  );
}
