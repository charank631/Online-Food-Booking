import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderApi } from '../services/api';

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px' },
  title: { fontSize: 32, fontWeight: 800, marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'var(--text-400)', marginBottom: 40 },
  restaurantBanner: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '16px 20px', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-700)', border: '1px solid var(--border)',
    marginBottom: 28, fontSize: 14,
  },
  itemRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '18px 0', borderBottom: '1px solid var(--border)',
  },
  itemName: { fontWeight: 600, fontSize: 15, color: 'var(--text-100)' },
  itemSub: { fontSize: 13, color: 'var(--text-400)', marginTop: 2 },
  qtyCtrl: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--bg-700)', borderRadius: 'var(--radius-md)',
    padding: '4px 6px', border: '1px solid var(--border)',
  },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 'var(--radius-sm)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-600)', color: 'var(--text-200)',
    fontWeight: 700, fontSize: 15, cursor: 'pointer',
  },
  removeBtn: {
    color: 'var(--danger)', fontSize: 12, fontWeight: 600,
    marginLeft: 12, cursor: 'pointer',
  },
  summary: {
    marginTop: 32, padding: 28, borderRadius: 'var(--radius-lg)',
    background: 'var(--bg-800)', border: '1px solid var(--glass-border)',
  },
  summaryRow: {
    display: 'flex', justifyContent: 'space-between', marginBottom: 12,
    fontSize: 15, color: 'var(--text-300)',
  },
  total: {
    display: 'flex', justifyContent: 'space-between',
    paddingTop: 16, borderTop: '1px solid var(--border)',
    fontSize: 22, fontWeight: 800, color: 'var(--text-100)',
  },
  input: {
    width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-700)', border: '1px solid var(--border)',
    color: 'var(--text-100)', fontSize: 14, outline: 'none', marginBottom: 14,
  },
  select: {
    width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-700)', border: '1px solid var(--border)',
    color: 'var(--text-100)', fontSize: 14, outline: 'none', marginBottom: 14,
  },
  placeBtn: {
    width: '100%', padding: '16px', borderRadius: 'var(--radius-md)',
    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
    color: '#fff', fontWeight: 800, fontSize: 16, marginTop: 16,
    boxShadow: '0 4px 20px rgba(255,107,53,0.3)', transition: 'var(--transition)',
  },
  empty: {
    textAlign: 'center' as const, padding: 80, color: 'var(--text-400)',
  },
  clearBtn: {
    color: 'var(--danger)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    marginLeft: 12,
  },
};

export default function Cart() {
  const { items, total, changeQty, removeItem, clearCart, restaurantId, restaurantName } = useCart();
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(user?.address || '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CARD');

  // Only customers can access cart
  const userRole = user?.role as string | undefined;
  React.useEffect(() => {
    if (user && userRole !== 'customer') {
      navigate('/', { replace: true });
    }
  }, [user, userRole, navigate]);

  const handlePlaceOrder = async () => {
    if (!user) { 
      openAuthModal('login');
      return;
    }
    if (!restaurantId || items.length === 0) return;
    if (!address.trim()) { alert('Please enter a delivery address'); return; }

    setLoading(true);
    try {
      const order: any = await orderApi.place({
        restaurant_id: restaurantId,
        items: items.map(i => ({ menu_item_id: i.menuItem.id, quantity: i.quantity })),
        delivery_address: address,
        special_notes: notes || undefined,
        payment_method: paymentMethod,
      });
      clearCart();
      navigate(`/track/${order.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div style={s.empty}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: 'var(--text-200)' }}>Your cart is empty</h2>
        <p style={{ marginBottom: 24 }}>Add some delicious items from our restaurants</p>
        <button onClick={() => navigate('/')} style={{
          padding: '12px 32px', borderRadius: 'var(--radius-full)',
          background: 'var(--primary)', color: '#fff', fontWeight: 700,
        }}>
          Browse Restaurants
        </button>
      </div>
    );
  }

  const deliveryFee = 40;
  const taxes = Math.round(total * 0.05 * 100) / 100;
  const grandTotal = total + deliveryFee + taxes;

  return (
    <div style={s.page}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={s.title}>Your Cart</h1>
          <p style={s.subtitle}>{items.length} item{items.length !== 1 ? 's' : ''} from {restaurantName}</p>
        </div>
        <button style={s.clearBtn} onClick={clearCart}>Clear Cart</button>
      </div>

      <div style={s.restaurantBanner}>
        <span style={{ fontSize: 20 }}>🍽️</span>
        <span style={{ fontWeight: 600, color: 'var(--text-200)' }}>{restaurantName}</span>
      </div>

      {items.map(item => (
        <div key={item.menuItem.id} style={s.itemRow}>
          <div>
            <div style={s.itemName}>{item.menuItem.name}</div>
            <div style={s.itemSub}>₹{item.menuItem.price.toFixed(0)} × {item.quantity} = ₹{(item.menuItem.price * item.quantity).toFixed(0)}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={s.qtyCtrl}>
              <button style={s.qtyBtn} onClick={() => changeQty(item.menuItem.id, -1)}>−</button>
              <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
              <button style={s.qtyBtn} onClick={() => changeQty(item.menuItem.id, 1)}>+</button>
            </div>
            <button style={s.removeBtn} onClick={() => removeItem(item.menuItem.id)}>Remove</button>
          </div>
        </div>
      ))}

      <div style={s.summary}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Order Summary</h3>
        
        <label style={{ display: 'block', fontSize: 13, color: 'var(--text-400)', marginBottom: 6 }}>
          Delivery Address *
        </label>
        <textarea style={{ ...s.input, minHeight: 60, resize: 'vertical' as const }} value={address}
          onChange={e => setAddress(e.target.value)} placeholder="Enter your delivery address"
          onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />

        <label style={{ display: 'block', fontSize: 13, color: 'var(--text-400)', marginBottom: 6 }}>
          Special Notes (optional)
        </label>
        <input style={s.input} value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="e.g. Extra spicy, no onions"
          onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />

        <label style={{ display: 'block', fontSize: 13, color: 'var(--text-400)', marginBottom: 6 }}>
          Payment Method
        </label>
        <select style={s.select} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
          <option value="CARD">💳 Credit / Debit Card</option>
          <option value="UPI">📱 UPI / GPay</option>
          <option value="CASH">💵 Cash on Delivery</option>
          <option value="WALLET">👛 Wallet</option>
        </select>

        <div style={{ marginTop: 20 }}>
          <div style={s.summaryRow}><span>Subtotal</span><span>₹{total.toFixed(0)}</span></div>
          <div style={s.summaryRow}><span>Delivery Fee</span><span>₹{deliveryFee}</span></div>
          <div style={s.summaryRow}><span>Taxes (5%)</span><span>₹{taxes.toFixed(0)}</span></div>
          <div style={s.total}><span>Total</span><span>₹{grandTotal.toFixed(0)}</span></div>
        </div>

        <button style={{ ...s.placeBtn, opacity: loading ? 0.6 : 1 }} disabled={loading}
          onClick={handlePlaceOrder}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
          onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
          {loading ? 'Placing Order…' : `Place Order — ₹${grandTotal.toFixed(0)}`}
        </button>
      </div>
    </div>
  );
}
