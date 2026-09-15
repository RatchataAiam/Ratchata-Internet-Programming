import React, { createContext, useContext, useMemo, useState } from 'react';

export type CartItem = {
  key: string;
  item_type: 'Product' | 'Cat';
  product_id?: number;
  cat_id?: number;
  name: string;
  price: number;
  image_url?: string | null;
  quantity: number;
  stock_quantity?: number;
};

type CartContextType = {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: Omit<CartItem, 'key'>) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: Omit<CartItem, 'key'>) => {
    const key = item.item_type === 'Cat' ? `cat-${item.cat_id}` : `product-${item.product_id}`;

    setItems(current => {
      const existing = current.find(x => x.key === key);
      if (!existing) {
        return [...current, { ...item, key, quantity: item.item_type === 'Cat' ? 1 : Math.max(1, item.quantity) }];
      }

      if (item.item_type === 'Cat') return current;

      const max = Math.max(0, Number(item.stock_quantity ?? existing.stock_quantity ?? 999999));
      const next = Math.min(existing.quantity + Math.max(1, item.quantity), max || existing.quantity + Math.max(1, item.quantity));
      return current.map(x => x.key === key ? { ...x, quantity: next, stock_quantity: item.stock_quantity ?? x.stock_quantity } : x);
    });
  };

  const removeItem = (key: string) => setItems(current => current.filter(x => x.key !== key));

  const setQuantity = (key: string, quantity: number) => {
    setItems(current => current.map(item => {
      if (item.key !== key) return item;
      const max = item.item_type === 'Product' ? Number(item.stock_quantity ?? 999999) : 1;
      return { ...item, quantity: Math.max(1, Math.min(quantity, max || 1)) };
    }));
  };

  const clearCart = () => setItems([]);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  return <CartContext.Provider value={useMemo(() => ({ items, count, total, addItem, removeItem, setQuantity, clearCart }), [items, count, total])}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart outside CartProvider');
  return context;
};
