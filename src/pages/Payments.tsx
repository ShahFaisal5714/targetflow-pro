import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockInvoices } from '@/data/mockData';
import { CreditCard, DollarSign, TrendingUp, AlertCircle, Plus, Receipt } from 'lucide-react';

export default function Payments() {
  const totalReceived = mockInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalPending = mockInvoices.reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);
  const overdueInvoices = mockInvoices.filter((inv) => inv.status === 'overdue');

  const recentPayments = [
    { id: 'PAY-001', invoiceNumber: 'INV-2024-0001', amount: 50000, date: '2024-03-15', method: 'Bank Transfer' },
    { id: 'PAY-002', invoiceNumber: 'INV-2024-0002', amount: 86572.50, date: '2024-02-10', method: 'Cheque' },
  ];

  return (
    <MainLayout>
      <Header
        title="Payments"
        subtitle="Track payments and outstanding balances"
        action={{
          label: 'Record Payment',
          onClick: () => console.log('Record payment'),
        }}
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-success to-success/80 text-success-foreground rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5" />
              <p className="text-sm text-success-foreground/80">Total Received</p>
            </div>
            <p className="text-3xl font-bold">AED {totalReceived.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>+12.5% this month</span>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-5 w-5 text-warning" />
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <p className="text-3xl font-bold text-foreground">AED {totalPending.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {mockInvoices.filter((i) => i.status === 'partial' || i.status === 'sent').length} invoices
            </p>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
            <p className="text-3xl font-bold text-destructive">
              AED {overdueInvoices.reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-2">{overdueInvoices.length} invoice(s)</p>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Collection Rate</p>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {Math.round((totalReceived / (totalReceived + totalPending)) * 100)}%
            </p>
            <p className="text-sm text-muted-foreground mt-2">This quarter</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Recent Payments</h3>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                        <DollarSign className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{payment.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">{payment.method}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-success">+AED {payment.amount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Outstanding Invoices */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Outstanding Invoices</h3>
                <Button variant="outline" size="sm">
                  Send Reminders
                </Button>
              </div>
              <div className="space-y-4">
                {mockInvoices
                  .filter((inv) => inv.status !== 'paid')
                  .map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            invoice.status === 'overdue' ? 'bg-destructive/10' : 'bg-warning/10'
                          }`}
                        >
                          <Receipt
                            className={`h-5 w-5 ${
                              invoice.status === 'overdue' ? 'text-destructive' : 'text-warning'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          AED {(invoice.total - invoice.paidAmount).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Due {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
