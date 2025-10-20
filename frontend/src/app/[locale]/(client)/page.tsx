import { Calendar, CreditCard, FileText, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

const metricAccents: Record<string, string> = {
  payments: 'text-emerald-400',
  invoices: 'text-sky-400',
  services: 'text-violet-400',
};

const shortcutIcons = {
  payments: CreditCard,
  documents: FileText,
  schedule: Calendar,
  support: ShieldCheck,
} as const;

const metricKeys = Object.keys(metricAccents) as Array<keyof typeof metricAccents>;
const shortcutKeys = Object.keys(shortcutIcons) as Array<keyof typeof shortcutIcons>;

export default function ClientHome() {
  const t = useTranslations('Client.Dashboard');

  const metrics = metricKeys.map((key) => ({
    key,
    label: t(`metrics.${key}.label`),
    value: t(`metrics.${key}.value`),
    change: t(`metrics.${key}.change`),
    accent: metricAccents[key],
  }));

  const shortcuts = shortcutKeys.map((key) => ({
    key,
    icon: shortcutIcons[key],
    label: t(`shortcuts.${key}.label`),
    description: t(`shortcuts.${key}.description`),
  }));

  return (
    <section className="space-y-10">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-lg shadow-emerald-900/20">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">{t('hero.badge')}</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{t('hero.heading')}</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-200/70">{t('hero.description')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-md shadow-slate-900/30"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-200/60">{metric.label}</p>
            <p className={`mt-2 text-3xl font-semibold ${metric.accent}`}>{metric.value}</p>
            <p className="mt-2 text-xs text-slate-200/60">{metric.change}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <div
              key={shortcut.key}
              className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-emerald-300/50 hover:bg-emerald-500/10"
            >
              <Icon className="mt-1 h-10 w-10 flex-shrink-0 rounded-xl border border-white/10 bg-white/10 p-2 text-emerald-300 transition group-hover:border-emerald-300/60 group-hover:text-emerald-200" />
              <div>
                <p className="text-base font-semibold text-white">{shortcut.label}</p>
                <p className="mt-1 text-sm text-slate-200/70">{shortcut.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
