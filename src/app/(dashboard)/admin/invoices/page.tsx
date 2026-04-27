import { requireAdmin } from "@/lib/auth";
import { InvoicesView } from "@/components/invoices/invoices-view";

export default async function AdminInvoicesPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoices & Quotations — Admin</h1>
        <p className="text-muted-foreground">
          Create, manage, and download invoices and quotations as PDF.
        </p>
      </div>
      <InvoicesView />
    </div>
  );
}
