'use client';

import { logout } from '@/services/conexion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  className?: string;
  isNavOpen?: boolean;
}

export default function LogoutButton({ className = '', isNavOpen = true }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      document.cookie = 'token=; Max-Age=0; path=/;';
      router.push('/es/sign-in');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('No se pudo cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-gray-700 
        hover:text-gray-900 hover:bg-gray-50 border border-gray-200 rounded-md 
        transition-all duration-200 font-medium ${!isNavOpen ? 'p-2 justify-center' : 'justify-start'} ${className}`}
    >
      <LogOut className="w-4 h-4 flex-shrink-0" />
      {isNavOpen && <span>{loading ? 'Cerrando...' : 'Cerrar sesión'}</span>}
    </button>
  );
}
