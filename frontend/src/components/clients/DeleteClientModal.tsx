'use client';

import { FormEvent, useEffect, useState } from 'react';
import SidePanel from '@/shared/components/common/SidePanel';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

type DeleteClientModalProps = {
  open: boolean;
  clientName: string;
  onConfirm: (authCode: string) => void;
  onClose: () => void;
  confirmLabel?: string;
};

export default function DeleteClientModal({
  open,
  clientName,
  onConfirm,
  onClose,
  confirmLabel = 'Eliminar cliente',
}: DeleteClientModalProps) {
  const [mounted, setMounted] = useState(false);
  const [authCode, setAuthCode] = useState('');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) {
      setAuthCode('');
    }
  }, [open]);

  if (!mounted || !open) {
    return null;
  }

  const handleClose = () => {
    setAuthCode('');
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authCode.trim()) return;
    onConfirm(authCode.trim());
    setAuthCode('');
  };

  const isValid = authCode.trim().length >= 6;

  return (
    <SidePanel title="Eliminar cliente" open={open} onClose={handleClose} width={420} className="border-yellow-300">
      <form onSubmit={handleSubmit} className="min-h-full flex flex-col">
        <div className="space-y-4 px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900">Confirmar eliminación</h2>
              <p className="mt-1 text-sm text-gray-600">
                Esta acción eliminará al cliente <span className="font-medium text-gray-900">{clientName}</span> y sus relaciones con servicios, pagos e historiales asociados.
              </p>
            </div>
            <button type="button" onClick={handleClose} className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600" aria-label="Cerrar">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Autenticación requerida</p>
            <p className="mt-1 flex items-center gap-2 text-xs">
              <ShieldCheck className="h-4 w-4" /> Ingresa el código temporal enviado a tu correo o la clave dinámica de seguridad.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="auth-code">Código de seguridad</label>
            <input
              id="auth-code"
              name="auth-code"
              value={authCode}
              onChange={(event) => setAuthCode(event.target.value)}
              placeholder="Ej. 384920"
              autoFocus
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <p className="mt-2 text-xs text-gray-500">Por seguridad, las claves caducan en pocos minutos.</p>
          </div>
        </div>

        <div className="mt-auto flex justify-end gap-3 border-t border-gray-100 px-5 py-4">
          <button type="button" onClick={handleClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:bg-red-300" disabled={!isValid}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </SidePanel>
  );
}

