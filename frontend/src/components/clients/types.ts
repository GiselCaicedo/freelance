export type ClientType = 'natural' | 'juridica';

export type ClientStatus = 'active' | 'inactive' | 'onboarding';

export type ClientParameter = {
  id: string;
  name: string;
};

export type ClientDetailValue = {
  parameterId: string;
  parameterName?: string | null;
  value: string;
};

export type ClientService = {
  id: string;
  clientId: string;
  serviceId: string;
  name: string;
  createdAt: string | null;
  updatedAt: string | null;
  started: string | null;
  delivery?: string | null;
  expiry?: string | null;
  frequency?: string | null;
  unit?: string | null;
  urlApi?: string | null;
  tokenApi?: string | null;
};

export type ClientQuoteStatus = 'aprobada' | 'pendiente' | 'rechazada';

export type ClientQuote = {
  id: string;
  reference: string;
  issuedAt: string | null;
  amount: number;
  status: ClientQuoteStatus;
};

export type ClientPayment = {
  id: string;
  reference: string;
  paidAt: string | null;
  amount: number;
  method: string;
};

export type ClientInvoiceStatus = 'pagada' | 'pendiente' | 'vencida';

export type ClientInvoice = {
  id: string;
  number: string;
  issuedAt: string | null;
  dueAt: string | null;
  amount: number;
  status: ClientInvoiceStatus;
};

export type ClientReminderStatus = 'pendiente' | 'enviado' | 'confirmado';

export type ClientReminder = {
  id: string;
  concept: string;
  dueAt: string | null;
  amount: number;
  status: ClientReminderStatus;
};

export type ClientRecord = {
  id: string;
  name: string;
  type: ClientType;
  status: ClientStatus;
  createdAt: string | null;
  updatedAt: string | null;
  details: ClientDetailValue[];
  services: ClientService[];
  quotes: ClientQuote[];
  payments: ClientPayment[];
  invoices: ClientInvoice[];
  reminders: ClientReminder[];
};

export type ServiceCatalogEntry = {
  id: string;
  name: string;
  description: string;
  defaultFrequency?: string | null;
  defaultUnit?: string | null;
  supportsApi?: boolean;
};
