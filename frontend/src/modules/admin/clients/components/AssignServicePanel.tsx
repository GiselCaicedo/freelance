'use client';

import type { FormEvent } from 'react';
import type { AssignServiceInput, ClientService, ServiceCatalogEntry } from './types';
import { Calendar, Check, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type AssignServicePanelProps = {
  open: boolean;
  mode: 'create' | 'edit';
  service?: ClientService | null;
  onClose: () => void;
  onSubmit: (input: AssignServiceInput, assignmentId?: string) => Promise<void>;
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

const createInitialState = (catalog: ServiceCatalogEntry[], current?: ClientService | null): ServiceFormState => {
  if (current) {
    return {
      serviceId: current.serviceId,
      started: toDateInput(current.started),
      delivery: toDateInput(current.delivery ?? null),
      expiry: toDateInput(current.expiry ?? null),
      frequency: current.frequency ?? '',
      unit: current.unit ?? '',
      urlApi: current.urlApi ?? '',
      tokenApi: current.tokenApi ?? '',
    };
  }

  return {
    serviceId: catalog[0]?.id ?? '',
    started: '',
    delivery: '',
    expiry: '',
    frequency: catalog[0]?.defaultFrequency ?? '',
    unit: catalog[0]?.defaultUnit ?? '',
    urlApi: '',
    tokenApi: '',
  };
};

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

const toDateInput = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export default function AssignServicePanel({
  open,
  mode,
  service = null,
  onClose,
  onSubmit,
  servicesCatalog,
}: AssignServicePanelProps) {
  const [formState, setFormState] = useState<ServiceFormState>(() => createInitialState(servicesCatalog, service ?? null));
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormState(createInitialState(servicesCatalog, service ?? null));
      setErrorMessage(null);
    }
  }, [open, servicesCatalog, service]);

  const selectedService = useMemo(
    () => {
      const found = servicesCatalog.find(entry => entry.id === formState.serviceId);
      if (found) {
        return found;
      }
      if (service) {
        return {
          id: service.serviceId,
          name: service.name,
          description: '',
          defaultFrequency: service.frequency ?? '',
          defaultUnit: service.unit ?? '',
          supportsApi: Boolean(service.urlApi || service.tokenApi),
        } satisfies ServiceCatalogEntry;
      }
      return servicesCatalog[0];
    },
    [formState.serviceId, servicesCatalog, service],
  );

  const hasCatalog = servicesCatalog.length > 0;

  if (!open) {
    return null;
  }

  const handleClose = () => {
    setFormState(createInitialState(servicesCatalog, service ?? null));
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
      await onSubmit(payload, service?.id);
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
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
              disabled={!hasCatalog || submitting || mode === 'edit'}
            >
              {servicesCatalog.map(serviceOption => (
                <option key={serviceOption.id} value={serviceOption.id}>
                  {serviceOption.name}
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
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 pl-10 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
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
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 pl-10 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
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
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 pl-10 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
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
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
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
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
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
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
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
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
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
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex items-center gap-2">
            {mode === 'edit' ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {' '}
            {submitting ? (mode === 'edit' ? 'Guardando…' : 'Asignando…') : mode === 'edit' ? 'Guardar cambios' : 'Asignar servicio'}
          </span>
        </button>
      </div>
    </form>
  );
}
