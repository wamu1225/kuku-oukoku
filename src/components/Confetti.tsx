import { useMemo } from 'react';

interface Props {
  /** 表示する紙吹雪の枚数（パフォーマンスのため 60 が上限目安） */
  count?: number;
}

const COLORS = ['#fbbf24', '#f59e0b', '#ef4444', '#3b82f6', '#22c55e', '#a78bfa', '#ec4899'];
const SHAPES = ['▮', '●', '★', '◆'];

/**
 * CSS のみで動く紙吹雪。result-screen の大記録時にだけ表示。
 * prefers-reduced-motion でフェードのみに退避。
 */
export function Confetti({ count = 50 }: Props) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        key: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.2,
        color: COLORS[i % COLORS.length],
        shape: SHAPES[i % SHAPES.length],
        size: 14 + Math.floor(Math.random() * 10),
        rotate: Math.floor(Math.random() * 360),
      })),
    [count]
  );

  return (
    <div className="confetti-root" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.key}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            color: p.color,
            fontSize: p.size,
            transform: `rotate(${p.rotate}deg)`,
          }}
        >
          {p.shape}
        </span>
      ))}
    </div>
  );
}
