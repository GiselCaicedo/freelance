'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import type { ClientDetailValue, ClientParameter, ClientStatus, ClientType } from './types';

export type ClientFormResult = {
  name: string;
  type: ClientType;
  status: ClientStatus;
  details: ClientDetailValue[];
};

type ClientFormModalProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  parameters: ClientParameter[];
  onSubmit: (result: ClientFormResult) => Promise<void>;
  onClose: () => void;
  defaultValues?: {
    name: string;
    type: ClientType;
    status: ClientStatus;
    details: ClientDetailValue[];
  };
};

export default function ClientFormModal({
  open,
  title,
  submitLabel,
  parameters,
  onSubmit,
  onClose,
  defaultValues,
}: ClientFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(defaultValues?.name ?? '');
  const [type, setType] = useState<ClientType>(defaultValues?.type ?? 'juridica');
  const [status, setStatus] = useState<ClientStatus>(defaultValues?.status ?? 'active');
  const [detailValues, setDetailValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!defaultValues) return;
    setName(defaultValues.name);
    setType(defaultValues.type);
    setStatus(defaultValues.status);
    const mapped: Record<string, string> = {};
    defaultValues.details.forEach((detail) => {
      mapped[detail.parameterId] = detail.value;
    });
    setDetailValues(mapped);
  }, [defaultValues]);

  useEffect(() => {
    if (!open && mounted) {
      const mapped: Record<string, string> = {};
      parameters.forEach((parameter) => {
        mapped[parameter.id] = defaultValues?.details.find((detail) => detail.parameterId === parameter.id)?.value ?? '';
      });
      setDetailValues(mapped);
    }
  }, [open, mounted, parameters, defaultValues]);

  useEffect(() => {
    if (!open) return;
    const mapped: Record<string, string> = {};
    parameters.forEach((parameter) => {
      mapped[parameter.id] = detailValues[parameter.id] ?? '';
    });
    setDetailValues(mapped);
  }, [parameters, open]);

  const orderedParameters = useMemo(
    () => parameters.map((parameter) => ({ ...parameter })),
    [parameters],
  );

  if (!mounted || !open) {
    return null;
  }

  const resetState = () => {
    if (!defaultValues) {
      setName('');
      setType('juridica');
      setStatus('active');
    }
    setFormError(null);
    setIsSubmitting(false);
    const mapped: Record<string, string> = {};
    orderedParameters.forEach((parameter) => {
      mapped[parameter.id] = defaultValues?.details.find((detail) => detail.parameterId === parameter.id)?.value ?? '';
    });
    setDetailValues(mapped);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const details: ClientDetailValue[] = orderedParameters
      .map((parameter) => ({
        parameterId: parameter.id,
        value: detailValues[parameter.id]?.trim() ?? '',
      }))
      .filter((detail) => detail.value.length > 0);

    try {
      setIsSubmitting(true);
      setFormError(null);
      await onSubmit({
        name: name.trim(),
        type,
        status,
        details,
      });
      resetState();
      onClose();
    } catch (error: any) {
      setFormError(error?.message ?? 'No fue posible guardar el cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (

      <form onSubmit={handleSubmit} className="min-h-full flex flex-col">
        <div className="grid gap-6 px-5 py-5">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="client-name">
                Nombre del cliente
              </label>
              <input
                id="client-name"
                name="client-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Ej. Corporación Demo"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Tipo de cliente</span>
                <div className="mt-2 flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-sm">
                  {[
                    { value: 'natural', label: 'Natural' },
                    { value: 'juridica', label: 'Jurídica' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setType(option.value as ClientType)}
                      className={`flex-1 rounded-md px-3 py-2 transition ${
                        type === option.value
                          ? 'bg-white font-medium text-emerald-600'
                          : 'text-gray-600 hover:bg-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="client-status">
                  Estado
                </label>
                <select
                  id="client-status"
                  name="client-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ClientStatus)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="active">Activo</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>

            <div>
        
              <div className="mt-4 space-y-4">
                {orderedParameters.map((parameter) => (
                  <div key={parameter.id} className="rounded-lg border border-gray-200 bg-white p-3">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500" htmlFor={`parameter-${parameter.id}`}>
                      {parameter.name}
                    </label>
                    <input
                      id={`parameter-${parameter.id}`}
                      name={`parameter-${parameter.id}`}
                      value={detailValues[parameter.id] ?? ''}
                      onChange={(event) =>
                        setDetailValues((prev) => ({
                          ...prev,
                          [parameter.id]: event.target.value,
                        }))
                      }
                      placeholder="Añade un valor"
                      className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-3 border-t border-gray-100 px-5 py-4">
          {formError ? (
            <p className="text-xs text-red-600">{formError}</p>
          ) : null}
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
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting ? 'Guardando…' : submitLabel}
          </button>
          </div>
        </div>
      </form>
  );
}

