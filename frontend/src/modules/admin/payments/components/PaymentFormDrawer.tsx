'use client';

import type { FormEvent } from 'react';
import type {
  PaymentClient,
  PaymentFormAttachment,
  PaymentFormValues,
  PaymentMethod,
  PaymentRecord,
} from './types';
import { useEffect, useMemo, useState } from 'react';

const CUSTOM_METHOD = '__custom__';

type PaymentFormDrawerProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  clients: PaymentClient[];
  methods: PaymentMethod[];
  onSubmit: (values: PaymentFormValues) => Promise<void>;
  onClose: () => void;
  defaultValues?: PaymentRecord | null;
};

const toDateInput = (value?: string | null): string => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const cloneAttachments = (attachments?: PaymentFormAttachment[] | PaymentRecord['attachments']): PaymentFormAttachment[] => {
  if (!Array.isArray(attachments)) {
    return [];
  }
  return attachments.map(attachment => ({
    id: attachment.id,
    url: attachment.url ?? '',
    invoiceId: attachment.invoiceId ?? null,
  }));
};

export default function PaymentFormDrawer({
  open,
  title,
  submitLabel,
  clients,
  methods,
  onSubmit,
  onClose,
  defaultValues = null,
}: PaymentFormDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [clientId, setClientId] = useState('');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<string | null>('pagado');
  const [reference, setReference] = useState('');
  const [methodId, setMethodId] = useState<string | null>(null);
  const [methodName, setMethodName] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [type, setType] = useState('');
  const [paidAt, setPaidAt] = useState('');
  const [confirmed, setConfirmed] = useState<boolean | null>(true);
  const [attachments, setAttachments] = useState<PaymentFormAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const sortedClients = useMemo(
    () => clients.map(client => ({ ...client })),
    [clients],
  );

  const sortedMethods = useMemo(
    () => methods.map(method => ({ ...method })),
    [methods],
  );

  useEffect(() => {
    if (!defaultValues) {
      setClientId('');
      setValue('');
      setStatus('pagado');
      setReference('');
      setMethodId(null);
      setMethodName('');
      setReceiptUrl('');
      setType('');
      setPaidAt('');
      setConfirmed(true);
      setAttachments([]);
      setFormError(null);
      setIsSubmitting(false);
      return;
    }

    setClientId(defaultValues.clientId ?? '');
    setValue(defaultValues.amountRaw ?? `${defaultValues.amount}`);
    setStatus(defaultValues.statusRaw ?? defaultValues.status ?? null);
    setReference(defaultValues.reference ?? '');
    setMethodId(defaultValues.methodId ?? null);
    setMethodName(defaultValues.methodName ?? '');
    setReceiptUrl(defaultValues.receiptUrl ?? '');
    setType(defaultValues.type ?? '');
    setPaidAt(toDateInput(defaultValues.updatedAt ?? defaultValues.createdAt ?? null));
    setConfirmed(defaultValues.status === 'pagado' ? true : defaultValues.status === 'pendiente' ? false : null);
    setAttachments(cloneAttachments(defaultValues.attachments));
    setFormError(null);
    setIsSubmitting(false);
  }, [defaultValues]);

  useEffect(() => {
    if (!open && mounted) {
      if (!defaultValues) {
        setClientId('');
        setValue('');
        setStatus('pagado');
        setReference('');
        setMethodId(null);
        setMethodName('');
        setReceiptUrl('');
        setType('');
        setPaidAt('');
        setConfirmed(true);
        setAttachments([]);
      }
      setFormError(null);
      setIsSubmitting(false);
    }
  }, [open, mounted, defaultValues]);

  if (!mounted || !open) {
    return null;
  }

  const handleClose = () => {
    setFormError(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleMethodSelect = (selected: string) => {
    if (selected === CUSTOM_METHOD) {
      setMethodId(null);
      setMethodName('');
      return;
    }
    const normalized = selected.trim();
    if (!normalized) {
      setMethodId(null);
      return;
    }
    setMethodId(normalized);
    const found = sortedMethods.find(method => method.id === normalized);
    if (found) {
      setMethodName(found.name);
    }
  };

  const handleAttachmentChange = (index: number, field: 'url' | 'invoiceId', value: string) => {
    setAttachments((prev) => {
      const next = [...prev];
      const current = next[index];
      if (!current) {
        return prev;
      }
      next[index] = {
        ...current,
        [field]: field === 'url' ? value : value || null,
      };
      return next;
    });
  };

  const handleAddAttachment = () => {
    setAttachments(prev => [...prev, { url: '', invoiceId: null }]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sanitizedAttachments = attachments
      .map(attachment => ({
        id: attachment.id,
        url: attachment.url.trim(),
        invoiceId: attachment.invoiceId ? attachment.invoiceId.trim() : null,
      }))
      .filter(attachment => attachment.url.length > 0);

    const payload: PaymentFormValues = {
      clientId,
      value: value.trim(),
      status: status?.trim() ?? null,
      reference: reference.trim() || null,
      methodId: methodId ?? undefined,
      methodName: methodName.trim() || undefined,
      receiptUrl: receiptUrl.trim() || undefined,
      type: type.trim() || undefined,
      paidAt: paidAt || undefined,
      confirmed,
      attachments: sanitizedAttachments,
    };

    try {
      setIsSubmitting(true);
      setFormError(null);
      await onSubmit(payload);
      if (!defaultValues) {
        setClientId('');
        setValue('');
        setStatus('pagado');
        setReference('');
        setMethodId(null);
        setMethodName('');
        setReceiptUrl('');
        setType('');
        setPaidAt('');
        setConfirmed(true);
        setAttachments([]);
      }
      onClose();
    } catch (error: any) {
      setFormError(error?.message ?? 'No fue posible guardar el pago.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = clientId && value.trim().length > 0 && (methodId || methodName.trim().length > 0);

  const statusOptions = [
    { value: 'pagado', label: 'Pagado' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'anulado', label: 'Anulado' },
    { value: 'fallido', label: 'Fallido' },
    { value: 'otro', label: 'Otro' },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex min-h-full flex-col">
      <div className="space-y-5 px-5 py-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-600">
            Completa la información para registrar el pago en el sistema.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="payment-client">
              Cliente
            </label>
            <select
              id="payment-client"
              name="payment-client"
              value={clientId}
              onChange={event => setClientId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            >
              <option value="">Selecciona un cliente…</option>
              {sortedClients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="payment-value">
              Valor del pago
            </label>
            <input
              id="payment-value"
              name="payment-value"
              value={value}
              onChange={event => setValue(event.target.value)}
              placeholder="Ej. 1.250.000"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="payment-status">
              Estado
            </label>
            <select
              id="payment-status"
              name="payment-status"
              value={status ?? ''}
              onChange={event => setStatus(event.target.value || null)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            >
              <option value="">Sin especificar</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="payment-date">
              Fecha de pago
            </label>
            <input
              id="payment-date"
              name="payment-date"
              type="date"
              value={paidAt}
              onChange={event => setPaidAt(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="payment-method">
              Método de pago
            </label>
            <select
              id="payment-method"
              name="payment-method"
              value={methodId ?? ''}
              onChange={event => handleMethodSelect(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            >
              <option value="">Selecciona un método…</option>
              {sortedMethods.map(method => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
              <option value={CUSTOM_METHOD}>Agregar nuevo método…</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="payment-method-name">
              Nombre del método
            </label>
            <input
              id="payment-method-name"
              name="payment-method-name"
              value={methodName}
              onChange={event => setMethodName(event.target.value)}
              placeholder="Ej. Transferencia Bancolombia"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="payment-reference">
              Referencia o código
            </label>
            <input
              id="payment-reference"
              name="payment-reference"
              value={reference}
              onChange={event => setReference(event.target.value)}
              placeholder="Ej. FACT-2024-001"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="payment-type">
              Tipo (opcional)
            </label>
            <input
              id="payment-type"
              name="payment-type"
              value={type}
              onChange={event => setType(event.target.value)}
              placeholder="Ej. Transferencia"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="payment-url">
              Enlace del comprobante principal
            </label>
            <input
              id="payment-url"
              name="payment-url"
              value={receiptUrl}
              onChange={event => setReceiptUrl(event.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <input
            id="payment-confirmed"
            name="payment-confirmed"
            type="checkbox"
            checked={confirmed === true}
            onChange={event => setConfirmed(!!event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <div className="text-sm">
            <p className="font-medium text-gray-900">Confirmar como cobrado</p>
            <p className="text-xs text-gray-600">
              Marca esta opción si el pago ya fue conciliado. Desactívala si deseas dejarlo pendiente.
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Anexos del pago</h3>
            <button
              type="button"
              onClick={handleAddAttachment}
              className="text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
            >
              Agregar anexo
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {attachments.length === 0
              ? (
                  <p className="text-xs text-gray-500">No se han agregado anexos.</p>
                )
              : (
                  attachments.map((attachment, index) => (
                    <div key={attachment.id ?? `attachment-${index}`} className="rounded-xl border border-gray-200 p-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-gray-600" htmlFor={`attachment-url-${index}`}>
                            URL del anexo
                          </label>
                          <input
                            id={`attachment-url-${index}`}
                            name={`attachment-url-${index}`}
                            value={attachment.url}
                            onChange={event => handleAttachmentChange(index, 'url', event.target.value)}
                            placeholder="https://..."
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600" htmlFor={`attachment-invoice-${index}`}>
                            ID de factura (opcional)
                          </label>
                          <input
                            id={`attachment-invoice-${index}`}
                            name={`attachment-invoice-${index}`}
                            value={attachment.invoiceId ?? ''}
                            onChange={event => handleAttachmentChange(index, 'invoiceId', event.target.value)}
                            placeholder="UUID de la factura"
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(index)}
                          className="text-xs font-semibold text-red-600 transition hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                )}
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3 border-t border-gray-100 px-5 py-4">
        {formError ? <p className="text-xs text-red-600">{formError}</p> : null}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {isSubmitting ? 'Guardando…' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
