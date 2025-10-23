export type PaymentStatus = 'pagado' | 'pendiente' | 'anulado' | 'fallido' | 'otro';

export type PaymentAttachment = {
  id: string;
  url: string | null;
  invoiceId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PaymentRecord = {
  id: string;
  clientId: string | null;
  clientName: string;
  reference: string | null;
  amount: number;
  amountRaw: string | null;
  status: PaymentStatus;
  statusRaw: string | null;
  methodId: string | null;
  methodName: string | null;
  type: string | null;
  receiptUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  attachments: PaymentAttachment[];
};

export type PaymentMethod = {
  id: string;
  name: string;
};

export type PaymentClient = {
  id: string;
  name: string;
};

export type PaymentListPayload = {
  payments: PaymentRecord[];
  clients: PaymentClient[];
  methods: PaymentMethod[];
};

export type PaymentFormAttachment = {
  id?: string;
  url: string;
  invoiceId?: string | null;
};

export type PaymentFormValues = {
  clientId: string;
  value: string;
  status: string | null;
  reference?: string | null;
  methodId?: string | null;
  methodName?: string | null;
  receiptUrl?: string | null;
  type?: string | null;
  paidAt?: string | null;
  confirmed?: boolean | null;
  attachments: PaymentFormAttachment[];
};
