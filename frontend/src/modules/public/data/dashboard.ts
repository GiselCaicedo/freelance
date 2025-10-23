import { cookies } from 'next/headers';

import 'server-only';

const API_BASE_URL
  = process.env.NEXT_PUBLIC_BACKEND_URL
    || process.env.BACKEND_URL
    || 'http://localhost:3001';

export type ClientDashboardSummary = {
  message: string;
  fetchedAt: string;
  notices: Array<{
    id: string;
    title: string;
    description: string;
  }>;
};

type ClientSummaryResponse
  = | { success: true; data: ClientDashboardSummary }
    | { success: false; message?: string };

export async function getClientDashboardSummary(locale: string): Promise<ClientDashboardSummary> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) {
    throw new Error('Missing auth token');
  }

  const response = await fetch(`${API_BASE_URL}/client/dashboard/summary`, {
    cache: 'no-store',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept-Language': locale,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load client dashboard (${response.status})`);
  }

  const payload = (await response.json()) as ClientSummaryResponse;

  if (!payload.success) {
    throw new Error(payload.message ?? 'Client dashboard unavailable');
  }

  return payload.data;
}
