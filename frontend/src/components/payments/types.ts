export type PaymentStatus = 'pagado' | 'pendiente' | 'anulado' | 'fallido' | 'otro'

export interface PaymentAttachment {
  id: string
  url: string | null
  invoiceId: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface PaymentRecord {
  id: string
  clientId: string | null
  clientName: string
  reference: string | null
  amount: number
  amountRaw: string | null
  status: PaymentStatus
  statusRaw: string | null
  methodId: string | null
  methodName: string | null
  type: string | null
  receiptUrl: string | null
  createdAt: string | null
  updatedAt: string | null
  attachments: PaymentAttachment[]
}

export interface PaymentMethod {
  id: string
  name: string
}

export interface PaymentClient {
  id: string
  name: string
}

export interface PaymentListPayload {
  payments: PaymentRecord[]
  clients: PaymentClient[]
  methods: PaymentMethod[]
}

export interface PaymentFormAttachment {
  id?: string
  url: string
  invoiceId?: string | null
}

export interface PaymentFormValues {
  clientId: string
  value: string
  status: string | null
  reference?: string | null
  methodId?: string | null
  methodName?: string | null
  receiptUrl?: string | null
  type?: string | null
  paidAt?: string | null
  confirmed?: boolean | null
  attachments: PaymentFormAttachment[]
}

