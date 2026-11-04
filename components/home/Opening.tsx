'use client';
/* Opening sequence: the newest photographs, crossfading slowly under the title. */
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { pad } from '@/lib/format';
import s from './home.module.css';

export type Slide = { id: string; no: number; title: string; place: string; image: string; alt: string; story: string };

const DUR = 7000;

export default function Opening({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [cycle, setCycle] = useState(0); // restarts the tick progress animation
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => { setReduce(window.matchMedia('(prefers-reduced-motion: reduce)').matches); }, []);

  const go = useCallback((n: number) => {
    setI((n + slides.length) % slides.length);
    setCycle((c) => c + 1);
  }, [slides.length]);

  useEffect(() => {
    window.clearTimeout(timer.current);
    if (paused || reduce || slides.length < 2) return;
    timer.current = window.setTimeout(() => go(i + 1), DUR);
    return () => window.clearTimeout(timer.current);
  }, [i, cycle, paused, reduce, go, slides.length]);

  useEffect(() => {
    const onVis = () => { if (document.hidden) window.clearTimeout(timer.current); else setCycle((c) => c + 1); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const cur = slides[i];
  return (
    <section
      className={`${s.opening}${paused ? ` ${s.paused}` : ''}`}
      aria-label="Recent photographs"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); setCycle((c) => c + 1); }}
    >
      <div className={s.slides}>
        {slides.map((p, k) => (
          <figure key={p.id} className={`${s.slide}${k === i ? ` ${s.on}` : ''}`} aria-hidden={k !== i}>
            <Image src={p.image} alt={p.alt} fill sizes="100vw" priority={k === 0} />
          </figure>
        ))}
      </div>
      <div className={`wrap ${s.inner}`}>
        <div className={s.grid}>
          <h1 className={s.title}>
            <span className={s.line}><span>Cincinnati,</span></span>
            <span className={s.line}><span><em>on view.</em></span></span>
          </h1>
          <div className={s.side}>
            <p className={s.now} aria-live="polite">
              <span className="num">No. {pad(cur.no)}</span>
              <Link className={s.nowTitle} href={cur.story}>{cur.title}</Link>
              <span>{cur.place}</span>
            </p>
            <div className={s.ticks} role="group" aria-label="Choose a photograph">
              {slides.map((p, k) => (
                <button
                  key={k === i ? `${p.id}-${cycle}` : p.id}
                  type="button"
                  className={`${s.tick}${k === i ? ` ${s.on}` : ''}`}
                  aria-label={`Show No. ${pad(p.no)}`}
                  aria-pressed={k === i}
                  style={{ ['--dur' as string]: reduce ? '0s' : `${DUR}ms` }}
                  onClick={() => go(k)}
                >
                  {pad(k + 1)}<span />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <span className={s.cue} aria-hidden="true" />
    </section>
  );
}
