import React, { useEffect, useState } from 'react';
import { orderApi } from '../services/api';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const s: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1000,
    margin: '0 auto',
    padding: '40px 24px 80px',
  },
  header: {
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: '-1px',
    marginBottom: 8,
  },
  subtitle: {
    color: 'var(--text-400)',
    fontSize: 16,
    marginBottom: 32,
  },
  tabs: {
    display: 'flex',
    gap: 12,
    marginBottom: 32,
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: 16,
  },
  tab: {
    padding: '10px 24px',
    borderRadius: 'var(--radius-full)',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'var(--transition)',
    border: 'none',
  },
  tabActive: {
    background: 'var(--primary)',
    color: '#fff',
    boxShadow: '0 4px 16px rgba(255,107,53,0.3)',
  },
  tabInactive: {
    background: 'transparent',
    color: 'var(--text-300)',
  },
  grid: {
    display: 'grid',
    gap: 16,
  },
  card: {
    background: 'var(--bg-800)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 24,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 24,
    transition: 'var(--transition)',
  },
  cardDetails: {
    flex: 1,
  },
  orderId: {
    fontSize: 13,
    color: 'var(--text-400)',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  restaurant: {
    fontSize: 18,
    fontWeight: 800,
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: 'var(--text-200)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minWidth: 160,
  },
  btnPrimary: {
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(255,107,53,0.3)',
    transition: 'var(--transition)',
  },
  btnSecondary: {
    background: 'var(--bg-700)',
    color: 'var(--text-100)',
    border: '1px solid var(--glass-border)',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  btnDanger: {
    background: 'transparent',
    color: 'var(--danger)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 'var(--radius-full)',
    fontSize: 12,
    fontWeight: 800,
    marginBottom: 12,
  },
};

const getStatusColor = (status: string) => {
  if (status === 'READY_FOR_PICKUP') return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' };
  if (status === 'OUT_FOR_DELIVERY') return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' };
  if (status === 'DELIVERED') return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399' };
  return { bg: 'var(--bg-700)', color: 'var(--text-300)' };
};

export default function AgentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'AVAILABLE' | 'ACTIVE' | 'HISTORY'>('AVAILABLE');
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    orderApi.list().then((data: any) => {
      setOrders(data);
      setLoading(false);
    }).catch((err: any) => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!user || user.role !== 'delivery_agent') {
      navigate('/');
      return;
    }
    fetchOrders();
    const int = setInterval(fetchOrders, 5000); // Poll for new broadcasts
    return () => clearInterval(int);
  }, [user, navigate]);

  const handleAccept = async (id: string) => {
    try {
      await orderApi.accept(id);
      fetchOrders();
      setActiveTab('ACTIVE');
    } catch (e) {
      alert("Failed to accept. Order may have been taken by another agent.");
      fetchOrders();
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await orderApi.revoke(id);
      fetchOrders();
    } catch (e) {
      alert("Failed to revoke order.");
    }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await orderApi.updateStatus(id, status);
      fetchOrders();
    } catch (e) {
      alert("Failed to update status.");
    }
  };

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-400)' }}>Loading deliveries...</div>;

  const available = orders.filter(o => (o.status as string) === 'READY_FOR_PICKUP' && !o.delivery_agent_id);
  const active = orders.filter(o => o.delivery_agent_id === user?.id && o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const history = orders.filter(o => o.delivery_agent_id === user?.id && o.status === 'DELIVERED');

  const displayOrders = activeTab === 'AVAILABLE' ? available : activeTab === 'ACTIVE' ? active : history;

  return (
    <div style={s.container} className="animate-fadeIn">
      <h1 style={s.header}>Delivery Hub</h1>
      <p style={s.subtitle}>Welcome back, {user?.name}. Find and manage your deliveries here.</p>

      <div style={s.tabs}>
        <button 
          style={{ ...s.tab, ...(activeTab === 'AVAILABLE' ? s.tabActive : s.tabInactive) }}
          onClick={() => setActiveTab('AVAILABLE')}
        >
          🟢 Broadcast Pool ({available.length})
        </button>
        <button 
          style={{ ...s.tab, ...(activeTab === 'ACTIVE' ? s.tabActive : s.tabInactive) }}
          onClick={() => setActiveTab('ACTIVE')}
        >
          🛵 My Active Deliveries ({active.length})
        </button>
        <button 
          style={{ ...s.tab, ...(activeTab === 'HISTORY' ? s.tabActive : s.tabInactive) }}
          onClick={() => setActiveTab('HISTORY')}
        >
          ✅ Delivery History ({history.length})
        </button>
      </div>

      {displayOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-400)' }}>
          {activeTab === 'AVAILABLE' ? 'No orders currently ready for pickup.' : activeTab === 'HISTORY' ? 'You have no delivered orders yet.' : 'You have no active deliveries.'}
        </div>
      ) : (
        <div style={s.grid}>
          {displayOrders.map((order, idx) => {
            const sc = getStatusColor(order.status);
            return (
              <div key={order.id} style={s.card} className={`animate-fadeInUp stagger-${Math.min(idx+1, 6)}`}>
                <div style={s.cardDetails}>
                  <div style={s.orderId}>ID: {order.id.split('-')[0].toUpperCase()}</div>
                  <div style={{ ...s.statusBadge, background: sc.bg, color: sc.color }}>
                    {order.status.replace(/_/g, ' ')}
                  </div>
                  <div style={s.restaurant}>Dropoff: {order.delivery_address}</div>
                  <div style={s.address}>
                    <span>💰</span> Collect: INR {order.total_amount.toFixed(2)} ({order.payment?.method})
                  </div>
                  <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-400)' }}>
                    <strong>Items:</strong> {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </div>
                </div>

                <div style={s.actions}>
                  {activeTab === 'AVAILABLE' && (
                    <button 
                      style={s.btnPrimary} 
                      onClick={() => handleAccept(order.id)}
                      onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      Accept Order
                    </button>
                  )}
                  {activeTab === 'ACTIVE' && (order.status as string) === 'READY_FOR_PICKUP' && (
                    <>
                      <button style={s.btnPrimary} onClick={() => handleStatus(order.id, 'OUT_FOR_DELIVERY')}>
                        Mark Picked Up
                      </button>
                      <button style={s.btnDanger} onClick={() => handleRevoke(order.id)}>
                        Revoke (Return to Pool)
                      </button>
                    </>
                  )}
                  {activeTab === 'ACTIVE' && order.status === 'OUT_FOR_DELIVERY' && (
                    <button style={s.btnPrimary} onClick={() => handleStatus(order.id, 'DELIVERED')}>
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
