import { useEffect, useState } from 'react';
import { IdleManager } from '../utils/IdleManager';

interface Props {
  to: number;
  duration?: number;
  format?: 'plain' | 'big';
  prefix?: string;
  suffix?: string;
}

export function CountUp({ to, duration = 900, format = 'big', prefix = '', suffix = '' }: Props) {
  const [n, setN] = useState(0);

  useEffect(() => {
    setN(0);
    let raf: number;
    const start = performance.now();
    const step = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.floor(to * eased));
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setN(to);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);

  const text = format === 'big' ? IdleManager.formatBigNumber(n) : n.toLocaleString();
  return <>{prefix}{text}{suffix}</>;
}
