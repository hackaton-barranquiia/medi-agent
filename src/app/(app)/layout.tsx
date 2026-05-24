import { AppShell } from "@/components/shell/app-shell";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden">
      <AppShell>{children}</AppShell>
    </div>
  );
}
