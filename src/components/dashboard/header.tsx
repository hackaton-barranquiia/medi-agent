export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">MediAgent</h1>
          <p className="text-sm text-slate-500">Panel del dispensario</p>
        </div>
        <div className="text-xs text-slate-400">Demo · Datos sintéticos</div>
      </div>
    </header>
  );
}
