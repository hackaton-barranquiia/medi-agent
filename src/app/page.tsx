import { HeroKpi } from "@/components/dashboard/hero-kpi";
import { Funnel } from "@/components/dashboard/funnel";
import { CallCenterCard } from "@/components/dashboard/call-center-card";
import { ActivityStream } from "@/components/dashboard/activity-stream";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div>
      <HeroKpi />

      <section className="px-4 pb-12 pt-8 lg:px-10 lg:pb-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Funnel />
          <CallCenterCard />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-1">
          <ActivityStream />
        </div>
      </section>
    </div>
  );
}
