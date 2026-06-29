import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../services/api';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PLACED:            { bg: 'rgba(255,159,28,0.12)', text: '#ff9f1c', border: 'rgba(255,159,28,0.3)' },
  CONFIRMED:         { bg: 'rgba(52,199,89,0.12)',  text: '#34c759', border: 'rgba(52,199,89,0.3)' },
  PREPARING:         { bg: 'rgba(0,122,255,0.12)',   text: '#007aff', border: 'rgba(0,122,255,0.3)' },
  OUT_FOR_DELIVERY:  { bg: 'rgba(175,82,222,0.12)',  text: '#af52de', border: 'rgba(175,82,222,0.3)' },
  DELIVERED:         { bg: 'rgba(52,199,89,0.12)',   text: '#34c759', border: 'rgba(52,199,89,0.3)' },
  CANCELLED:         { bg: 'rgba(255,59,48,0.12)',   text: '#ff3b30', border: 'rgba(255,59,48,0.3)' },
};

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 900, margin: '0 auto', padding: '48px 24px 80px' },
  title: { fontSize: 32, fontWeight: 800, marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'var(--text-400)', marginBottom: 36 },
  card: {
    borderRadius: 'var(--radius-lg)', padding: 24,
    background: 'var(--bg-800)', border: '1px solid var(--glass-border)',
    marginBottom: 16, transition: 'var(--transition)',
  },
  cardTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
    color: 'var(--text-400)', letterSpacing: '0.5px', marginBottom: 4,
  },
  date: { fontSize: 13, color: 'var(--text-400)' },
  statusBadge: {
    padding: '6px 16px', borderRadius: 'var(--radius-full)',
    fontSize: 12, fontWeight: 700, letterSpacing: '0.3px',
  },
  items: {
    padding: '16px 0', borderTop: '1px solid var(--border)',
    borderBottom: '1px solid var(--border)',
  },
  itemLine: {
    display: 'flex', justifyContent: 'space-between', fontSize: 14,
    color: 'var(--text-300)', marginBottom: 6,
  },
  bottom: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 16,
  },
  amount: { fontSize: 20, fontWeight: 800, color: 'var(--text-100)' },
  trackLink: {
    color: 'var(--primary)', fontWeight: 700, fontSize: 14,
    transition: 'var(--transition)', cursor: 'pointer',
  },
  empty: { textAlign: 'center' as const, padding: 80, color: 'var(--text-400)' },
  paymentInfo: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 12, color: 'var(--text-400)', marginLeft: 12,
    padding: '4px 10px', borderRadius: 'var(--radius-full)',
    background: 'var(--bg-700)',
  },
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    orderApi.list()
      .then((data: any) => { setOrders(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div style={s.empty}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <p style={{ fontSize: 18 }}>Please sign in to view your orders</p>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-400)' }}>Loading orders…</div>;

  return (
    <div style={s.page}>
      <h1 style={s.title}>My Orders</h1>
      <p style={s.subtitle}>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>

      {orders.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: 'var(--text-200)' }}>No orders yet</h2>
          <p style={{ marginBottom: 24 }}>Place your first order from our amazing restaurants</p>
          <Link to="/" style={{
            display: 'inline-block', padding: '12px 32px',
            borderRadius: 'var(--radius-full)', background: 'var(--primary)',
            color: '#fff', fontWeight: 700,
          }}>
            Browse Restaurants
          </Link>
        </div>
      ) : (
        orders.map((order, idx) => {
          const sc = STATUS_COLORS[order.status] || STATUS_COLORS.PLACED;
          return (
            <div key={order.id} style={s.card}
              className={`animate-fadeInUp stagger-${Math.min(idx+1, 6)}`}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,107,53,0.2)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--glass-border)'; }}>
              <div style={s.cardTop}>
                <div>
                  <div style={s.orderId}>#{order.id.slice(0, 8).toUpperCase()}</div>
                  <div style={s.date}>
                    {order.created_at ? new Date(order.created_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    ...s.statusBadge, background: sc.bg, color: sc.text,
                    border: `1px solid ${sc.border}`,
                  }}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  {order.payment && (
                    <span style={s.paymentInfo}>
                      {order.payment.status === 'PAID' ? '✅' : '⏳'} {order.payment.method}
                    </span>
                  )}
                </div>
              </div>

              <div style={s.items}>
                {order.items.map(i => (
                  <div key={i.id} style={s.itemLine}>
                    <span>{i.quantity}× {i.name}</span>
                    <span>₹{i.subtotal.toFixed(0)}</span>
                  </div>
                ))}
              </div>

              <div style={s.bottom}>
                <span style={s.amount}>₹{order.total_amount.toFixed(0)}</span>
                {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                  <Link to={`/track/${order.id}`} style={s.trackLink}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}>
                    Track Order →
                  </Link>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
