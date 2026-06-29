import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderApi } from '../services/api';
import { Order, OrderStatus } from '../types';

const STAGES: { id: OrderStatus; label: string; icon: string }[] = [
  { id: 'PLACED',           label: 'Placed',      icon: '📝' },
  { id: 'CONFIRMED',        label: 'Confirmed',   icon: '✅' },
  { id: 'PREPARING',        label: 'Preparing',   icon: '👨‍🍳' },
  { id: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: '🛍️' },
  { id: 'OUT_FOR_DELIVERY', label: 'On the Way',  icon: '🚴' },
  { id: 'DELIVERED',        label: 'Delivered',    icon: '🏠' },
];

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' },
  card: {
    borderRadius: 'var(--radius-xl)', padding: '48px 40px',
    background: 'var(--bg-800)', border: '1px solid var(--glass-border)',
    boxShadow: 'var(--shadow-lg)',
  },
  headerCenter: { textAlign: 'center' as const, marginBottom: 48 },
  title: { fontSize: 28, fontWeight: 800, marginBottom: 6 },
  orderId: {
    fontSize: 13, fontFamily: 'monospace', color: 'var(--text-400)',
    letterSpacing: '0.5px',
  },
  timeline: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    position: 'relative' as const, padding: '0 4px',
  },
  lineTrack: {
    position: 'absolute' as const, top: 28, left: '10%', right: '10%',
    height: 4, background: 'var(--bg-600)', borderRadius: 2, zIndex: 0,
  },
  lineFill: {
    position: 'absolute' as const, top: 28, left: '10%',
    height: 4, borderRadius: 2, zIndex: 1,
    background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
    boxShadow: '0 0 12px rgba(255,107,53,0.5)',
    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  stage: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    width: '20%', position: 'relative' as const, zIndex: 2,
  },
  stageCircle: {
    width: 56, height: 56, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24, marginBottom: 12,
    transition: 'all 0.5s ease',
  },
  stageLabel: {
    fontSize: 12, fontWeight: 700, textAlign: 'center' as const,
    transition: 'color 0.5s ease',
  },
  cancelled: {
    textAlign: 'center' as const, padding: 40,
    background: 'rgba(255,59,48,0.08)', borderRadius: 'var(--radius-lg)',
    border: '1px solid rgba(255,59,48,0.2)',
  },
  details: {
    marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--border)',
  },
  detailGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
  },
  detailLabel: { fontSize: 12, color: 'var(--text-400)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  detailValue: { fontSize: 15, fontWeight: 600, color: 'var(--text-100)' },
  itemsList: {
    marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)',
  },
  itemLine: {
    display: 'flex', justifyContent: 'space-between', padding: '8px 0',
    fontSize: 14, color: 'var(--text-300)',
  },
  backLink: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    color: 'var(--primary)', fontWeight: 600, fontSize: 14,
    marginTop: 32,
  },
};

export default function Track() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetch = () => {
      orderApi.get(id).then((data: any) => setOrder(data)).catch(console.error);
    };
    fetch();
    const interval = setInterval(fetch, 2500);
    return () => clearInterval(interval);
  }, [id]);

  if (!order) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-400)' }}>Loading tracking…</div>;

  const currentIdx = STAGES.findIndex(st => st.id === order.status);
  const isCancelled = order.status === 'CANCELLED';
  const progressWidth = isCancelled ? 0 : (currentIdx / (STAGES.length - 1)) * 80;

  return (
    <div style={s.page}>
      <div style={s.card} className="animate-fadeInUp">
        <div style={s.headerCenter}>
          <h1 style={s.title}>
            {isCancelled ? '❌ Order Cancelled' :
             order.status === 'DELIVERED' ? '🎉 Order Delivered!' : '📍 Track Your Order'}
          </h1>
          <div style={s.orderId}>Order #{order.id.slice(0, 8).toUpperCase()}</div>
        </div>

        {isCancelled ? (
          <div style={s.cancelled}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>😔</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>
              This order was cancelled
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-400)' }}>
              {order.payment?.status === 'REFUNDED' ? 'Your payment has been refunded.' : 'No payment was charged.'}
            </p>
          </div>
        ) : (
          <div style={s.timeline}>
            <div style={s.lineTrack} />
            <div style={{ ...s.lineFill, width: `${progressWidth}%` }} />
            {STAGES.map((stage, idx) => {
              const isCompleted = currentIdx >= idx;
              const isCurrent = currentIdx === idx;
              return (
                <div key={stage.id} style={s.stage}>
                  <div style={{
                    ...s.stageCircle,
                    background: isCompleted
                      ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))'
                      : 'var(--bg-600)',
                    border: isCompleted ? 'none' : '2px solid var(--border)',
                    boxShadow: isCurrent ? '0 0 24px rgba(255,107,53,0.5)' : 'none',
                    transform: isCurrent ? 'scale(1.15)' : 'scale(1)',
                  }}>
                    {stage.icon}
                  </div>
                  <div style={{
                    ...s.stageLabel,
                    color: isCompleted ? 'var(--text-100)' : 'var(--text-400)',
                  }}>
                    {stage.label}
                  </div>
                  {isCurrent && order.status !== 'DELIVERED' && (
                    <div style={{
                      marginTop: 8, fontSize: 11, color: 'var(--primary)',
                      fontWeight: 700, animation: 'pulse-glow 2s infinite',
                      padding: '3px 10px', borderRadius: 'var(--radius-full)',
                      background: 'var(--primary-light)',
                    }}>
                      LIVE
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={s.details}>
          <div style={s.detailGrid}>
            <div>
              <div style={s.detailLabel}>Delivery Address</div>
              <div style={s.detailValue}>{order.delivery_address}</div>
            </div>
            <div>
              <div style={s.detailLabel}>Total Amount</div>
              <div style={{ ...s.detailValue, fontSize: 24, fontWeight: 900, color: 'var(--primary)' }}>
                ₹{order.total_amount.toFixed(0)}
              </div>
            </div>
            <div>
              <div style={s.detailLabel}>Payment</div>
              <div style={s.detailValue}>
                {order.payment ? `${order.payment.method} — ${order.payment.status}` : 'Pending'}
              </div>
            </div>
            <div>
              <div style={s.detailLabel}>Placed At</div>
              <div style={s.detailValue}>
                {order.created_at ? new Date(order.created_at).toLocaleString('en-IN', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                }) : '—'}
              </div>
            </div>
          </div>

          <div style={s.itemsList}>
            <div style={{ fontSize: 13, color: 'var(--text-400)', marginBottom: 12, fontWeight: 600 }}>
              ORDER ITEMS
            </div>
            {order.items.map(i => (
              <div key={i.id} style={s.itemLine}>
                <span>{i.quantity}× {i.name}</span>
                <span>₹{i.subtotal.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        <Link to="/orders" style={s.backLink}>← Back to Orders</Link>
      </div>
    </div>
  );
}
