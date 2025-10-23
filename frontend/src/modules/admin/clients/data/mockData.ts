export type ClientType = 'natural' | 'juridica';

export type ClientStatus = 'active' | 'inactive' | 'onboarding';

export type ClientParameter = {
  id: string;
  name: string;
};

export type ClientDetailValue = {
  parameterId: string;
  value: string;
};

export type ClientService = {
  id: string;
  clientId: string;
  serviceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  started: string;
  delivery?: string;
  expiry?: string;
  frequency?: string;
  unit?: string;
  urlApi?: string;
  tokenApi?: string;
};

export type ClientQuote = {
  id: string;
  reference: string;
  issuedAt: string;
  amount: number;
  status: 'aprobada' | 'pendiente' | 'rechazada';
};

export type ClientPayment = {
  id: string;
  reference: string;
  paidAt: string;
  amount: number;
  method: 'transferencia' | 'tarjeta' | 'efectivo';
};

export type ClientInvoice = {
  id: string;
  number: string;
  issuedAt: string;
  dueAt: string;
  amount: number;
  status: 'pagada' | 'pendiente' | 'vencida';
};

export type ClientReminder = {
  id: string;
  concept: string;
  dueAt: string;
  amount: number;
  status: 'pendiente' | 'enviado' | 'confirmado';
};

export type ClientRecord = {
  id: string;
  name: string;
  type: ClientType;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
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
  defaultFrequency?: string;
  defaultUnit?: string;
  supportsApi?: boolean;
};

export const clientParameters: ClientParameter[] = [
  { id: 'industry', name: 'Industria' },
  { id: 'document', name: 'Documento' },
  { id: 'contact', name: 'Persona de contacto' },
  { id: 'billing', name: 'Correo de facturación' },
];

export const serviceCatalog: ServiceCatalogEntry[] = [
  {
    id: 'srv-001',
    name: 'Facturación electrónica',
    description: 'Implementación completa de facturación electrónica y certificados.',
    defaultFrequency: 'Mensual',
    defaultUnit: 'Meses',
    supportsApi: true,
  },
  {
    id: 'srv-002',
    name: 'Gestión tributaria',
    description: 'Gestión periódica de obligaciones fiscales y reportes.',
    defaultFrequency: 'Trimestral',
    defaultUnit: 'Meses',
  },
  {
    id: 'srv-003',
    name: 'Payroll outsourcing',
    description: 'Administración mensual de nóminas y prestaciones sociales.',
    defaultFrequency: 'Mensual',
    defaultUnit: 'Meses',
  },
];

