'use client';

import type { FormEvent } from 'react';
import type { AssignServiceInput, ServiceCatalogEntry } from './types';
import { Calendar, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type AssignServicePanelProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: AssignServiceInput) => Promise<void>;
  servicesCatalog: ServiceCatalogEntry[];
};

type ServiceFormState = {
  serviceId: string;
  started: string;
  delivery: string;
  expiry: string;
  frequency: string;
  unit: string;
  urlApi: string;
  tokenApi: string;
};

const createInitialState = (catalog: ServiceCatalogEntry[]): ServiceFormState => ({
  serviceId: catalog[0]?.id ?? '',
  started: '',
  delivery: '',
  expiry: '',
  frequency: catalog[0]?.defaultFrequency ?? '',
  unit: catalog[0]?.defaultUnit ?? '',
  urlApi: '',
  tokenApi: '',
});

const toIsoString = (value: string): string | null => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

export default function AssignServicePanel({
  open,
  onClose,
  onSubmit,
  servicesCatalog,
}: AssignServicePanelProps) {
  const [formState, setFormState] = useState<ServiceFormState>(() => createInitialState(servicesCatalog));
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormState(createInitialState(servicesCatalog));
      setErrorMessage(null);
    }
  }, [open, servicesCatalog]);

  const selectedService = useMemo(
    () => servicesCatalog.find(service => service.id === formState.serviceId) ?? servicesCatalog[0],
    [formState.serviceId, servicesCatalog],
  );

  const hasCatalog = servicesCatalog.length > 0;

  if (!open) {
    return null;
  }

  const handleClose = () => {
    setFormState(createInitialState(servicesCatalog));
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedService) {
      setErrorMessage('Debes seleccionar un servicio.');
      return;
    }

    const payload: AssignServiceInput = {
      serviceId: selectedService.id,
      started: toIsoString(formState.started),
      delivery: toIsoString(formState.delivery),
      expiry: toIsoString(formState.expiry),
      frequency: formState.frequency?.trim() || selectedService.defaultFrequency || null,
      unit: formState.unit?.trim() || selectedService.defaultUnit || null,
      urlApi: selectedService.supportsApi ? formState.urlApi?.trim() || null : null,
      tokenApi: selectedService.supportsApi ? formState.tokenApi?.trim() || null : null,
    };

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await onSubmit(payload);
      handleClose();
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'No fue posible asignar el servicio.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-full flex-col">
      <div className="grid gap-6 px-5 py-5">
        <div className="space-y-4 md:col-span-3">
          {!hasCatalog
            ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  No hay servicios disponibles para asignar. Configura el catálogo desde el panel de administración.
                </p>
              )
            : null}

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="service-id">
              Servicio
            </label>
            <select
              id="service-id"
              name="service-id"
              value={formState.serviceId}
              onChange={event =>
                setFormState(prev => ({
                  ...prev,
                  serviceId: event.target.value,
                }))}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
              disabled={!hasCatalog || submitting}
            >
              {servicesCatalog.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="service-started">
                Fecha de inicio
              </label>
              <div className="relative mt-1">
                <Calendar className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="service-started"
                  type="date"
                  value={formState.started}
                  onChange={event =>
                    setFormState(prev => ({
                      ...prev,
                      started: event.target.value,
                    }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 pl-10 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="service-delivery">
                Fecha de entrega
              </label>
              <div className="relative mt-1">
                <Calendar className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="service-delivery"
                  type="date"
                  value={formState.delivery}
                  onChange={event =>
                    setFormState(prev => ({
                      ...prev,
                      delivery: event.target.value,
                    }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 pl-10 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="service-expiry">
                Fecha de expiración
              </label>
              <div className="relative mt-1">
                <Calendar className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="service-expiry"
                  type="date"
                  value={formState.expiry}
                  onChange={event =>
                    setFormState(prev => ({
                      ...prev,
                      expiry: event.target.value,
                    }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 pl-10 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="service-frequency">
                Frecuencia
              </label>
              <input
                id="service-frequency"
                value={formState.frequency}
                onChange={event =>
                  setFormState(prev => ({
                    ...prev,
                    frequency: event.target.value,
                  }))}
                placeholder="Ej. Mensual"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="service-unit">
                Unidad de frecuencia
              </label>
              <input
                id="service-unit"
                value={formState.unit}
                onChange={event =>
                  setFormState(prev => ({
                    ...prev,
                    unit: event.target.value,
                  }))}
                placeholder="Ej. Meses"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                disabled={submitting}
              />
            </div>
          </div>

          {selectedService?.supportsApi && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="service-url">
                  URL de API
                </label>
                <input
                  id="service-url"
                  value={formState.urlApi}
                  onChange={event =>
                    setFormState(prev => ({
                      ...prev,
                      urlApi: event.target.value,
                    }))}
                  placeholder="https://api.midominio.com/servicio"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="service-token">
                  Token / API Key
                </label>
                <input
                  id="service-token"
                  value={formState.tokenApi}
                  onChange={event =>
                    setFormState(prev => ({
                      ...prev,
                      tokenApi: event.target.value,
                    }))}
                  placeholder="Token seguro"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  disabled={submitting}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {errorMessage ? <p className="px-5 text-sm text-red-600">{errorMessage}</p> : null}

      <div className="mt-auto flex justify-end gap-3 border-t border-gray-100 px-5 py-4">
        <button
          type="button"
          onClick={handleClose}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!hasCatalog || submitting}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {' '}
            {submitting ? 'Asignando…' : 'Asignar servicio'}
          </span>
        </button>
      </div>
    </form>
  );
}
