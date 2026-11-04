'use client';
/* Site-wide state: the cart (remembered between visits) and whether the Index is open. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type CartLine = { id: string; title: string; size: string; paper: string; frame: string; price: number; image: string };

type CartCtx = { lines: CartLine[]; count: number; add: (line: CartLine) => void; clear: () => void };
type IndexCtx = { open: boolean; setOpen: (open: boolean) => void };

const Cart = createContext<CartCtx | null>(null);
const IndexPanel = createContext<IndexCtx | null>(null);
const KEY = 'ec-cart';

export function Providers({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpenState] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setLines(JSON.parse(raw)); } catch { /* private mode */ }
  }, []);
  const persist = (next: CartLine[]) => { try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ } };

  const add = useCallback((line: CartLine) => setLines((prev) => { const next = [...prev, line]; persist(next); return next; }), []);
  const clear = useCallback(() => { setLines([]); persist([]); }, []);

  const setOpen = useCallback((o: boolean) => {
    setOpenState(o);
    document.documentElement.classList.toggle('index-open', o);
  }, []);

  const cart = useMemo(() => ({ lines, count: lines.length, add, clear }), [lines, add, clear]);
  const index = useMemo(() => ({ open, setOpen }), [open, setOpen]);
  return (
    <Cart.Provider value={cart}>
      <IndexPanel.Provider value={index}>{children}</IndexPanel.Provider>
    </Cart.Provider>
  );
}

export function useCart() {
  const c = useContext(Cart);
  if (!c) throw new Error('useCart outside <Providers>');
  return c;
}
export function useIndexPanel() {
  const c = useContext(IndexPanel);
  if (!c) throw new Error('useIndexPanel outside <Providers>');
  return c;
}
