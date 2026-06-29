import React from 'react';

const s: Record<string, React.CSSProperties> = {
  footer: {
    borderTop: '1px solid var(--glass-border)', padding: '36px 32px',
    display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
    alignItems: 'center', gap: 16,
    background: 'var(--bg-800)',
  },
  brand: {
    fontSize: 18, fontWeight: 800,
    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  right: { fontSize: 13, color: 'var(--text-400)' },
};

export default function Footer() {
  return (
    <footer style={s.footer}>
      <div>
        <span style={s.brand}>🍔 FoodRush</span>
        <p style={{ fontSize: 12, color: 'var(--text-400)', marginTop: 4 }}>
          Online Food Order Processing System
        </p>
      </div>
      <div style={s.right}>
        Built for Waffor Take-Home Assessment · © 2026
      </div>
    </footer>
  );
}
