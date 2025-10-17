export default function ClientHome() {
  return (
    <section className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold text-slate-800">Panel de clientes</h1>
      <p className="max-w-xl text-balance text-base text-slate-600">
        Esta sección aloja las vistas orientadas a los clientes. Aquí se podrán construir experiencias dedicadas sin
        mezclar la lógica de administración.
      </p>
    </section>
  );
}
