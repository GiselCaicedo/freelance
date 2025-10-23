import type { AdminInvoiceCatalog, AdminInvoiceListItem } from '@admin/data/invoices';
import InvoiceListView from '@admin/invoices/components/InvoiceListView';
import { getAdminInvoiceCatalogApi, getAdminInvoicesApi } from '@shared/services/conexion';
import { cookies } from 'next/headers';

export default async function AdminInvoicesPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  void locale;

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  let invoices: AdminInvoiceListItem[] = [];
  let catalog: AdminInvoiceCatalog = { clients: [], services: [] };
  let error: string | null = null;

  if (!token) {
    error = 'No se encontró una sesión activa.';
  } else {
    try {
      const payload = await getAdminInvoicesApi(token);
      invoices = Array.isArray(payload.invoices) ? payload.invoices : [];
    } catch (loadError) {
      console.error('AdminInvoicesPage list error', loadError);
      error = loadError instanceof Error ? loadError.message : 'No fue posible cargar las facturas.';
    }

    try {
      catalog = await getAdminInvoiceCatalogApi(token);
    } catch (catalogError) {
      console.error('AdminInvoicesPage catalog error', catalogError);
      if (!error) {
        error = catalogError instanceof Error ? catalogError.message : 'No fue posible cargar el catálogo de facturas.';
      }
    }
  }

  return (
    <div className="lg:px-8">
      <div className="mx-auto w-full space-y-6">
        <InvoiceListView initialInvoices={invoices} initialCatalog={catalog} initialError={error} />
      </div>
    </div>
  );
}
