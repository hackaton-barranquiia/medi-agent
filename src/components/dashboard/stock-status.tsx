import { Badge } from "@/components/ui/badge";
import { supabaseServer } from "@/lib/supabase/server";

export async function StockStatus() {
  const { data } = await supabaseServer()
    .from("medications")
    .select("name, stock_qty, expires_at")
    .order("stock_qty");

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-slate-500">No hay medicamentos registrados.</p>
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
            className="flex items-center justify-between text-sm"
          >
            <span>{m.name}</span>
            <Badge variant={out ? "destructive" : low ? "secondary" : "outline"}>
              {out ? "Agotado" : low ? `Bajo (${m.stock_qty})` : m.stock_qty}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
