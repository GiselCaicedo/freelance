'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { logout } from '@/shared/services/conexion';
import { useAlerts } from '@/shared/components/common/AlertsProvider';
import { TRANSITION_ALL } from '@/shared/styles/transitions';

interface LogoutButtonProps {
  className?: string;
  isNavOpen?: boolean;
}

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
      className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-gray-700
        hover:text-gray-900 hover:bg-gray-50 border border-gray-200 rounded-md
        ${TRANSITION_ALL} font-medium ${!isNavOpen ? 'p-2 justify-center' : 'justify-start'} ${className}`}
    >
      <LogOut className="w-4 h-4 flex-shrink-0" />
      {isNavOpen && <span>{loading ? t('loading') : t('buttonLabel')}</span>}
    </button>
  );
}
