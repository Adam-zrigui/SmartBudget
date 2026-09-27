"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ChartArea({ monthly, colors, language, fmt, cur }: any) {
  const TooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="min-w-[145px] rounded-xl border border-border bg-popover/95 p-3 text-[10px] text-popover-foreground shadow-2xl backdrop-blur">
        <div className="mb-2 font-medium text-muted-foreground">{label} 2026</div>
        <div className="grid gap-1.5">
          {payload.map((item: any) => (
            <div key={item.dataKey} className="flex items-center gap-2">
              <span className="size-1.5 rounded-full" style={{ background: item.color }} />
              <span className="flex-1 text-muted-foreground">{item.name}</span>
              <span className="font-semibold">{fmt(item.value, cur)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={monthly} margin={{ top: 8, right: 5, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="sb-income-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={colors.green} stopOpacity="0.24" />
            <stop offset="1" stopColor={colors.green} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sb-expense-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={colors.red} stopOpacity="0.15" />
            <stop offset="1" stopColor={colors.red} stopOpacity="0" />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={colors.border} strokeDasharray="3 6" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: colors.muted, fontSize: 9 }} dy={9} interval="preserveStartEnd" />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: colors.muted, fontSize: 9 }}
          width={45}
          tickFormatter={(value) => {
            const numeric = Number(value);
            if (numeric === 0) return '0';
            if (Math.abs(numeric) >= 1000) return `${(numeric / 1000).toFixed(1)}k`;
            return `${Math.round(numeric)}`;
          }}
        />
        <Tooltip content={<TooltipContent />} cursor={{ stroke: colors.muted, strokeDasharray: "3 4" }} />
        <Area
          type="monotone"
          dataKey="income"
          name={language === "de" ? "Einnahmen" : "Income"}
          stroke={colors.green}
          strokeWidth={2.2}
          fill="url(#sb-income-gradient)"
          dot={false}
          activeDot={{ r: 4, stroke: colors.cardBg, strokeWidth: 2 }}
        />
        <Area
          type="monotone"
          dataKey="expense"
          name={language === "de" ? "Ausgaben" : "Expenses"}
          stroke={colors.red}
          strokeWidth={2.2}
          fill="url(#sb-expense-gradient)"
          dot={false}
          activeDot={{ r: 4, stroke: colors.cardBg, strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
