export type AdminInvoiceStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';

export type AdminInvoiceListItem = {
  id: string;
  number: string;
  clientId: string | null;
  clientName: string;
  amount: number;
  issuedAt: string | null;
  dueAt: string | null;
  status: AdminInvoiceStatus;
  services: number;
};

export type AdminInvoiceLine = {
  id: string;
  item: number | null;
  serviceId: string | null;
  serviceName: string;
  unit: string | null;
  quantity: number;
  total: number;
};

export type AdminInvoiceAttachmentType = 'pdf' | 'xml' | 'zip';

export type AdminInvoiceAttachment = {
  id: string;
  type: AdminInvoiceAttachmentType;
  label: string;
};

export type AdminInvoiceRecord = {
  id: string;
  number: string;
  description: string;
  clientId: string | null;
  clientName: string;
  amount: number;
  issuedAt: string | null;
  dueAt: string | null;
  status: AdminInvoiceStatus;
  url: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  details: AdminInvoiceLine[];
  attachments: AdminInvoiceAttachment[];
};

export type AdminInvoiceCatalog = {
  clients: Array<{ id: string; name: string }>;
  services: Array<{ id: string; name: string; unit: string | null }>;
};

export type PersistAdminInvoiceInput = {
  clientId: string;
  number: string;
  amount: number;
  status: 'paid' | 'pending' | 'cancelled';
  issuedAt?: string | null;
  dueAt?: string | null;
  url?: string | null;
  details: Array<{
    serviceId: string;
    quantity: number;
    total: number;
    item?: number | null;
  }>;
};
