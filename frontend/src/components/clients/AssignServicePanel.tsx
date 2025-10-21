'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Calendar, Plus, Search } from 'lucide-react';
import type { AssignServiceInput, ServiceCatalogEntry } from './types';

type AssignServicePanelProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: AssignServiceInput) => Promise<void>;
  servicesCatalog: ServiceCatalogEntry[];
};

type ServiceFormState = {
  serviceId: string;
  started: string;
  delivery: string;
  expiry: string;
  frequencyValue: string;
  frequencyUnit: string;
  urlApi: string;
  tokenApi: string;
};

const createInitialState = (catalog: ServiceCatalogEntry[]): ServiceFormState => ({
  serviceId: catalog[0]?.id ?? '',
  started: '',
  delivery: '',
  expiry: '',
  frequencyValue: catalog[0]?.defaultFrequency ?? '',
  frequencyUnit: catalog[0]?.defaultUnit ?? '',
  urlApi: '',
  tokenApi: '',
});

export default function AssignServicePanel({ open, onClose, onSubmit, servicesCatalog }: AssignServicePanelProps) {
  const [formState, setFormState] = useState<ServiceFormState>(() => createInitialState(servicesCatalog));
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormState(createInitialState(servicesCatalog));
      setSearchTerm('');
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [open, servicesCatalog]);

  const filteredServices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return servicesCatalog;
    return servicesCatalog.filter((service) => {
      const name = service.name.toLowerCase();
      const description = service.description?.toLowerCase() ?? '';
      return name.includes(query) || description.includes(query);
    });
  }, [servicesCatalog, searchTerm]);

  const hasCatalog = servicesCatalog.length > 0;

  const selectedService = useMemo(
    () => servicesCatalog.find((service) => service.id === formState.serviceId) ?? null,
    [formState.serviceId, servicesCatalog],
  );

  useEffect(() => {
    if (!open) return;
    if (filteredServices.length === 0) {
      setFormState((prev) => ({
        ...prev,
        serviceId: '',
      }));
      return;
    }

    const matches = filteredServices.some((service) => service.id === formState.serviceId);
    if (!matches) {
      const first = filteredServices[0];
      setFormState((prev) => ({
        ...prev,
        serviceId: first.id,
        frequencyValue: first.defaultFrequency ?? '',
        frequencyUnit: first.defaultUnit ?? '',
      }));
    }
  }, [filteredServices, formState.serviceId, open]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    setFormState(createInitialState(servicesCatalog));
    setSearchTerm('');
    setErrorMessage(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedService) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onSubmit({
        serviceId: selectedService.id,
        started: formState.started || null,
        delivery: formState.delivery || null,
        expiry: formState.expiry || null,
        frequencyValue: formState.frequencyValue || null,
        frequencyUnit: formState.frequencyUnit || null,
        urlApi: selectedService.supportsApi ? formState.urlApi || null : null,
        tokenApi: selectedService.supportsApi ? formState.tokenApi || null : null,
      });
      handleClose();
    } catch (error: any) {
      console.error('Failed to assign service', error);
      const message = error instanceof Error ? error.message : 'No fue posible asignar el servicio.';
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  const canSubmit = filteredServices.length > 0 && Boolean(formState.serviceId) && !isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="min-h-full flex flex-col">
      <div className="grid gap-6 px-5 py-5 md:grid-cols-5">
        <div className="space-y-4 md:col-span-3">
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="service-search">
              Buscar servicio
            </label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="service-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Filtrar por nombre o descripción"
                disabled={!hasCatalog}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 pl-9 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="service-id">
              Servicio
            </label>
            <select
              id="service-id"
              name="service-id"
              value={formState.serviceId}
              onChange={(event) => {
                const nextService = filteredServices.find((service) => service.id === event.target.value);
                setFormState((prev) => ({
                  ...prev,
                  serviceId: event.target.value,
                  frequencyValue: nextService?.defaultFrequency ?? '',
                  frequencyUnit: nextService?.defaultUnit ?? '',
                }));
              }}
              disabled={!hasCatalog}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {filteredServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            {!hasCatalog ? (
              <p className="mt-2 text-xs text-gray-500">No hay servicios disponibles para asignar.</p>
            ) : null}
            {hasCatalog && filteredServices.length === 0 ? (
              <p className="mt-2 text-xs text-gray-500">No se encontraron servicios con el criterio de búsqueda.</p>
            ) : null}
            {selectedService?.description ? (
              <p className="mt-2 text-xs text-gray-500">{selectedService.description}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="service-started">
                Fecha de inicio
              </label>
              <div className="relative mt-1">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="service-started"
                  type="date"
                  value={formState.started}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      started: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 pl-10 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="service-delivery">
                Fecha de entrega
              </label>
              <div className="relative mt-1">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="service-delivery"
                  type="date"
                  value={formState.delivery}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      delivery: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 pl-10 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
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
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="service-expiry"
                  type="date"
                  value={formState.expiry}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      expiry: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 pl-10 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="service-frequency">
                Cantidad consumida
              </label>
              <input
                id="service-frequency"
                value={formState.frequencyValue}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    frequencyValue: event.target.value,
                  }))
                }
                placeholder="Ej. 900"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="service-unit">
                Unidad
              </label>
              <input
                id="service-unit"
                value={formState.frequencyUnit}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    frequencyUnit: event.target.value,
                  }))
                }
                placeholder="Ej. minutos"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>

          {selectedService?.supportsApi ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="service-url">
                  URL de API
                </label>
                <input
                  id="service-url"
                  value={formState.urlApi}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      urlApi: event.target.value,
                    }))
                  }
                  placeholder="https://api.midominio.com/servicio"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="service-token">
                  Token / API Key
                </label>
                <input
                  id="service-token"
                  value={formState.tokenApi}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      tokenApi: event.target.value,
                    }))
                  }
                  placeholder="Token seguro"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {errorMessage ? <p className="px-5 text-sm text-red-600">{errorMessage}</p> : null}

      <div className="mt-auto flex justify-end gap-3 border-t border-gray-100 px-5 py-4">
        <button
          type="button"
          onClick={handleClose}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> {isSubmitting ? 'Asignando…' : 'Asignar servicio'}
          </span>
        </button>
      </div>
    </form>
  );
}
