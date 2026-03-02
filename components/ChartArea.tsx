'use client'

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

export default function ChartArea({ monthly, colors, language, fmt, cur }: any) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-base-100 border border-base-300 rounded-xl shadow-lg p-3 text-xs">
        <div className="font-semibold mb-2 opacity-60">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="opacity-60">{p.name}:</span>
            <span className="font-bold">{fmt(p.value, cur)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={monthly} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="gradInc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.green} stopOpacity={0.15} />
            <stop offset="95%" stopColor={colors.green} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.red} stopOpacity={0.15} />
            <stop offset="95%" stopColor={colors.red} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={colors.border} />
        <XAxis dataKey="month" tick={{ fill: colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="income" name={language === 'de' ? 'Einnahmen' : 'Income'} stroke={colors.green} strokeWidth={2} fill="url(#gradInc)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        <Area type="monotone" dataKey="expense" name={language === 'de' ? 'Ausgaben' : 'Expenses'} stroke={colors.red} strokeWidth={2} fill="url(#gradExp)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
