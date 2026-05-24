import { Header } from "@/components/dashboard/header";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PendingPrescriptions } from "@/components/dashboard/pending-prescriptions";
import { LiveAppointments } from "@/components/dashboard/live-appointments";
import { StockStatus } from "@/components/dashboard/stock-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 border border-[#e0e0e0] bg-[#f4f4f4] px-4 py-3">
          <p className="text-sm text-[#525252]">
            Monitorea llamadas, turnos y disponibilidad de medicamentos.
          </p>
        </div>
        <div className="mb-6">
          <KpiStrip />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="gap-3 rounded-none border border-[#e0e0e0] bg-white py-0 shadow-none ring-0 lg:col-span-2">
            <CardHeader className="rounded-none border-b border-[#e0e0e0] px-4 py-3">
              <CardTitle className="text-base font-normal text-[#161616]">
                Formulas pendientes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-4">
              <PendingPrescriptions />
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card className="gap-3 rounded-none border border-[#e0e0e0] bg-white py-0 shadow-none ring-0">
              <CardHeader className="rounded-none border-b border-[#e0e0e0] px-4 py-3">
                <CardTitle className="text-base font-normal text-[#161616]">
                  Citas agendadas hoy
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-4">
                <LiveAppointments />
              </CardContent>
            </Card>
            <Card className="gap-3 rounded-none border border-[#e0e0e0] bg-white py-0 shadow-none ring-0">
              <CardHeader className="rounded-none border-b border-[#e0e0e0] px-4 py-3">
                <CardTitle className="text-base font-normal text-[#161616]">
                  Estado de stock
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-4">
                <StockStatus />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
