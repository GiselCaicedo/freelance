import 'server-only';

import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL

export interface AdminDashboardSummary {
  period: { from: string; to: string };
  totals: { billed: number; pending: number };
  upcomingExpirations: Array<{
    id: string;
    clientId: string | null;
    clientName: string | null;
    serviceId: string | null;
    serviceName: string | null;
    expiry: string | null;
    daysUntilExpiry: number | null;
    frequency: string | null;
    unit: string | null;
    started: string | null;
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
}

type DashboardSummaryResponse =
  | { success: true; data: AdminDashboardSummary }
  | { success: false; message?: string };

function buildUrl(locale: string, searchParams?: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });
  }

  const query = params.toString();
  const path = '/dashboard/summary';
  const localeQuery = locale ? `locale=${locale}` : '';

  if (query && localeQuery) {
    return `${API_BASE_URL}${path}?${query}&${localeQuery}`;
  }

  if (query) {
    return `${API_BASE_URL}${path}?${query}`;
  }

  if (localeQuery) {
    return `${API_BASE_URL}${path}?${localeQuery}`;
  }

  return `${API_BASE_URL}${path}`;
}

export async function getAdminDashboardSummary({
  locale,
  months,
  monthsAhead,
  limit,
  from,
  to,
}: {
  locale: string;
  months?: number;
  monthsAhead?: number;
  limit?: number;
  from?: string;
  to?: string;
}): Promise<AdminDashboardSummary> {
  const token = cookies().get('auth_token')?.value;

  if (!token) {
    throw new Error('No auth token found');
  }

  const url = buildUrl(locale, {
    months,
    monthsAhead,
    limit,
    from,
    to,
  });

  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept-Language': locale,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load dashboard data (${response.status})`);
  }

  const payload = (await response.json()) as DashboardSummaryResponse;

  if (!payload.success) {
    throw new Error(payload.message ?? 'Unknown dashboard error');
  }

  return payload.data;
}
