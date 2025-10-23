import type { AdminInvoiceCatalog, AdminInvoiceRecord } from '@admin/data/invoices';
import InvoiceDetailView from '@admin/invoices/components/InvoiceDetailView';
import { getAdminInvoiceByIdApi, getAdminInvoiceCatalogApi } from '@shared/services/conexion';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

export default async function AdminInvoiceDetailPage(props: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await props.params;
  void locale;

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    notFound();
  }

  let invoice: AdminInvoiceRecord | null = null;
  let catalog: AdminInvoiceCatalog = { clients: [], services: [] };

  try {
    invoice = await getAdminInvoiceByIdApi(id, token);
    if (!invoice) {
      notFound();
    }
  } catch (loadError) {
    console.error('AdminInvoiceDetailPage load error', loadError);
    notFound();
  }

  try {
    catalog = await getAdminInvoiceCatalogApi(token);
  } catch (catalogError) {
    console.error('AdminInvoiceDetailPage catalog error', catalogError);
  }

  if (!invoice) {
    notFound();
  }

  return (
    <div className="lg:px-8">
      <div className="mx-auto w-full space-y-6">
        <InvoiceDetailView invoice={invoice} catalog={catalog} />
      </div>
    </div>
  );
}
