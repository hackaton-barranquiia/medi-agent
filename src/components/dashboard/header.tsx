import { Building2, ShieldPlus, Truck } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-black/10 bg-[#e8ebe6]">
      <div className="border-b border-black/10 bg-white/60">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-6 text-xs text-[#454745]">
          <span>Centro de operación</span>
          <span>Demo en vivo</span>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0e0f0c]">
            MediAgent
          </h1>
          <p className="text-sm text-[#454745]">
            Panel del dispensario - Operacion en tiempo real
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-[#454745]">
          <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-2 py-1">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#9fe870] text-[#0e0f0c]">
              <ShieldPlus className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium">MediAgent</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-2 py-1">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#9fe870] text-[#0e0f0c]">
              <Truck className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium">Distribuidora</span>
          </div>
          <div className="col-span-2 flex items-center gap-2 rounded-xl border border-black/10 bg-white px-2 py-1">
            <Building2 className="h-3.5 w-3.5 text-[#0e0f0c]" />
            <span>Operador logistica de retiro</span>
          </div>
        </div>
      </div>
    </header>
  );
}
