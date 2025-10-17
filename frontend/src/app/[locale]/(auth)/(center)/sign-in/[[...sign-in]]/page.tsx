'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { LogIn, Lock, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { login } from '@/shared/services/conexion';
import { useAlerts } from '@/shared/components/common/AlertsProvider';

type FormState = {
  identifier: string;
  password: string;
};

export default function SignInPage() {
  const router = useRouter();
  const { locale } = useParams() as { locale: string };
  const t = useTranslations('Auth.SignIn');
  const { notify } = useAlerts();
  const [form, setForm] = useState<FormState>({ identifier: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const response = await login(form);
      if (response.success) {
        notify({
          type: 'success',
          title: t('alerts.success.title'),
          description: t('alerts.success.description'),
        });
        router.push(`/${locale}/dashboard`);
        router.refresh();
        return;
      }

      const message = response.message ?? t('errors.invalidCredentials');
      setFormError(message);
      notify({ type: 'error', title: t('alerts.error.title'), description: message });
    } catch (error: any) {
      const message = error?.message ?? t('errors.unexpected');
      setFormError(message);
      notify({ type: 'error', title: t('alerts.error.title'), description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || !form.identifier.trim() || !form.password.trim();

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      {/* Fondo difuminado */}
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_60%)]"
        aria-hidden="true"
      />

      {/* Contenedor principal de dos secciones */}
      <div className="grid h-screen w-full md:grid-cols-[1fr_1fr]">
        {/* Sección izquierda - fondo verde */}
        <div className="flex flex-col justify-between bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 p-12 text-white">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              {t('hero.badge')}
            </span>
            <h2 className="mt-6 text-4xl font-semibold leading-tight">{t('hero.heading')}</h2>
            <p className="mt-4 text-sm text-emerald-50/90">{t('hero.description')}</p>
          </div>

          <div className="rounded-2xl bg-white/10 p-6 backdrop-blur">
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-100/80">
              {t('hero.tipTitle')}
            </p>
            <p className="mt-2 text-sm text-emerald-50/95">{t('hero.tipDescription')}</p>
          </div>
        </div>

        {/* Sección derecha - formulario */}
        <div className="flex flex-col justify-center px-12 py-16 bg-white">
          <div className="max-w-sm w-full mx-auto">
            <div className="mb-10">
              <h1 className="text-3xl font-black tracking-tight text-emerald-600">Cifra Pay</h1>
              <h2 className="mt-4 text-2xl font-semibold text-gray-900">{t('form.heading')}</h2>
              <p className="mt-2 text-sm text-gray-500">{t('form.subheading')}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6" noValidate>
              <div className="space-y-2">
                <label htmlFor="identifier" className="text-sm font-medium text-gray-700">
                  {t('form.usernameLabel')}
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    value={form.identifier}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-white px-10 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder={t('form.usernamePlaceholder')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  {t('form.passwordLabel')}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-white px-10 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder={t('form.passwordPlaceholder')}
                  />
                </div>
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <button
                type="submit"
                disabled={disabled}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogIn className="h-4 w-4" />
                {submitting ? t('form.submitLoading') : t('form.submit')}
              </button>

              <p className="text-center text-xs text-gray-400 mt-2">
                {t('form.footerNotice')}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

}
