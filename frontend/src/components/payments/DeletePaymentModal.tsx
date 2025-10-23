'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

type DeletePaymentModalProps = {
  open: boolean;
  paymentLabel?: string | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
};

export default function DeletePaymentModal({ open, paymentLabel, onConfirm, onClose }: DeletePaymentModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) {
      setIsSubmitting(false);
      setErrorMessage(null);
    }
  }, [open]);

  if (!mounted || !open) {
    return null;
  }

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onConfirm();
      onClose();
    } catch (error: any) {
      setErrorMessage(error?.message ?? 'No fue posible eliminar el pago.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-gray-900">Eliminar pago</h2>
            <p className="mt-1 text-sm text-gray-600">
              Esta acción eliminará el pago {paymentLabel ? `"${paymentLabel}"` : ''} de forma permanente. ¿Deseas continuar?
            </p>
          </div>
        </div>

        {errorMessage ? <p className="mt-4 text-xs text-red-600">{errorMessage}</p> : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {isSubmitting ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