export const mockClients: ClientRecord[] = [
  {
    id: 'client-001',
    name: 'Cifra Labs CA',
    type: 'juridica',
    status: 'active',
    createdAt: '2023-09-12T10:00:00.000Z',
    updatedAt: '2024-03-05T09:15:00.000Z',
    details: [
      { parameterId: 'industry', value: 'Tecnología financiera' },
      { parameterId: 'document', value: 'J-412345678-1' },
      { parameterId: 'contact', value: 'Laura Rivas' },
      { parameterId: 'billing', value: 'facturacion@cifralabs.com' },
    ],
    services: [
      {
        id: 'cs-100',
        clientId: 'client-001',
        serviceId: 'srv-001',
        name: 'Facturación electrónica',
        createdAt: '2023-09-15T15:00:00.000Z',
        updatedAt: '2024-02-28T13:00:00.000Z',
        started: '2023-10-01T00:00:00.000Z',
        delivery: '2023-10-20T00:00:00.000Z',
        frequency: 'Mensual',
        unit: 'Meses',
        urlApi: 'https://api.cifralabs.com/billing',
        tokenApi: '****-LABS',
      },
      {
        id: 'cs-101',
        clientId: 'client-001',
        serviceId: 'srv-002',
        name: 'Gestión tributaria',
        createdAt: '2023-09-15T15:00:00.000Z',
        updatedAt: '2024-01-10T13:00:00.000Z',
        started: '2023-11-01T00:00:00.000Z',
        frequency: 'Trimestral',
        unit: 'Meses',
      },
    ],
    quotes: [
      {
        id: 'qt-890',
        reference: 'Q-2024-018',
        issuedAt: '2024-02-05T00:00:00.000Z',
        amount: 4200,
        status: 'aprobada',
      },
      {
        id: 'qt-877',
        reference: 'Q-2023-122',
        issuedAt: '2023-11-21T00:00:00.000Z',
        amount: 1800,
        status: 'pendiente',
      },
    ],
    payments: [
      {
        id: 'pay-545',
        reference: 'RC-2024-0032',
        paidAt: '2024-02-28T00:00:00.000Z',
        amount: 2100,
        method: 'transferencia',
      },
      {
        id: 'pay-498',
        reference: 'RC-2024-0012',
        paidAt: '2024-01-31T00:00:00.000Z',
        amount: 2100,
        method: 'tarjeta',
      },
    ],
    invoices: [
      {
        id: 'inv-120',
        number: 'F-2024-00065',
        issuedAt: '2024-02-01T00:00:00.000Z',
        dueAt: '2024-02-28T00:00:00.000Z',
        amount: 4200,
        status: 'pagada',
      },
      {
        id: 'inv-098',
        number: 'F-2023-00188',
        issuedAt: '2023-11-01T00:00:00.000Z',
        dueAt: '2023-11-30T00:00:00.000Z',
        amount: 1800,
        status: 'pendiente',
      },
    ],
    reminders: [
      {
        id: 'rm-400',
        concept: 'Renovación certificados SENIAT',
        dueAt: '2024-04-10T00:00:00.000Z',
        amount: 950,
        status: 'pendiente',
      },
      {
        id: 'rm-401',
        concept: 'Pago servicio gestión tributaria',
        dueAt: '2024-05-01T00:00:00.000Z',
        amount: 1400,
        status: 'enviado',
      },
    ],
  },
  {
    id: 'client-002',
    name: 'Distribuidora Andina',
    type: 'juridica',
    status: 'onboarding',
    createdAt: '2024-01-17T12:00:00.000Z',
    updatedAt: '2024-03-01T08:00:00.000Z',
    details: [
      { parameterId: 'industry', value: 'Retail y consumo masivo' },
      { parameterId: 'document', value: 'J-289456123-7' },
      { parameterId: 'contact', value: 'Carlos Medina' },
      { parameterId: 'billing', value: 'contabilidad@andinaretail.com' },
    ],
    services: [
      {
        id: 'cs-200',
        clientId: 'client-002',
        serviceId: 'srv-003',
        name: 'Payroll outsourcing',
        createdAt: '2024-01-20T12:00:00.000Z',
        updatedAt: '2024-02-25T11:00:00.000Z',
        started: '2024-02-01T00:00:00.000Z',
        frequency: 'Mensual',
        unit: 'Meses',
      },
    ],
    quotes: [
      {
        id: 'qt-903',
        reference: 'Q-2024-045',
        issuedAt: '2024-01-22T00:00:00.000Z',
        amount: 3600,
        status: 'aprobada',
      },
    ],
    payments: [
      {
        id: 'pay-601',
        reference: 'RC-2024-0045',
        paidAt: '2024-02-20T00:00:00.000Z',
        amount: 1800,
        method: 'transferencia',
      },
    ],
    invoices: [
      {
        id: 'inv-145',
        number: 'F-2024-00082',
        issuedAt: '2024-02-01T00:00:00.000Z',
        dueAt: '2024-02-25T00:00:00.000Z',
        amount: 1800,
        status: 'pagada',
      },
    ],
    reminders: [
      {
        id: 'rm-430',
        concept: 'Declaración ISLR',
        dueAt: '2024-05-15T00:00:00.000Z',
        amount: 600,
        status: 'pendiente',
      },
    ],
  },
  {
    id: 'client-003',
    name: 'Mariana López',
    type: 'natural',
    status: 'inactive',
    createdAt: '2022-06-03T08:30:00.000Z',
    updatedAt: '2023-09-12T10:30:00.000Z',
    details: [
      { parameterId: 'industry', value: 'Consultoría independiente' },
      { parameterId: 'document', value: 'V-17.321.654' },
      { parameterId: 'contact', value: 'Mariana López' },
      { parameterId: 'billing', value: 'mlopez.consultoria@gmail.com' },
    ],
    services: [],
    quotes: [
      {
        id: 'qt-755',
        reference: 'Q-2023-064',
        issuedAt: '2023-07-18T00:00:00.000Z',
        amount: 950,
        status: 'rechazada',
      },
    ],
    payments: [
      {
        id: 'pay-410',
        reference: 'RC-2023-0201',
        paidAt: '2023-03-10T00:00:00.000Z',
        amount: 480,
        method: 'tarjeta',
      },
    ],
    invoices: [
      {
        id: 'inv-080',
        number: 'F-2023-00045',
        issuedAt: '2023-03-01T00:00:00.000Z',
        dueAt: '2023-03-20T00:00:00.000Z',
        amount: 480,
        status: 'pagada',
      },
    ],
    reminders: [
      {
        id: 'rm-389',
        concept: 'Renovación asesoría contable',
        dueAt: '2024-07-05T00:00:00.000Z',
        amount: 350,
        status: 'pendiente',
      },
    ],
  },
];

export const cloneClient = (client: ClientRecord): ClientRecord => ({
  ...client,
  details: client.details.map(detail => ({ ...detail })),
  services: client.services.map(service => ({ ...service })),
  quotes: client.quotes.map(quote => ({ ...quote })),
  payments: client.payments.map(payment => ({ ...payment })),
  invoices: client.invoices.map(invoice => ({ ...invoice })),
  reminders: client.reminders.map(reminder => ({ ...reminder })),
});

export const cloneParameters = (): ClientParameter[] => clientParameters.map(parameter => ({ ...parameter }));

export const cloneServiceCatalog = (): ServiceCatalogEntry[] => serviceCatalog.map(service => ({ ...service }));

export const getClientById = (id: string): ClientRecord | undefined =>
  mockClients.find(client => client.id === id);
