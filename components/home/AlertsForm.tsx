'use client';
import { useState } from 'react';

export default function AlertsForm() {
  const [status, setStatus] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); setStatus('Thanks! (Sign-up isn’t connected on this test site yet.)'); }}>
      <label className="sr-only" htmlFor="nl-email">Email address</label>
      <div className="field-line">
        <input id="nl-email" type="email" placeholder="you@email.com" autoComplete="email" required />
        <button className="btn" type="submit">Subscribe</button>
      </div>
      <p className="meta" role="status">{status}</p>
    </form>
  );
}
