import React, { useEffect, useState } from 'react';
import { dashboardApi, orderApi, menuApi, restaurantApi, authApi } from '../services/api';
import { DashboardStats, MenuItem, Restaurant } from '../types';
import { useAuth } from '../context/AuthContext';

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '48px 24px 80px' },
  header: { marginBottom: 36 },
  superBanner: {
    background: 'linear-gradient(135deg, rgba(175,82,222,0.15), rgba(0,122,255,0.1))',
    border: '1px solid rgba(175,82,222,0.3)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px 24px',
    marginBottom: 28,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: 32, fontWeight: 800, marginBottom: 6 },
  subtitle: { fontSize: 14, color: 'var(--text-400)' },
  tabs: {
    display: 'flex', gap: 12, marginBottom: 32,
    borderBottom: '1px solid var(--glass-border)', paddingBottom: 16,
  },
  tab: {
    padding: '10px 24px', borderRadius: 'var(--radius-full)',
    fontWeight: 700, fontSize: 14, cursor: 'pointer',
    transition: 'var(--transition)', border: 'none',
  },
  tabActive: { background: 'var(--primary)', color: '#fff', boxShadow: '0 4px 16px rgba(255,107,53,0.3)' },
  tabInactive: { background: 'transparent', color: 'var(--text-300)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 36 },
  statCard: {
    padding: 24, borderRadius: 'var(--radius-lg)',
    background: 'var(--bg-800)', border: '1px solid var(--glass-border)',
    display: 'flex', alignItems: 'center', gap: 16,
  },
  statIcon: { width: 52, height: 52, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 },
  statLabel: { fontSize: 13, color: 'var(--text-400)', marginBottom: 4 },
  statValue: { fontSize: 26, fontWeight: 900, color: 'var(--text-100)' },
  tableWrap: { borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-800)', border: '1px solid var(--glass-border)' },
  tableHeader: { padding: '20px 24px', fontSize: 18, fontWeight: 700, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: {
    padding: '14px 20px', textAlign: 'left' as const,
    fontSize: 12, fontWeight: 700, color: 'var(--text-400)',
    textTransform: 'uppercase' as const, letterSpacing: '0.5px',
    background: 'var(--bg-700)', borderBottom: '1px solid var(--border)',
  },
  td: { padding: '14px 20px', fontSize: 14, color: 'var(--text-200)', borderBottom: '1px solid var(--border)' },
  statusBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 700 },
  actionBtn: {
    padding: '8px 14px', borderRadius: 'var(--radius-sm)',
    fontWeight: 700, fontSize: 13, cursor: 'pointer',
    border: 'none', transition: 'var(--transition)',
  },
  btnGreen: { background: 'rgba(52,199,89,0.15)', color: '#34c759', border: '1px solid rgba(52,199,89,0.3)' },
  btnBlue: { background: 'rgba(0,122,255,0.15)', color: '#007aff', border: '1px solid rgba(0,122,255,0.3)' },
  btnOrange: { background: 'rgba(255,159,28,0.15)', color: '#ff9f1c', border: '1px solid rgba(255,159,28,0.3)' },
  btnPrimary: {
    background: 'var(--primary)', color: '#fff', padding: '10px 20px',
    borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 14,
    cursor: 'pointer', border: 'none', boxShadow: '0 4px 12px rgba(255,107,53,0.3)', transition: 'var(--transition)',
  },
  btnDanger: {
    background: 'transparent', color: 'var(--danger)', padding: '8px 14px',
    borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: 13,
    cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)', transition: 'var(--transition)',
  },
  form: {
    background: 'var(--bg-800)', border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 28,
  },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  inputGroup: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-300)' },
  input: {
    padding: '10px 14px', borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-700)', border: '1px solid var(--border)',
    color: 'var(--text-100)', fontSize: 14, outline: 'none',
  },
  menuItemRow: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '14px 20px', borderBottom: '1px solid var(--border)',
    transition: 'var(--transition)',
  },
};

