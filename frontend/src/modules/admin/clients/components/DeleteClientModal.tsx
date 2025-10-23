'use client';

import type { FormEvent } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type DeleteClientModalProps = {
  open: boolean;
  clientName: string;
  onConfirm: (authCode: string) => Promise<void>;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) {
      setAuthCode('');
      setIsSubmitting(false);
      setErrorMessage(null);
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
    if (!authCode.trim()) {
      return;
    }
    void (async () => {
      try {
        setIsSubmitting(true);
        setErrorMessage(null);
        await onConfirm(authCode.trim());
        setAuthCode('');
      } catch (error: any) {
        setErrorMessage(error?.message ?? 'No fue posible eliminar al cliente.');
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  const isValid = authCode.trim().length >= 6;

  return (

    <form onSubmit={handleSubmit} className="flex min-h-full flex-col">
      <div className="space-y-4 px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-gray-900">Confirmar eliminación</h2>
            <p className="mt-1 text-sm text-gray-600">
              [Mensaje de advertencia]
            </p>
          </div>
          <button type="button" onClick={handleClose} className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
          <p className="font-semibold">Autenticación requerida</p>
          <p className="mt-1 flex items-center gap-2 text-xs">
            <ShieldCheck className="h-4 w-4" />
            {' '}
            Ingresa el código temporal enviado a tu correo o la clave dinámica de seguridad.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700" htmlFor="auth-code">Código de seguridad</label>
          <input
            id="auth-code"
            name="auth-code"
            value={authCode}
            onChange={event => setAuthCode(event.target.value)}
            placeholder="Ej. 384920"
            autoFocus
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-auto space-y-3 border-t border-gray-100 px-5 py-4">
        {errorMessage ? <p className="text-xs text-red-600">{errorMessage}</p> : null}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={handleClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:bg-red-300" disabled={!isValid || isSubmitting}>
            {isSubmitting ? 'Eliminando…' : confirmLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
