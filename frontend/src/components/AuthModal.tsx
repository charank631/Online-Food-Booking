import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    animation: 'fadeIn 0.25s ease-out',
  },
  modal: {
    width: '100%', maxWidth: 440, borderRadius: 'var(--radius-xl)',
    background: 'var(--bg-800)', border: '1px solid var(--glass-border)',
    padding: 36, position: 'relative', boxShadow: 'var(--shadow-lg)',
    animation: 'fadeInUp 0.35s ease-out',
  },
  closeBtn: {
    position: 'absolute' as const, top: 16, right: 16,
    color: 'var(--text-400)', fontSize: 22, fontWeight: 400, lineHeight: 1,
  },
  title: { fontSize: 26, fontWeight: 800, marginBottom: 6, color: 'var(--text-100)' },
  subtitle: { fontSize: 14, color: 'var(--text-400)', marginBottom: 28 },
  input: {
    width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-700)', border: '1px solid var(--border)',
    color: 'var(--text-100)', fontSize: 14, outline: 'none',
    transition: 'var(--transition)', marginBottom: 14,
  },
  btn: {
    width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
    color: '#fff', fontWeight: 700, fontSize: 15, marginTop: 8,
    boxShadow: '0 4px 20px rgba(255,107,53,0.3)', transition: 'var(--transition)',
  },
  error: {
    background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.3)',
    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
    color: '#ff6b6b', fontSize: 13, marginBottom: 16,
  },
  toggle: { textAlign: 'center' as const, marginTop: 24, fontSize: 14, color: 'var(--text-400)' },
  toggleLink: { color: 'var(--primary)', fontWeight: 700, marginLeft: 4, cursor: 'pointer' },
  demo: {
    marginTop: 20, padding: '14px 16px', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-700)', border: '1px solid var(--border)',
    fontSize: 12, color: 'var(--text-400)', lineHeight: 1.8,
  },
  roleSelect: {
    width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-700)', border: '1px solid var(--border)',
    color: 'var(--text-100)', fontSize: 14, outline: 'none', marginBottom: 14,
  },
};

export default function AuthModal() {
  const { login, register, closeAuthModal, authModalMode } = useAuth();
  const [isLogin, setIsLogin] = useState(authModalMode === 'login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('priya@example.com');
  const [password, setPassword] = useState('customer123');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<'customer' | 'restaurant_admin' | 'delivery_agent'>('customer');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({ name, email, password, phone, address, role });
      }
      closeAuthModal();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.overlay} onClick={closeAuthModal}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <button style={s.closeBtn} onClick={closeAuthModal}>✕</button>
        <h2 style={s.title}>{isLogin ? 'Welcome back' : 'Create account'}</h2>
        <p style={s.subtitle}>{isLogin ? 'Sign in to your FoodRush account' : 'Join FoodRush today'}</p>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input style={s.input} placeholder="Full Name" value={name}
                onChange={e => setName(e.target.value)} required
                onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
              <select style={s.roleSelect} value={role} onChange={e => setRole(e.target.value as any)}>
                <option value="customer">👤 Customer</option>
                <option value="restaurant_admin">🍽️ Restaurant Admin</option>
                <option value="delivery_agent">🚴 Delivery Agent</option>
              </select>
            </>
          )}
          <input style={s.input} type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required
            onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
          <input style={s.input} type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required
            onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
          {!isLogin && (
            <>
              <input style={s.input} type="tel" placeholder="Phone Number" value={phone}
                onChange={e => setPhone(e.target.value)}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
              <textarea style={{ ...s.input, minHeight: 60, resize: 'vertical' as const }} 
                placeholder="Delivery Address" value={address}
                onChange={e => setAddress(e.target.value)}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
            </>
          )}
          <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} disabled={loading} type="submit">
            {loading ? 'Please wait…' : (isLogin ? 'Sign In →' : 'Create Account →')}
          </button>
        </form>

        <div style={s.toggle}>
          {isLogin ? "Don't have an account?" : "Already have one?"}
          <span style={s.toggleLink} onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </span>
        </div>

        {isLogin && (
          <div style={s.demo}>
            <strong style={{ color: 'var(--text-300)' }}>Demo Logins:</strong><br/>
            👤 Customer: <span style={{color:'var(--primary)'}}>priya@example.com</span> / customer123<br/>
            🍽️ Admin: <span style={{color:'var(--primary)'}}>admin@foodrush.com</span> / admin123<br/>
            🚴 Agent: <span style={{color:'var(--primary)'}}>ravi@delivery.com</span> / delivery123
          </div>
        )}
      </div>
    </div>
  );
}
