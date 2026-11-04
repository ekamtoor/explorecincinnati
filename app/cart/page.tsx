import type { Metadata } from 'next';
import '@/components/works/works.css';
import CartView from '@/components/works/CartView';

export const metadata: Metadata = {
  title: 'Cart',
  description: 'Your prints.',
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return <CartView />;
}
