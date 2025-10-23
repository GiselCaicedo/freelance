'use client';

import type {
  AdminInvoiceAttachment,
  AdminInvoiceCatalog,
  AdminInvoiceRecord,
  AdminInvoiceStatus,
  PersistAdminInvoiceInput,
} from '@admin/data/invoices';
import type {
  AdminInvoiceDownloadFormat,
} from '@shared/services/conexion';
import InvoiceForm from '@admin/invoices/components/InvoiceForm';
import {
  deleteAdminInvoiceApi,
  downloadAdminInvoiceArtifactApi,
  sendAdminInvoiceEmailApi,
  updateAdminInvoiceApi,
} from '@shared/services/conexion';
import { ArrowLeft, Download, Mail, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

const STATUS_LABELS: Record<AdminInvoiceStatus, string> = {
  paid: 'Pagada',
  pending: 'Pendiente',
  overdue: 'Vencida',
  cancelled: 'Anulada',
};

const STATUS_STYLES: Record<AdminInvoiceStatus, string> = {
  paid: 'bg-sky-50 text-sky-700 border-sky-100',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  overdue: 'bg-rose-50 text-rose-700 border-rose-100',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

const formatCurrency = (value: number) =>
  value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return '—';
  }
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (value: string | null) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const inferFilename = (attachment: AdminInvoiceAttachment, invoiceNumber: string) =>
  attachment?.label ?? `${invoiceNumber}.${attachment.type}`;

export default function InvoiceDetailView({
  invoice,
  catalog,
}: {
  invoice: AdminInvoiceRecord;
  catalog: AdminInvoiceCatalog;
}) {
  const router = useRouter();
  const [invoiceState, setInvoiceState] = useState<AdminInvoiceRecord>(invoice);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<AdminInvoiceDownloadFormat | null>(null);

  const attachments = useMemo(() => invoiceState.attachments ?? [], [invoiceState.attachments]);
  const details = useMemo(() => invoiceState.details ?? [], [invoiceState.details]);
  const derivedSubtotal = useMemo(
    () =>
      details.reduce((acc, detail) => {
        const value = typeof detail.total === 'number' ? detail.total : 0;
        return acc + (Number.isFinite(value) ? value : 0);
      }, 0),
    [details],
  );
  const subtotal = invoiceState.subtotal ?? derivedSubtotal ?? invoiceState.amount;
  const tax1 = invoiceState.tax1 ?? 0;
  const tax2 = invoiceState.tax2 ?? 0;
  const vatRate = invoiceState.vatRate ?? 0.19;
  const vatAmount = invoiceState.vatIncluded ? subtotal * vatRate : 0;
  const totalAmount = subtotal + tax1 + tax2 + vatAmount;
  const vatLabel = invoiceState.vatIncluded ? `IVA (${(vatRate * 100).toFixed(0)}%)` : 'IVA';

  const handleBack = () => {
    router.back();
  };

  const handleDownload = async (attachment: AdminInvoiceAttachment) => {
    setDownloadingFormat(attachment.type);
    try {
      const blob = await downloadAdminInvoiceArtifactApi(invoiceState.id, attachment.type);
      downloadBlob(blob, inferFilename(attachment, invoiceState.number));
      setError(null);
    } catch (downloadError: any) {
      console.error('InvoiceDetailView download error', downloadError);
      const messageText = downloadError instanceof Error ? downloadError.message : 'No fue posible descargar el archivo.';
      setError(messageText);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleSendEmail = async () => {
    const recipient = window.prompt('Ingresa el correo del cliente para enviar la factura:');
    if (!recipient) {
      return;
    }
    try {
      const response = await sendAdminInvoiceEmailApi(invoiceState.id, recipient);
      setMessage(response);
      setError(null);
    } catch (emailError: any) {
      console.error('InvoiceDetailView email error', emailError);
      const messageText = emailError instanceof Error ? emailError.message : 'No fue posible enviar la factura.';
      setError(messageText);
      setMessage(null);
    }
  };

  const handleDelete = async () => {
    const confirmation = window.confirm('¿Eliminar esta factura? Esta acción no puede revertirse.');
    if (!confirmation) {
      return;
    }
    try {
      await deleteAdminInvoiceApi(invoiceState.id);
      router.push('../');
    } catch (deleteError: any) {
      console.error('InvoiceDetailView delete error', deleteError);
      const messageText = deleteError instanceof Error ? deleteError.message : 'No fue posible eliminar la factura.';
      setError(messageText);
    }
  };

  const handleFormSubmit = async (payload: PersistAdminInvoiceInput) => {
    setSubmitting(true);
    try {
      const updated = await updateAdminInvoiceApi(invoiceState.id, payload);
      setInvoiceState(updated);
      setIsEditing(false);
      setMessage('Factura actualizada correctamente.');
      setError(null);
    } catch (updateError: any) {
      console.error('InvoiceDetailView update error', updateError);
      const messageText = updateError instanceof Error ? updateError.message : 'No fue posible actualizar la factura.';
      setError(messageText);
      setMessage(null);
    } finally {
      setSubmitting(false);
    }
  };

  const closeEdit = () => {
    setIsEditing(false);
    setMessage(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {' '}
          Volver
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center rounded-md border border-sky-200 px-3 py-1.5 text-sm text-sky-700 transition hover:bg-sky-50"
          >
            <Pencil className="mr-2 h-4 w-4" />
            {' '}
            Editar
          </button>
          <button
            type="button"
            onClick={handleSendEmail}
            className="inline-flex items-center rounded-md border border-sky-200 px-3 py-1.5 text-sm text-sky-700 transition hover:bg-sky-50"
          >
            <Mail className="mr-2 h-4 w-4" />
            {' '}
            Enviar correo
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center rounded-md border border-rose-200 px-3 py-1.5 text-sm text-rose-600 transition hover:bg-rose-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {' '}
            Eliminar
          </button>
        </div>
      </div>

      {message && <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">{message}</div>}
      {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {isEditing
        ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <InvoiceForm
                catalog={catalog}
                variant="edit"
                defaultValue={invoiceState}
                submitting={submitting}
                onSubmit={handleFormSubmit}
                onCancel={closeEdit}
              />
            </div>
          )
        : (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div>
                      <h1 className="text-2xl font-semibold text-gray-900">
                        Factura {invoiceState.number}
                      </h1>
                      <p className="text-sm text-gray-500">
                        Cliente: <span className="font-medium text-gray-700">{invoiceState.clientName}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLES[invoiceState.status]}`}>
                        {STATUS_LABELS[invoiceState.status]}
                      </span>
                    </div>
                    <div className="grid gap-2 rounded-lg bg-slate-50 p-4 text-sm text-gray-600 md:grid-cols-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-500">Subtotal</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-500">Impuesto 1</span>
                        <span>{formatCurrency(tax1)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-500">Impuesto 2</span>
                        <span>{formatCurrency(tax2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-500">{vatLabel}</span>
                        <span>{formatCurrency(vatAmount)}</span>
                      </div>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
                    <div>
                      <dt className="font-medium text-gray-500">Emitida</dt>
                      <dd>{formatDate(invoiceState.issuedAt)}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500">Vence</dt>
                      <dd>{formatDate(invoiceState.dueAt)}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500">Creada</dt>
                      <dd>{formatDateTime(invoiceState.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500">Actualizada</dt>
                      <dd>{formatDateTime(invoiceState.updatedAt)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Servicios facturados</h2>
                <table className="mt-4 min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">Servicio</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">Cantidad</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {details.length > 0
                      ? (
                          details.map(detail => (
                            <tr key={detail.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-700">{detail.serviceName}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{detail.quantity}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(detail.total ?? 0)}</td>
                            </tr>
                          ))
                        )
                      : (
                          <tr>
                            <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">
                              No se registraron servicios en esta factura.
                            </td>
                          </tr>
                        )}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Anexos y descargas</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Consulta los archivos o enlaces generados a partir de la factura.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {attachments.length > 0 ? (
                    attachments.map(attachment => (
                      <button
                        key={attachment.id}
                        type="button"
                        onClick={() => handleDownload(attachment)}
                        disabled={downloadingFormat === attachment.type}
                        className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span>{inferFilename(attachment, invoiceState.number)}</span>
                        <Download className={`h-4 w-4 ${downloadingFormat === attachment.type ? 'animate-bounce' : ''}`} />
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                      No hay anexos disponibles para esta factura.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
    </div>
  );
}
