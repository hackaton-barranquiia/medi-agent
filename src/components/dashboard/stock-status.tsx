import { Badge } from "@/components/ui/badge";
import { supabaseServer } from "@/lib/supabase/server";

export async function StockStatus() {
  const { data } = await supabaseServer()
    .from("medications")
    .select("name, stock_qty, expires_at")
    .order("stock_qty");

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-[#525252]">No hay medicamentos registrados.</p>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((m) => {
        const low = m.stock_qty < 10;
        const out = m.stock_qty === 0;
        return (
          <div
            key={m.name}
            className="flex items-center justify-between border border-[#e0e0e0] bg-white px-3 py-2 text-sm"
          >
            <span className="text-[#161616]">{m.name}</span>
            <Badge
              className="rounded-none border px-2 py-0.5 text-[11px]"
              variant={out ? "destructive" : low ? "secondary" : "outline"}
            >
              {out ? "Agotado" : low ? `Bajo (${m.stock_qty})` : m.stock_qty}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
