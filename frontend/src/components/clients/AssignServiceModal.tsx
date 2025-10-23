'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Check, Plus, X } from 'lucide-react';
import type { ClientService, ServiceCatalogEntry } from './types';

type AssignServiceModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (service: ClientService) => void;
  servicesCatalog: ServiceCatalogEntry[];
  clientId: string;
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

export default function AssignServiceModal({
  open,
  onClose,
  onSubmit,
  servicesCatalog,
  clientId,
}: AssignServiceModalProps) {
  const [mounted, setMounted] = useState(false);
  const [formState, setFormState] = useState<ServiceFormState>(() => createInitialState(servicesCatalog));

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (open) {
      setFormState(createInitialState(servicesCatalog));
    }
  }, [open, servicesCatalog]);

  const selectedService = useMemo(
    () => servicesCatalog.find((service) => service.id === formState.serviceId) ?? servicesCatalog[0],
    [formState.serviceId, servicesCatalog],
  );

  if (!mounted || !open) {
    return null;
  }

  const handleClose = () => {
    setFormState(createInitialState(servicesCatalog));
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedService) return;
    const now = new Date().toISOString();
    onSubmit({
      id: `cs-${Date.now()}`,
      clientId,
      serviceId: selectedService.id,
      name: selectedService.name,
      createdAt: now,
      updatedAt: now,
      started: formState.started || now,
      delivery: formState.delivery || undefined,
      expiry: formState.expiry || undefined,
      frequency: formState.frequency || selectedService.defaultFrequency,
      unit: formState.unit || selectedService.defaultUnit,
      urlApi: selectedService.supportsApi ? formState.urlApi || undefined : undefined,
      tokenApi: selectedService.supportsApi ? formState.tokenApi || undefined : undefined,
    });
    handleClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[205] flex items-center justify-center bg-slate-900/40 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Asignar servicio</h2>
            <p className="text-sm text-gray-500">
              Selecciona un servicio del catálogo y completa los datos operativos para vincularlo con el cliente.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-5 md:grid-cols-5">
          <div className="space-y-4 md:col-span-3">
            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="service-id">
                Servicio
              </label>
              <select
                id="service-id"
                name="service-id"
                value={formState.serviceId}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    serviceId: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                {servicesCatalog.map((service) => (
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
                  Frecuencia
                </label>
                <input
                  id="service-frequency"
                  value={formState.frequency}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      frequency: event.target.value,
                    }))
                  }
                  placeholder="Ej. Mensual"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
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
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      unit: event.target.value,
                    }))
                  }
                  placeholder="Ej. Meses"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              {selectedService?.supportsApi && (
                <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  <p className="flex items-center gap-2 font-semibold">
                    <Check className="h-4 w-4" /> Integración API disponible
                  </p>
                  <p>Podrás configurar las credenciales de conexión más abajo.</p>
                </div>
              )}
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
            )}
          </div>

          <aside className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:col-span-2">
            <div>
              <p className="text-sm font-semibold text-gray-800">Resumen del servicio</p>
              <p className="mt-1 text-xs text-gray-600">{selectedService?.description}</p>
            </div>
            <div className="rounded-xl border border-dashed border-gray-300 p-3 text-xs text-gray-600">
              <p className="font-semibold text-gray-700">Tabla relacionada</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li><code className="rounded bg-white px-1">client_service</code> almacena las asignaciones.</li>
                <li><code className="rounded bg-white px-1">service_id</code> referencia al catálogo de servicios.</li>
                <li>Los campos <code className="rounded bg-white px-1">frequency</code> y <code className="rounded bg-white px-1">unit</code> controlan la recurrencia.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-white p-3 text-xs text-emerald-700">
              <p className="font-semibold">Buenas prácticas</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Define fechas para facilitar recordatorios automáticos.</li>
                <li>Actualiza los tokens de API periódicamente.</li>
              </ul>
            </div>
          </aside>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Asignar servicio
            </span>
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

