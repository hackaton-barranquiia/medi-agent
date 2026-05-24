import { CallsOverview } from "@/components/dashboard/calls-overview";
import { CriticalPanel } from "@/components/dashboard/critical-panel";
import { Header } from "@/components/dashboard/header";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PendingPrescriptions } from "@/components/dashboard/pending-prescriptions";
import { LiveAppointments } from "@/components/dashboard/live-appointments";
import { ScheduledOrders } from "@/components/dashboard/scheduled-orders";
import { SectionsSidebar } from "@/components/dashboard/sections-sidebar";
import { StockStatus } from "@/components/dashboard/stock-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#e8ebe6]">
      <Header />
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]">
        <SectionsSidebar />
        <div>
          <div className="mb-6 rounded-3xl border border-black/10 bg-white px-4 py-3">
            <p className="text-sm text-[#454745]">
              Monitorea llamadas, turnos y disponibilidad de medicamentos.
            </p>
          </div>
          <section id="supervision" className="mb-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[#454745]">
              Vista del supervisor
            </p>
          </section>
          <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr_1fr]">
            <KpiStrip />
            <section id="calls">
              <CallsOverview />
            </section>
            <section id="critical">
              <CriticalPanel />
            </section>
          </div>
          <div className="mb-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[#454745]">
              Vista auxiliar de alistamiento
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <section id="scheduled-orders" className="lg:col-span-3">
              <Card className="gap-3 rounded-3xl border border-black/10 bg-white py-0 shadow-none ring-0">
                <CardHeader className="rounded-t-3xl border-b border-black/10 px-4 py-3">
                  <CardTitle className="text-base font-semibold text-[#0e0f0c]">
                    Pedidos agendados por hora
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-4">
                  <ScheduledOrders />
                </CardContent>
              </Card>
            </section>
            <section id="state-board" className="lg:col-span-2">
              <Card className="gap-3 rounded-3xl border border-black/10 bg-white py-0 shadow-none ring-0">
                <CardHeader className="rounded-t-3xl border-b border-black/10 px-4 py-3">
                  <CardTitle className="text-base font-semibold text-[#0e0f0c]">
                    Tablero por estado y franja
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-4">
                  <LiveAppointments />
                </CardContent>
              </Card>
            </section>
            <div className="space-y-6">
              <Card className="gap-3 rounded-3xl border border-black/10 bg-white py-0 shadow-none ring-0">
                <CardHeader className="rounded-t-3xl border-b border-black/10 px-4 py-3">
                  <CardTitle className="text-base font-semibold text-[#0e0f0c]">
                    Formulas pendientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-4">
                  <PendingPrescriptions />
                </CardContent>
              </Card>
              <Card className="gap-3 rounded-3xl border border-black/10 bg-white py-0 shadow-none ring-0">
                <CardHeader className="rounded-t-3xl border-b border-black/10 px-4 py-3">
                  <CardTitle className="text-base font-semibold text-[#0e0f0c]">
                    Estado de stock
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-4">
                  <StockStatus />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
