import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import AuthModal from './AuthModal';

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 72,
    background: 'rgba(15, 15, 19, 0.88)', backdropFilter: 'blur(24px)',
    borderBottom: '1px solid var(--glass-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 32px',
  },
  brand: {
    fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px',
    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  links: { display: 'flex', gap: 28, alignItems: 'center' },
  link: {
    color: 'var(--text-300)', fontWeight: 600, fontSize: 14,
    transition: 'var(--transition)', letterSpacing: '0.2px',
  },
  linkActive: {
    color: 'var(--primary)', fontWeight: 600, fontSize: 14, letterSpacing: '0.2px',
  },
  right: { display: 'flex', alignItems: 'center', gap: 16 },
  cartBtn: {
    position: 'relative' as const, display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--bg-700)', border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-full)', padding: '8px 18px',
    color: 'var(--text-200)', fontWeight: 600, fontSize: 14, transition: 'var(--transition)',
  },
  badge: {
    position: 'absolute' as const, top: -4, right: -4,
    background: 'var(--primary)', color: '#fff',
    fontSize: 11, fontWeight: 800, minWidth: 20, height: 20,
    borderRadius: 'var(--radius-full)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  userPill: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--bg-700)', border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-full)', padding: '6px 16px 6px 6px',
  },
  avatar: {
    width: 30, height: 30, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: 13,
  },
  loginBtn: {
    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
    color: '#fff', fontWeight: 700, fontSize: 14,
    padding: '10px 24px', borderRadius: 'var(--radius-full)',
    boxShadow: '0 4px 16px rgba(255, 107, 53, 0.3)',
    transition: 'var(--transition)',
  },
  logoutBtn: {
    color: 'var(--text-400)', fontSize: 13, fontWeight: 600,
    transition: 'var(--transition)',
  },
};

export default function Navbar() {
  const { user, logout, isAuthModalOpen, openAuthModal } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const userRole = user?.role as string | undefined;
  const isAdminOrSuper = userRole === 'restaurant_admin' || userRole === 'superadmin';
  const isSuperAdminUser = userRole === 'superadmin';
  const isDeliveryAgent = userRole === 'delivery_agent';
  const isCustomer = !userRole || userRole === 'customer';

  return (
    <>
      <nav style={styles.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
          <Link to="/" style={styles.brand}>🍔 FoodRush</Link>
          <div style={styles.links}>
            <Link to="/" style={isActive('/') ? styles.linkActive : styles.link}>Home</Link>
            {isCustomer && (
              <Link to="/orders" style={isActive('/orders') ? styles.linkActive : styles.link}>My Orders</Link>
            )}
            {isAdminOrSuper && (
              <Link to="/dashboard" style={isActive('/dashboard') ? styles.linkActive : styles.link}>
                {isSuperAdminUser ? 'Platform Dashboard' : 'Dashboard'}
              </Link>
            )}
            {isDeliveryAgent && (
              <Link to="/agent-dashboard" style={isActive('/agent-dashboard') ? styles.linkActive : styles.link}>Agent Dashboard</Link>
            )}
          </div>
        </div>

        <div style={styles.right}>
          {isCustomer && (
            <button style={styles.cartBtn} onClick={() => navigate('/cart')}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--glass-border)'; }}>
              🛒 Cart
              {itemCount > 0 && <span style={styles.badge}>{itemCount}</span>}
            </button>
          )}

          {user ? (
            <div style={styles.userPill}>
              <div style={styles.avatar}>{user.name.charAt(0).toUpperCase()}</div>
              <span style={{ color: 'var(--text-200)', fontWeight: 600, fontSize: 14 }}>{user.name.split(' ')[0]}</span>
              <button style={styles.logoutBtn} onClick={logout}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-400)'; }}>
                Logout
              </button>
            </div>
          ) : (
            <button style={styles.loginBtn} onClick={() => openAuthModal('login')}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      {isAuthModalOpen && <AuthModal />}
    </>
  );
}