const STAT_CONFIGS = [
  { key: 'total_revenue', label: 'Total Revenue', icon: '💰', bg: 'rgba(52,199,89,0.1)', format: (v: number) => `INR ${Math.round(v)}` },
  { key: 'pending_orders', label: 'Active Orders', icon: '🔥', bg: 'rgba(255,107,53,0.1)', format: (v: number) => String(v) },
  { key: 'delivered_orders', label: 'Delivered', icon: '✔', bg: 'rgba(0,122,255,0.1)', format: (v: number) => String(v) },
  { key: 'total_customers', label: 'Customers', icon: '👥', bg: 'rgba(175,82,222,0.1)', format: (v: number) => String(v) },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PLACED:            { bg: 'rgba(255,159,28,0.15)', color: '#ff9f1c' },
  CONFIRMED:         { bg: 'rgba(52,199,89,0.15)',  color: '#34c759' },
  PREPARING:         { bg: 'rgba(0,122,255,0.15)',  color: '#007aff' },
  READY_FOR_PICKUP:  { bg: 'rgba(175,82,222,0.15)', color: '#af52de' },
  OUT_FOR_DELIVERY:  { bg: 'rgba(255,159,28,0.15)', color: '#ff9f1c' },
  DELIVERED:         { bg: 'rgba(52,199,89,0.15)',  color: '#34c759' },
  CANCELLED:         { bg: 'rgba(255,59,48,0.15)',  color: '#ff3b30' },
};

const NEXT_STEPS: Record<string, { label: string; status: string; style: React.CSSProperties } | null> = {
  PLACED:           { label: 'Confirm Order',   status: 'CONFIRMED',        style: { background: 'rgba(52,199,89,0.15)', color: '#34c759', border: '1px solid rgba(52,199,89,0.3)' } },
  CONFIRMED:        { label: 'Start Preparing', status: 'PREPARING',        style: { background: 'rgba(0,122,255,0.15)', color: '#007aff', border: '1px solid rgba(0,122,255,0.3)' } },
  PREPARING:        { label: 'Ready for Pickup',status: 'READY_FOR_PICKUP', style: { background: 'rgba(175,82,222,0.15)', color: '#af52de', border: '1px solid rgba(175,82,222,0.3)' } },
  READY_FOR_PICKUP: null,
  OUT_FOR_DELIVERY: null,
  DELIVERED:        null,
  CANCELLED:        null,
};

const emptyForm = { name: '', description: '', category: '', price: 0, is_veg: false, is_available: true };

