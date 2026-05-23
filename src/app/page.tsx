import { Header } from "@/components/dashboard/header";
import { PendingPrescriptions } from "@/components/dashboard/pending-prescriptions";
import { LiveAppointments } from "@/components/dashboard/live-appointments";
import { StockStatus } from "@/components/dashboard/stock-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Fórmulas pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <PendingPrescriptions />
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Citas agendadas hoy</CardTitle>
              </CardHeader>
              <CardContent>
                <LiveAppointments />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <StockStatus />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
