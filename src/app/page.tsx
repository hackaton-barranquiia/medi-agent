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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9497a9]">
      {children}
    </p>
  );
}

function DashCard({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id}>
      <Card className="gap-0 rounded-2xl border border-[#dedee5] bg-white py-0 shadow-[rgba(0,0,0,0.03)_0px_4px_24px] ring-0">
        <CardHeader className="rounded-t-2xl border-b border-[#dedee5] px-4 py-3">
          <CardTitle className="text-sm font-semibold text-[#101114]">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-4">{children}</CardContent>
      </Card>
    </section>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex h-full">
      <SectionsSidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto bg-[#f5f5f7] p-4 lg:p-6">

          {/* Supervisor — mobile: stack, desktop: KPIs full row then calls+critical */}
          <section id="supervision" className="mb-6">
            <SectionLabel>Vista del supervisor</SectionLabel>
            {/* KPI strip — always full width */}
            <div className="mb-4">
              <KpiStrip />
            </div>
            {/* Calls + Critical — side by side from sm */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <section id="calls">
                <CallsOverview />
              </section>
              <section id="critical">
                <CriticalPanel />
              </section>
            </div>
          </section>

          {/* Alistamiento — mobile: stack, xl: pedidos left + context right */}
          <section className="mb-6">
            <SectionLabel>Vista auxiliar de alistamiento</SectionLabel>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px]">
              <DashCard id="scheduled-orders" title="Pedidos agendados por hora">
                <ScheduledOrders />
              </DashCard>

              {/* Context column: stacks on mobile, sidebar on xl */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <DashCard id="pending" title="Fórmulas pendientes">
                  <PendingPrescriptions />
                </DashCard>
                <DashCard id="stock" title="Estado de stock">
                  <StockStatus />
                </DashCard>
              </div>
            </div>
          </section>

          {/* Tablero por estado */}
          <DashCard id="state-board" title="Tablero por estado y franja">
            <LiveAppointments />
          </DashCard>

        </main>
      </div>
    </div>
  );
}
