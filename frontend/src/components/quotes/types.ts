export type QuoteStatus = 'pendiente' | 'aprobada' | 'rechazada';

export type QuoteActionType = 'pdf' | 'email' | 'invoice';

export type QuoteSummary = {
  id: string;
  reference: string;
  client: {
    id: string | null;
    name: string;
  };
  issuedAt: string | null;
  updatedAt: string | null;
  status: QuoteStatus;
  services: number;
  amount: number;
  pdfUrl: string | null;
};

export type QuoteServiceEntry = {
  id: string;
  serviceId: string | null;
  serviceName: string;
  quantity: number;
  unit: string | null;
  total: number;
  status: QuoteStatus;
};

export type QuoteAttachmentEntry = {
  id: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  invoiceStatus: QuoteStatus | 'en_proceso';
  invoiceAmount: number;
  invoiceUrl: string | null;
};

export type QuoteAction = {
  type: QuoteActionType;
  label: string;
  available: boolean;
  url?: string | null;
  disabledReason?: string | null;
};

export type QuoteDetail = {
  id: string;
  reference: string;
  description: string | null;
  status: QuoteStatus;
  amount: number;
  issuedAt: string | null;
  updatedAt: string | null;
  client: {
    id: string | null;
    name: string;
  };
  services: QuoteServiceEntry[];
  attachments: QuoteAttachmentEntry[];
  actions: QuoteAction[];
};

export type SendQuoteEmailInput = {
  recipients: string[];
  message?: string | null;
};

export type QuotePdfResult = {
  id: string;
  url: string | null;
  generatedAt: string | null;
};

export type QuoteEmailResult = {
  id: string;
  subject: string;
  recipients: string[];
  message: string | null;
  sentAt: string;
};

export type QuoteInvoiceResult = {
  invoiceId: string;
  alreadyConverted: boolean;
  description?: string | null;
  amount?: number | null;
  createdAt?: string | null;
};