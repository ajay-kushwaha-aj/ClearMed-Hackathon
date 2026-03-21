'use client';

interface RadarPoint { label: string; value: number; max: number }

interface RadarChartProps {
  data: RadarPoint[];
  size?: number;
  color?: string;
  label?: string;
  compareData?: RadarPoint[];
  compareLabel?: string;
}

export default function RadarChart({ data, size = 200, color = '#0e87ef', label, compareData, compareLabel }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) - 28;
  const levels = 4;
  const n = data.length;
  const angleStep = (Math.PI * 2) / n;
  const startAngle = -Math.PI / 2;

  const toXY = (angle: number, radius: number) => ({
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  });

  const labelRadius = r + 20;

  // Grid circles
  const gridCircles = Array.from({ length: levels }, (_, i) => ((i + 1) / levels) * r);

  // Data polygon
  const toPolygon = (points: RadarPoint[], fill: boolean): string => {
    return points.map((p, i) => {
      const angle = startAngle + i * angleStep;
      const val = Math.min(1, p.value / p.max);
      const { x, y } = toXY(angle, val * r);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div>
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid */}
        {gridCircles.map((gr, i) => (
          <polygon key={i}
            points={Array.from({ length: n }, (_, j) => {
              const { x, y } = toXY(startAngle + j * angleStep, gr);
              return `${x},${y}`;
            }).join(' ')}
            fill="none" stroke="#e5e7eb" strokeWidth="1"
          />
        ))}

        {/* Spokes */}
        {data.map((_, i) => {
          const angle = startAngle + i * angleStep;
          const { x, y } = toXY(angle, r);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e5e7eb" strokeWidth="1" />;
        })}

        {/* Compare polygon (behind) */}
        {compareData && (
          <polygon
            points={toPolygon(compareData, false)}
            fill="#f59e0b20"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}

        {/* Main polygon */}
        <polygon
          points={toPolygon(data, true)}
          fill={`${color}20`}
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Data point dots */}
        {data.map((p, i) => {
          const angle = startAngle + i * angleStep;
          const val = Math.min(1, p.value / p.max);
          const { x, y } = toXY(angle, val * r);
          return <circle key={i} cx={x} cy={y} r={4} fill={color} stroke="white" strokeWidth="2" />;
        })}

        {/* Labels */}
        {data.map((p, i) => {
          const angle = startAngle + i * angleStep;
          const { x, y } = toXY(angle, labelRadius);
          const anchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
          return (
            <text key={i} x={x} y={y} textAnchor={anchor} dominantBaseline="middle"
              className="text-xs fill-gray-600" style={{ fontSize: 10, fontFamily: 'system-ui' }}>
              {p.label}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      {(label || compareLabel) && (
        <div className="flex items-center gap-4 justify-center mt-2">
          {label && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: color }} />
              <span className="text-xs text-gray-600">{label}</span>
            </div>
          )}
          {compareLabel && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-xs text-gray-600">{compareLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
