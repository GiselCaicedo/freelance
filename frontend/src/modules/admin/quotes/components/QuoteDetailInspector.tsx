'use client';

import type {
  QuoteActionType,
  QuoteDetail,
  SendQuoteEmailInput,
} from './types';
import { formatCurrency, formatDate } from '@shared/utils/formatters';
import { ArrowUpRight, FileText, Loader2, Mail, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const statusTone: Record<QuoteDetail['status'], { label: string; tone: string }> = {
  aprobada: { label: 'Aprobada', tone: 'bg-sky-100 text-sky-700' },
  pendiente: { label: 'Pendiente', tone: 'bg-amber-100 text-amber-700' },
  rechazada: { label: 'Rechazada', tone: 'bg-red-100 text-red-700' },
};

const attachmentTone: Record<string, { label: string; tone: string }> = {
  aprobada: { label: 'Aprobada', tone: 'bg-sky-100 text-sky-700' },
  pendiente: { label: 'Pendiente', tone: 'bg-amber-100 text-amber-700' },
  rechazada: { label: 'Rechazada', tone: 'bg-red-100 text-red-700' },
  en_proceso: { label: 'En proceso', tone: 'bg-blue-100 text-blue-700' },
};

type QuoteDetailInspectorProps = {
  quote: QuoteDetail | null;
  loading: boolean;
  locale: string;
  onGeneratePdf?: () => Promise<void>;
  onSendEmail?: (payload: SendQuoteEmailInput) => Promise<void>;
  onConvertToInvoice?: () => Promise<void>;
  actionLoading?: QuoteActionType | null;
  errorMessage?: string | null;
  successMessage?: string | null;
  mode?: 'panel' | 'page';
  className?: string;
};

const extractAction = (quote: QuoteDetail | null, type: QuoteActionType) =>
  quote?.actions.find(action => action.type === type) ?? null;

export default function QuoteDetailInspector({
  quote,
  loading,
  locale,
  onGeneratePdf,
  onSendEmail,
  onConvertToInvoice,
  actionLoading = null,
  errorMessage = null,
  successMessage = null,
  mode = 'panel',
  className,
}: QuoteDetailInspectorProps) {
  const [recipientsInput, setRecipientsInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setRecipientsInput('');
    setMessageInput('');
    setLocalError(null);
  }, [quote?.id]);

  const pdfAction = useMemo(() => extractAction(quote, 'pdf'), [quote]);
  const emailAction = useMemo(() => extractAction(quote, 'email'), [quote]);
  const invoiceAction = useMemo(() => extractAction(quote, 'invoice'), [quote]);

  const formattedAmount = quote ? formatCurrency(quote.amount ?? 0, locale) : '—';

  const handleGeneratePdf = async () => {
    if (!onGeneratePdf) {
      return;
    }
    setLocalError(null);
    try {
      await onGeneratePdf();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible generar el PDF.';
      setLocalError(message);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!onConvertToInvoice) {
      return;
    }
    setLocalError(null);
    try {
      await onConvertToInvoice();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible convertir la cotización.';
      setLocalError(message);
    }
  };

  const handleSendEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onSendEmail || !quote) {
      return;
    }
    const recipients = recipientsInput
      .split(/[\n,;]+/)
      .map(value => value.trim())
      .filter(value => value.length > 0);

    if (recipients.length === 0) {
      setLocalError('Agrega al menos un destinatario válido.');
      return;
    }

    setLocalError(null);

    try {
      await onSendEmail({
        recipients,
        message: messageInput.trim().length > 0 ? messageInput.trim() : undefined,
      });
      setRecipientsInput('');
      setMessageInput('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible enviar la cotización.';
      setLocalError(message);
    }
  };

  const renderHeader = () => {
    if (!quote) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-gray-500">
          <FileText className="mb-3 h-8 w-8 text-gray-300" />
          <p>Selecciona una cotización para ver el detalle.</p>
        </div>
      );
    }

    const status = statusTone[quote.status] ?? { label: quote.status, tone: 'bg-gray-100 text-gray-600' };

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{quote.reference}</h2>
              <p className="text-sm text-gray-500">{quote.description ?? 'Sin descripción registrada.'}</p>
            </div>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}>
              {status.label}
            </span>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-gray-900">Cliente</span>
                <span>{quote.client.name}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-gray-900">Monto</span>
                <span>{formattedAmount}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-gray-900">Emitida</span>
                <span>{formatDate(quote.issuedAt, locale)}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-gray-900">Actualizada</span>
                <span>{formatDate(quote.updatedAt, locale)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderServices = () => {
    if (!quote) {
      return null;
    }
    if (quote.services.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
          Sin servicios asociados.
        </div>
      );
    }

    return (
      <ul className="space-y-3">
        {quote.services.map((service) => {
          const tone = statusTone[service.status] ?? { label: service.status, tone: 'bg-gray-100 text-gray-600' };
          return (
            <li key={service.id} className="rounded-2xl border border-gray-200 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">{service.serviceName}</p>
                  <p className="text-xs text-gray-500">
                    Cantidad:
                    {' '}
                    {service.quantity}
                    {' '}
                    {service.unit ?? ''}
                  </p>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tone.tone}`}>
                  {tone.label}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Total:
                {formatCurrency(service.total ?? 0, locale)}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderAttachments = () => {
    if (!quote) {
      return null;
    }
    if (quote.attachments.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-5 text-sm text-gray-500">
          Sin documentos relacionados.
        </div>
      );
    }

    return (
      <ul className="space-y-3">
        {quote.attachments.map((attachment) => {
          const status = attachmentTone[attachment.invoiceStatus] ?? {
            label: attachment.invoiceStatus,
            tone: 'bg-gray-100 text-gray-600',
          };
          return (
            <li key={attachment.id} className="rounded-2xl border border-gray-200 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">
                    Factura
                    {attachment.invoiceNumber ?? attachment.invoiceId}
                  </p>
                  <p className="text-xs text-gray-500">
                    Monto:
                    {formatCurrency(attachment.invoiceAmount ?? 0, locale)}
                  </p>
                  {attachment.invoiceUrl
                    ? (
                        <Link
                          href={attachment.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline"
                        >
                          Ver factura
                          {' '}
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      )
                    : null}
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}>
                  {status.label}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className={`flex h-full flex-col ${className ?? ''}`}>
      {errorMessage
        ? (
            <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
          )
        : null}
      {localError
        ? (
            <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{localError}</div>
          )
        : null}
      {successMessage
        ? (
            <div className="mb-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">{successMessage}</div>
          )
        : null}

      {loading
        ? (
            <div className="flex flex-1 items-center justify-center py-10 text-sm text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-sky-500" />
              {' '}
              Cargando detalle…
            </div>
          )
        : (
            <div className={`flex-1 space-y-6 ${mode === 'page' ? '' : 'pb-6'}`}>
              {renderHeader()}

              {quote
                ? (
                    <div className="space-y-6">
                      {pdfAction
                        ? (
                            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white px-4 py-4">
                              <h3 className="text-sm font-semibold text-gray-900">Acciones rápidas</h3>
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={handleGeneratePdf}
                                    disabled={!pdfAction.available || actionLoading === 'pdf'}
                                    className="inline-flex items-center gap-2 rounded-full border border-sky-200 px-4 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {actionLoading === 'pdf'
                                      ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        )
                                      : (
                                          <RotateCcw className="h-4 w-4" />
                                        )}
                                    Generar PDF
                                  </button>
                                  {pdfAction.url
                                    ? (
                                        <Link
                                          href={pdfAction.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                                        >
                                          <FileText className="h-4 w-4" />
                                          {' '}
                                          {pdfAction.label}
                                        </Link>
                                      )
                                    : null}
                                </div>
                                {pdfAction.disabledReason
                                  ? (
                                      <p className="text-xs text-gray-500">{pdfAction.disabledReason}</p>
                                    )
                                  : null}
                              </div>
                            </div>
                          )
                        : null}

                      {emailAction
                        ? (
                            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-sky-500" />
                                <h3 className="text-sm font-semibold text-gray-900">Enviar por correo</h3>
                              </div>
                              <p className="text-xs text-gray-500">
                                Separa los correos con comas o saltos de línea.
                              </p>
                              <form onSubmit={handleSendEmail} className="space-y-3">
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="quote-email-to">
                                    Destinatarios
                                  </label>
                                  <textarea
                                    id="quote-email-to"
                                    value={recipientsInput}
                                    onChange={event => setRecipientsInput(event.target.value)}
                                    placeholder="correo@cliente.com"
                                    rows={2}
                                    className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="quote-email-message">
                                    Mensaje (opcional)
                                  </label>
                                  <textarea
                                    id="quote-email-message"
                                    value={messageInput}
                                    onChange={event => setMessageInput(event.target.value)}
                                    placeholder="Mensaje adicional para el cliente"
                                    rows={3}
                                    className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
                                  />
                                </div>
                                <button
                                  type="submit"
                                  disabled={!emailAction.available || actionLoading === 'email'}
                                  className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {actionLoading === 'email'
                                    ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      )
                                    : (
                                        <Mail className="h-4 w-4" />
                                      )}
                                  {emailAction.label}
                                </button>
                              </form>
                            </div>
                          )
                        : null}

                      {invoiceAction
                        ? (
                            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white px-4 py-4">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-sky-500" />
                                <h3 className="text-sm font-semibold text-gray-900">Factura</h3>
                              </div>
                              <button
                                type="button"
                                onClick={handleConvertToInvoice}
                                disabled={!invoiceAction.available || actionLoading === 'invoice'}
                                className="inline-flex items-center gap-2 rounded-full border border-sky-200 px-4 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {actionLoading === 'invoice'
                                  ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    )
                                  : (
                                      <FileText className="h-4 w-4" />
                                    )}
                                {invoiceAction.label}
                              </button>
                              {invoiceAction.disabledReason
                                ? (
                                    <p className="text-xs text-gray-500">{invoiceAction.disabledReason}</p>
                                  )
                                : null}
                            </div>
                          )
                        : null}

                      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white px-4 py-4">
                        <h3 className="text-sm font-semibold text-gray-900">Servicios incluidos</h3>
                        {renderServices()}
                      </div>

                      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white px-4 py-4">
                        <h3 className="text-sm font-semibold text-gray-900">Documentos relacionados</h3>
                        {renderAttachments()}
                      </div>
                    </div>
                  )
                : null}
            </div>
          )}
    </div>
  );
}