export default function Dashboard() {
  const { user } = useAuth();
  const userRole = user?.role as string | undefined;
  const isSuperAdmin = userRole === 'superadmin';
  const isAdmin = userRole === 'restaurant_admin';

  const [activeTab, setActiveTab] = useState<'ORDERS' | 'MENU' | 'PARTNERS'>('ORDERS');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  // Menu management state
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);

  // Partners management state
  const [partners, setPartners] = useState<any[]>([]);
  const [partnerRestaurants, setPartnerRestaurants] = useState<any[]>([]);
  const [partnerForm, setPartnerForm] = useState({ owner_id: '', name: '', cuisine: '', address: '', phone: '' });

  const fetchStats = () => {
    dashboardApi.stats().then((data: any) => setStats(data)).catch(console.error);
  };

  const fetchMenu = async () => {
    if (!restaurant) return;
    setMenuLoading(true);
    const items: any = await menuApi.getMenu(restaurant.id);
    setMenuItems(items);
    setMenuLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isSuperAdmin || isAdmin) fetchStats();
  }, [user]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isAdmin) return;
    restaurantApi.myRestaurants().then((data: any) => {
      if (data && data.length > 0) setRestaurant(data[0]);
    }).catch(console.error);
  }, [user]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (restaurant) fetchMenu();
  }, [restaurant]);

  const fetchPartners = async () => {
    try {
      const users: any = await authApi.users('restaurant_admin');
      const rests: any = await restaurantApi.list();
      setPartners(users);
      setPartnerRestaurants(rests);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'PARTNERS') fetchPartners();
  }, [activeTab]);

  const handleCreatePartnerRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await restaurantApi.adminCreate(partnerForm);
      setPartnerForm({ owner_id: '', name: '', cuisine: '', address: '', phone: '' });
      fetchPartners();
      alert('Restaurant successfully created!');
    } catch (err: any) {
      alert(err.message || 'Failed to create restaurant');
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      await orderApi.updateStatus(orderId, newStatus);
      fetchStats();
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  const handleSaveItem = async () => {
    if (!restaurant) return;
    try {
      if (editingId) {
        await menuApi.update(editingId, form);
      } else {
        await menuApi.create(restaurant.id, form);
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      fetchMenu();
    } catch (err: any) {
      alert('Failed to save item');
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setForm({
      name: item.name,
      description: item.description || '',
      category: item.category,
      price: item.price,
      is_veg: item.is_veg,
      is_available: item.is_available,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Delete this item?')) return;
    await menuApi.delete(id);
    fetchMenu();
  };

  if (!user || (!isSuperAdmin && !isAdmin)) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Access Denied</h2>
        <p style={{ color: 'var(--text-400)', marginTop: 8 }}>This page is for restaurant admins and superadmins only.</p>
      </div>
    );
  }

  return (
    <div style={s.page} className="animate-fadeIn">
      {/* Superadmin banner */}
      {isSuperAdmin && (
        <div style={s.superBanner}>
          <span style={{ fontSize: 24 }}>👑</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Superadmin — Global Platform View</div>
            <div style={{ fontSize: 13, color: 'var(--text-400)' }}>You are viewing aggregated stats and orders across ALL restaurants.</div>
          </div>
        </div>
      )}

      <div style={s.header}>
        <h1 style={s.title}>{isSuperAdmin ? 'Platform Dashboard' : `${restaurant?.name || 'Restaurant'} Dashboard`}</h1>
        <p style={s.subtitle}>{isSuperAdmin ? 'Monitor all restaurants and orders' : `Manage your restaurant's orders and menu — only your data is visible here.`}</p>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button style={{ ...s.tab, ...(activeTab === 'ORDERS' ? s.tabActive : s.tabInactive) }} onClick={() => setActiveTab('ORDERS')}>
          📋 Orders & Stats
        </button>
        {isAdmin && (
          <button style={{ ...s.tab, ...(activeTab === 'MENU' ? s.tabActive : s.tabInactive) }} onClick={() => setActiveTab('MENU')}>
            🍽️ Menu Manager
          </button>
        )}
        {isSuperAdmin && (
          <button style={{ ...s.tab, ...(activeTab === 'PARTNERS' ? s.tabActive : s.tabInactive) }} onClick={() => setActiveTab('PARTNERS')}>
            🤝 Manage Partners
          </button>
        )}
      </div>

      {/* ─── STATS ─── */}
      {(!isAdmin || activeTab === 'ORDERS') && (
        <>
          <div style={s.statsGrid}>
            {STAT_CONFIGS.map((cfg, idx) => (
              <div key={cfg.key} style={s.statCard} className={`animate-fadeInUp stagger-${idx + 1}`}>
                <div style={{ ...s.statIcon, background: cfg.bg }}>{cfg.icon}</div>
                <div>
                  <div style={s.statLabel}>{cfg.label}</div>
                  <div style={s.statValue}>{stats ? cfg.format((stats as any)[cfg.key]) : '—'}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ─── ORDERS TABLE ─── */}
          <div style={s.tableWrap}>
            <div style={s.tableHeader}>
              <span>Incoming Orders</span>
              <span style={{ fontSize: 13, color: 'var(--text-400)', fontWeight: 400 }}>
                {isSuperAdmin ? 'All restaurants' : 'Your restaurant only'}
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Order</th>
                    {isSuperAdmin && <th style={s.th}>Restaurant</th>}
                    <th style={s.th}>Items</th>
                    <th style={s.th}>Total</th>
                    <th style={s.th}>Payment</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {!stats ? (
                    <tr><td colSpan={7} style={{ ...s.td, textAlign: 'center', padding: 40, color: 'var(--text-400)' }}>Loading...</td></tr>
                  ) : stats.recent_orders.length === 0 ? (
                    <tr><td colSpan={7} style={{ ...s.td, textAlign: 'center', padding: 40, color: 'var(--text-400)' }}>No orders yet</td></tr>
                  ) : (
                    stats.recent_orders.map(order => {
                      const badge = STATUS_COLORS[order.status] || STATUS_COLORS.PLACED;
                      const next = NEXT_STEPS[order.status];
                      return (
                        <tr key={order.id}
                          onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-700)'; }}
                          onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                          <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>
                            #{order.id.slice(0, 8).toUpperCase()}
                          </td>
                          {isSuperAdmin && (
                            <td style={{ ...s.td, fontSize: 13 }}>{(order as any).restaurant_name || order.restaurant_id?.slice(0, 8)}</td>
                          )}
                          <td style={s.td}>{order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
                          <td style={{ ...s.td, fontWeight: 800 }}>INR {order.total_amount.toFixed(0)}</td>
                          <td style={s.td}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: order.payment?.status === 'PAID' ? 'var(--success)' : 'var(--text-400)' }}>
                              {order.payment ? `${order.payment.method} · ${order.payment.status}` : '—'}
                            </span>
                          </td>
                          <td style={s.td}>
                            <span style={{ ...s.statusBadge, background: badge.bg, color: badge.color }}>
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={s.td}>
                            {next ? (
                              <button
                                style={{ ...s.actionBtn, ...next.style, opacity: updating === order.id ? 0.5 : 1 }}
                                disabled={updating === order.id}
                                onClick={() => handleStatusChange(order.id, next.status)}
                              >
                                {updating === order.id ? '...' : next.label}
                              </button>
                            ) : (
                              <span style={{ fontSize: 12, color: 'var(--text-400)' }}>
                                {order.status === 'OUT_FOR_DELIVERY' ? 'With agent' :
                                 order.status === 'DELIVERED' ? 'Completed' : '—'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── MENU MANAGER (Admin only) ─── */}
      {isAdmin && activeTab === 'MENU' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{restaurant?.name} — Menu Items</h2>
              <p style={{ fontSize: 13, color: 'var(--text-400)' }}>Add, edit prices, or remove items from your menu</p>
            </div>
            <button style={s.btnPrimary} onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); }}>
              {showForm ? 'Cancel' : '+ Add Item'}
            </button>
          </div>

          {showForm && (
            <div style={s.form}>
              <h3 style={{ marginBottom: 20, fontWeight: 700 }}>{editingId ? 'Edit Item' : 'New Menu Item'}</h3>
              <div style={s.formGrid}>
                <div style={s.inputGroup}>
                  <label style={s.label}>Item Name *</label>
                  <input style={s.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Butter Chicken" />
                </div>
                <div style={s.inputGroup}>
                  <label style={s.label}>Category *</label>
                  <input style={s.input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Main Course" />
                </div>
                <div style={s.inputGroup}>
                  <label style={s.label}>Price (INR) *</label>
                  <input style={s.input} type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })} />
                </div>
                <div style={s.inputGroup}>
                  <label style={s.label}>Description</label>
                  <input style={s.input} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_veg} onChange={e => setForm({ ...form, is_veg: e.target.checked })} />
                  <span style={{ fontSize: 14, color: 'var(--success)', fontWeight: 600 }}>Vegetarian</span>
                </label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_available} onChange={e => setForm({ ...form, is_available: e.target.checked })} />
                  <span style={{ fontSize: 14, color: 'var(--text-200)', fontWeight: 600 }}>Available</span>
                </label>
              </div>
              <button style={s.btnPrimary} onClick={handleSaveItem}>{editingId ? 'Save Changes' : 'Add Item'}</button>
            </div>
          )}

          <div style={s.tableWrap}>
            {menuLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-400)' }}>Loading menu...</div>
            ) : menuItems.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-400)' }}>No items yet. Add your first menu item!</div>
            ) : (
              menuItems.map(item => (
                <div key={item.id} style={s.menuItemRow}
                  onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-700)'; }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: 2,
                    border: `2px solid ${item.is_veg ? 'var(--success)' : 'var(--danger)'}`,
                    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: item.is_veg ? 'var(--success)' : 'var(--danger)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-400)' }}>{item.category}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', minWidth: 80 }}>INR {item.price}</div>
                  <div style={{ fontSize: 12, color: item.is_available ? 'var(--success)' : 'var(--danger)', minWidth: 70, fontWeight: 600 }}>
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ ...s.actionBtn, ...s.btnBlue }} onClick={() => handleEditItem(item)}>Edit</button>
                    <button style={{ ...s.actionBtn, background: 'transparent', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)' }} onClick={() => handleDeleteItem(item.id)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── PARTNERS (SUPERADMIN ONLY) ─── */}
      {activeTab === 'PARTNERS' && (
        <div style={{ marginTop: 24 }} className="animate-fadeIn">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>Restaurant Partners</h2>
              <p style={{ fontSize: 13, color: 'var(--text-400)' }}>Manage restaurant admins and assign them to restaurants.</p>
            </div>
          </div>
          
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Admin Name</th>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>Restaurant</th>
                  <th style={s.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {partners.map(p => {
                  const owned = partnerRestaurants.find(r => r.owner_id === p.id);
                  const isAssigning = partnerForm.owner_id === p.id;
                  
                  return (
                    <React.Fragment key={p.id}>
                      <tr onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-700)'; }}
                          onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                        <td style={{ ...s.td, fontWeight: 600 }}>{p.name}</td>
                        <td style={s.td}>{p.email}</td>
                        <td style={s.td}>
                          {owned ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>{owned.name}</span> : <span style={{ color: 'var(--text-400)' }}>Unassigned</span>}
                        </td>
                        <td style={s.td}>
                          {!owned && (
                            <button style={{ ...s.actionBtn, ...(isAssigning ? {} : s.btnBlue) }} 
                                    onClick={() => setPartnerForm({ ...partnerForm, owner_id: isAssigning ? '' : p.id })}>
                              {isAssigning ? 'Cancel' : 'Create Restaurant'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {isAssigning && (
                        <tr>
                          <td colSpan={4} style={{ padding: 0 }}>
                            <div style={{ background: 'var(--bg-800)', padding: 24, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                              <h4 style={{ marginBottom: 16, color: 'var(--text-200)' }}>Create Restaurant for {p.name}</h4>
                              <form onSubmit={handleCreatePartnerRestaurant} style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
                                <input style={s.input} placeholder="Restaurant Name *" required value={partnerForm.name} onChange={e => setPartnerForm({...partnerForm, name: e.target.value})} />
                                <input style={s.input} placeholder="Cuisine *" required value={partnerForm.cuisine} onChange={e => setPartnerForm({...partnerForm, cuisine: e.target.value})} />
                                <input style={s.input} placeholder="Address *" required value={partnerForm.address} onChange={e => setPartnerForm({...partnerForm, address: e.target.value})} />
                                <input style={s.input} placeholder="Phone" value={partnerForm.phone} onChange={e => setPartnerForm({...partnerForm, phone: e.target.value})} />
                                <div style={{ gridColumn: 'span 2' }}>
                                  <button type="submit" style={s.btnPrimary}>Confirm Creation</button>
                                </div>
                              </form>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
