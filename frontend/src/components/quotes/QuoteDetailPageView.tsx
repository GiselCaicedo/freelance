'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Breadcrumbs from '@/shared/components/ui/Breadcrumbs';
import QuoteDetailInspector from './QuoteDetailInspector';
import type { QuoteActionType, QuoteDetail, SendQuoteEmailInput } from './types';
import {
  convertAdminQuoteToInvoiceApi,
  generateAdminQuotePdfApi,
  getAdminQuoteDetailApi,
  sendAdminQuoteEmailApi,
} from '@/shared/services/conexion';

type QuoteDetailPageViewProps = {
  initialQuote: QuoteDetail;
  locale: string;
  quoteId: string;
};

export default function QuoteDetailPageView({ initialQuote, locale, quoteId }: QuoteDetailPageViewProps) {
  const [quote, setQuote] = useState<QuoteDetail>(initialQuote);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<QuoteActionType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const refreshQuote = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const detail = await getAdminQuoteDetailApi(quoteId);
      if (detail) {
        setQuote(detail);
      }
    } catch (error) {
      console.error('Failed to refresh quote detail', error);
      const message = error instanceof Error ? error.message : 'No fue posible actualizar la información.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [quoteId]);

  const handleGeneratePdf = useCallback(async () => {
    setActionLoading('pdf');
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const result = await generateAdminQuotePdfApi(quoteId);
      setQuote((prev) => ({
        ...prev,
        updatedAt: result.generatedAt ?? prev.updatedAt,
        actions: prev.actions.map((action) =>
          action.type === 'pdf' ? { ...action, url: result.url ?? action.url ?? null } : action,
        ),
      }));
      setSuccessMessage('PDF generado correctamente.');
    } catch (error) {
      console.error('Failed to generate quote PDF', error);
      const message = error instanceof Error ? error.message : 'No fue posible generar el PDF de la cotización.';
      setErrorMessage(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setActionLoading(null);
    }
  }, [quoteId]);

  const handleSendEmail = useCallback(
    async (payload: SendQuoteEmailInput) => {
      setActionLoading('email');
      setErrorMessage(null);
      setSuccessMessage(null);
      try {
        const result = await sendAdminQuoteEmailApi(quoteId, payload);
        const recipients = result.recipients.join(', ');
        setSuccessMessage(`Cotización enviada correctamente a ${recipients}.`);
      } catch (error) {
        console.error('Failed to send quote email', error);
        const message = error instanceof Error ? error.message : 'No fue posible enviar la cotización por correo.';
        setErrorMessage(message);
        throw error instanceof Error ? error : new Error(message);
      } finally {
        setActionLoading(null);
      }
    },
    [quoteId],
  );

  const handleConvertToInvoice = useCallback(async () => {
    setActionLoading('invoice');
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const result = await convertAdminQuoteToInvoiceApi(quoteId);
      if (result.alreadyConverted) {
        setSuccessMessage('La cotización ya estaba convertida en factura.');
      } else {
        setSuccessMessage('Factura generada correctamente a partir de la cotización.');
      }
      await refreshQuote();
    } catch (error) {
      console.error('Failed to convert quote to invoice', error);
      const message = error instanceof Error ? error.message : 'No fue posible convertir la cotización en factura.';
      setErrorMessage(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setActionLoading(null);
    }
  }, [quoteId, refreshQuote]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Breadcrumbs
            items={[
              { label: 'Panel admin', href: `/${locale}/admin/dashboard` },
              { label: 'Cotizaciones', href: `/${locale}/admin/quotes` },
              { label: quote.reference },
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900">Detalle de cotización</h1>
        </div>
        <Link
          href={`/${locale}/admin/quotes`}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" /> Regresar
        </Link>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6">
        <QuoteDetailInspector
          quote={quote}
          loading={isLoading}
          locale={locale}
          onGeneratePdf={handleGeneratePdf}
          onSendEmail={handleSendEmail}
          onConvertToInvoice={handleConvertToInvoice}
          actionLoading={actionLoading}
          errorMessage={errorMessage}
          successMessage={successMessage}
          mode="page"
        />
      </div>
    </div>
  );
}