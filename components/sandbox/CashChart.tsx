import { nairaCompact, naira } from "@/lib/sandbox/format";
import { MonthRow } from "@/lib/sandbox/types";

const W = 360;
const H = 240;
const PAD = { l: 52, r: 14, t: 14, b: 30 };

/** Cash balance by month, drawn as plain SVG so it needs no chart library and prints cleanly. */
export default function CashChart({
  rows,
  startingCapital,
  compare,
  compareLabel,
}: {
  rows: MonthRow[];
  startingCapital: number;
  compare?: MonthRow[];
  compareLabel?: string;
}) {
  const n = rows.length;
  const cash = [...rows, ...(compare ?? [])].map((r) => r.cash);
  const minV = Math.min(0, ...cash);
  const maxV = Math.max(startingCapital, ...cash, 1);
  const span = maxV - minV || 1;

  const x = (month: number) => PAD.l + ((month - 1) / Math.max(1, n - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - minV) / span) * (H - PAD.t - PAD.b);

  const cmpLine = (compare ?? []).map((r, i) => `${i === 0 ? "M" : "L"}${x(r.month).toFixed(1)} ${y(r.cash).toFixed(1)}`).join(" ");
  const line = rows.map((r, i) => `${i === 0 ? "M" : "L"}${x(r.month).toFixed(1)} ${y(r.cash).toFixed(1)}`).join(" ");

  const yTicks = [0, 1, 2, 3].map((i) => minV + (span * i) / 3);
  const step = n <= 12 ? 2 : n <= 24 ? 4 : 6;
  const xTicks = rows.filter((r) => r.month === 1 || r.month % step === 0).map((r) => r.month);

  let low = rows[0];
  rows.forEach((r) => {
    if (r.cash < low.cash) low = r;
  });
  const lowX = x(low.month);
  const lowAnchor = lowX > W - 90 ? "end" : lowX < PAD.l + 50 ? "start" : "middle";
  const zeroY = y(0);
  const below = minV < 0;

  return (
    <figure className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby="cash-chart-title cash-chart-desc"
        className="h-auto w-full"
      >
        <title id="cash-chart-title">Cash balance by month</title>
        <desc id="cash-chart-desc">
          {`Cash starts near ${naira(rows[0].cash)} in month 1. The lowest point is ${naira(low.cash)} in month ${low.month}. It ends at ${naira(rows[n - 1].cash)} in month ${n}.`}
        </desc>

        {yTicks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="stroke-ink-line" strokeWidth={0.5} />
            <text x={PAD.l - 6} y={y(v) + 3} textAnchor="end" fontSize={9} className="fill-ash">
              {nairaCompact(v)}
            </text>
          </g>
        ))}

        {below ? (
          <rect x={PAD.l} y={zeroY} width={W - PAD.l - PAD.r} height={H - PAD.b - zeroY} className="fill-red-400" opacity={0.1} />
        ) : null}
        <line x1={PAD.l} x2={W - PAD.r} y1={zeroY} y2={zeroY} className="stroke-ash" strokeWidth={0.8} strokeDasharray="3 3" />

        {compare ? (
          <path d={cmpLine} fill="none" className="stroke-red-400" strokeWidth={1.6} strokeDasharray="4 3" strokeLinejoin="round" />
        ) : null}
        <path d={line} fill="none" className="stroke-gold" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />

        <circle cx={lowX} cy={y(low.cash)} r={3.5} className={low.cash < 0 ? "fill-red-400" : "fill-gold"} />
        <text
          x={lowX}
          y={y(low.cash) + (y(low.cash) > H - PAD.b - 18 ? -9 : 15)}
          textAnchor={lowAnchor}
          fontSize={9}
          className={low.cash < 0 ? "fill-red-400" : "fill-gold-light"}
        >
          {`Lowest ${nairaCompact(low.cash)}`}
        </text>

        {xTicks.map((m) => (
          <text key={m} x={x(m)} y={H - 10} textAnchor="middle" fontSize={9} className="fill-ash">
            {m}
          </text>
        ))}
        <text x={(PAD.l + W - PAD.r) / 2} y={H - 0.5} textAnchor="middle" fontSize={8} className="fill-ash">
          Month
        </text>
      </svg>
      <figcaption className="text-xs text-ash">
        Cash in the bank at the end of each month. The dashed grey line is zero. Below it, you are out of money.
        {compare ? ` Gold is your plan. The dashed red line is "${compareLabel ?? "the scenario"}".` : ""}
      </figcaption>
    </figure>
  );
}
