'use client';

<<<<<<< HEAD
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { logout } from '@/services/conexion';
import { useAlerts } from '@/components/common/AlertsProvider';
=======
import { logout } from '@/services/conexion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut } from 'lucide-react';
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8

interface LogoutButtonProps {
  className?: string;
  isNavOpen?: boolean;
}

export default function LogoutButton({ className = '', isNavOpen = true }: LogoutButtonProps) {
  const router = useRouter();
<<<<<<< HEAD
  const { locale } = useParams() as { locale?: string };
  const t = useTranslations('Auth.Logout');
  const [loading, setLoading] = useState(false);
  const { notify } = useAlerts();
=======
  const [loading, setLoading] = useState(false);
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
<<<<<<< HEAD
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
=======
      document.cookie = 'token=; Max-Age=0; path=/;';
      router.push('/es/sign-in');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('No se pudo cerrar sesión');
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
<<<<<<< HEAD
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-gray-700
        hover:text-gray-900 hover:bg-gray-50 border border-gray-200 rounded-md
        transition-all duration-200 font-medium ${!isNavOpen ? 'p-2 justify-center' : 'justify-start'} ${className}`}
    >
      <LogOut className="w-4 h-4 flex-shrink-0" />
      {isNavOpen && <span>{loading ? t('loading') : t('buttonLabel')}</span>}
=======
      onClick={handleLogout}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-gray-700 
        hover:text-gray-900 hover:bg-gray-50 border border-gray-200 rounded-md 
        transition-all duration-200 font-medium ${!isNavOpen ? 'p-2 justify-center' : 'justify-start'} ${className}`}
    >
      <LogOut className="w-4 h-4 flex-shrink-0" />
      {isNavOpen && <span>{loading ? 'Cerrando...' : 'Cerrar sesión'}</span>}
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
    </button>
  );
}
