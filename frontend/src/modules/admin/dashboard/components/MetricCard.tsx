import React from 'react';

type MetricCardProps = {
  title: string;
  value: string;
  hint?: string;
  tone?: 'primary' | 'secondary' | 'warning';
};

const toneStyles: Record<NonNullable<MetricCardProps['tone']>, string> = {
  primary: 'bg-emerald-500 text-white',
  secondary: 'bg-sky-500 text-white',
  warning: 'bg-amber-500 text-white',
};

export function MetricCard({ title, value, hint, tone = 'primary' }: MetricCardProps) {
  return (
    <div className={`rounded-2xl p-6 shadow-sm transition-shadow hover:shadow-md ${toneStyles[tone]}`}>
      <p className="text-sm font-medium tracking-wide uppercase opacity-80">{title}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      {hint ? <p className="mt-2 text-xs opacity-80">{hint}</p> : null}
    </div>
  );
}
