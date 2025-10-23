'use client';

import { useAlerts } from '@shared/components/common/AlertsProvider';
import { logout } from '@shared/services/conexion';
import { TRANSITION_ALL } from '@shared/styles/transitions';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

type LogoutButtonProps = {
  className?: string;
  isNavOpen?: boolean;
};

export default function LogoutButton({ className = '', isNavOpen = true }: LogoutButtonProps) {
  const router = useRouter();
  const { locale } = useParams() as { locale?: string };
  const t = useTranslations('Auth.Logout');
  const [loading, setLoading] = useState(false);
  const { notify } = useAlerts();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('auth_token');
        window.localStorage.removeItem('auth_token');
      }
      notify({ type: 'success', title: t('successTitle'), description: t('successDescription') });
      router.push(`/${locale ?? 'es'}/sign-in`);
      router.refresh();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      notify({ type: 'error', title: t('errorTitle'), description: t('errorDescription') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={`flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 px-3
        py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900
        ${TRANSITION_ALL} font-medium ${!isNavOpen ? 'justify-center p-2' : 'justify-start'} ${className}`}
    >
      <LogOut className="h-4 w-4 flex-shrink-0" />
      {isNavOpen && <span>{loading ? t('loading') : t('buttonLabel')}</span>}
    </button>
  );
}
