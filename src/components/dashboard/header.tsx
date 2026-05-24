export function Header() {
  return (
    <header className="border-b border-[#e0e0e0] bg-white">
      <div className="border-b border-[#e0e0e0] bg-[#f4f4f4]">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-6 text-xs text-[#525252]">
          <span>Centro de operación</span>
          <span>Demo en vivo</span>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-[#161616]">
            MediAgent
          </h1>
          <p className="text-sm text-[#525252]">
            Panel del dispensario - Operacion en tiempo real
          </p>
        </div>
        <div className="border border-[#e0e0e0] bg-white px-3 py-1 text-xs text-[#525252]">
          Datos sinteticos
        </div>
      </div>
    </header>
  );
}
