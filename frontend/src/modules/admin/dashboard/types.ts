export type AdminDashboardSummary = {
  period: { from: string; to: string };
  totals: { billed: number; pending: number; total: number };
  upcomingExpirations: Array<{
    id: string;
    clientId: string | null;
    clientName: string | null;
    invoiceNumber: string | null;
    amount: number;
    expiry: string | null;
    daysUntilExpiry: number | null;
    status: 'pendiente' | 'pagada' | 'vencida';
    url: string | null;
  }>;
  clientStatus: {
    total: number;
    active: number;
    inactive: number;
    unknown: number;
  };
  topServices: Array<{
    serviceId: string;
    serviceName: string | null;
    timesSold: number;
  }>;
  monthlyComparison: Array<{
    month: string;
    billed: number;
    pending: number;
  }>;
};
