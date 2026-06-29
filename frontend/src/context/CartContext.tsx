import React, { createContext, useContext, useState, useCallback } from 'react';
import { CartItem, MenuItem } from '../types';

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string;
  addItem: (item: MenuItem, restaurantId: string, restaurantName: string) => void;
  removeItem: (itemId: string) => void;
  changeQty: (itemId: string, delta: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState('');

  const addItem = useCallback(
    (menuItem: MenuItem, restId: string, restName: string) => {
      if (restaurantId && restaurantId !== restId) {
        const ok = window.confirm(
          `Your cart has items from "${restaurantName}". Start a new cart?`
        );
        if (!ok) return;
        setItems([]);
      }
      setRestaurantId(restId);
      setRestaurantName(restName);
      setItems(prev => {
        const existing = prev.find(i => i.menuItem.id === menuItem.id);
        if (existing) {
          return prev.map(i =>
            i.menuItem.id === menuItem.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }
        return [...prev, { menuItem, quantity: 1 }];
      });
    },
    [restaurantId, restaurantName]
  );

  const changeQty = useCallback((itemId: string, delta: number) => {
    setItems(prev => {
      const next = prev
        .map(i =>
          i.menuItem.id === itemId ? { ...i, quantity: i.quantity + delta } : i
        )
        .filter(i => i.quantity > 0);
      if (next.length === 0) {
        setRestaurantId(null);
        setRestaurantName('');
      }
      return next;
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.menuItem.id !== itemId);
      if (next.length === 0) {
        setRestaurantId(null);
        setRestaurantName('');
      }
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName('');
  }, []);

  const total = items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, restaurantId, restaurantName, addItem, removeItem, changeQty, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}
