interface DotGridProps {
  a: number;
  b: number;
  size?: number;
  color?: string;
}

export function DotGrid({ a, b, size = 14, color = '#6366f1' }: DotGridProps) {
  if (a < 1 || b < 1 || a > 9 || b > 9) return null;
  const gap = 3;
  const width = b * size + (b - 1) * gap;
  const height = a * size + (a - 1) * gap;
  const dots = [];
  for (let r = 0; r < a; r++) {
    for (let c = 0; c < b; c++) {
      dots.push(
        <circle
          key={`${r}-${c}`}
          cx={c * (size + gap) + size / 2}
          cy={r * (size + gap) + size / 2}
          r={size / 2}
          fill={color}
          fillOpacity={0.85}
        />
      );
    }
  }
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${a}行 ${b}列 のドットの図 (${a * b}個)`}
    >
      {dots}
    </svg>
  );
}
