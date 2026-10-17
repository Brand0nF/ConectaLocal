import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Search, MapPin, X, SearchX } from "lucide-react";
import { useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { oficiosQuery, quitarTildes, sectoresQuery, trabajadoresQuery } from "@/lib/data";
import { WorkerCard } from "@/components/site/WorkerCard";
import { OficioIcon } from "@/components/site/bits";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  q: z.string().optional(),
  oficio: z.string().optional(),
  sector: z.string().optional(),
  disponible: z.boolean().optional(),
});

export const Route = createFileRoute("/oficios")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Buscar servicios y oficios · ConectaLocal" },
      { name: "description", content: "Filtra trabajadores locales por oficio, sector y disponibilidad, y contáctalos por WhatsApp." },
      { property: "og:title", content: "Buscar servicios · ConectaLocal" },
      { property: "og:description", content: "Directorio de oficios locales con filtros por sector y categoría." },
    ],
  }),
  component: Oficios,
});

function Oficios() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/oficios" });
  const { data: oficios = [] } = useQuery(oficiosQuery);
  const { data: sectores = [] } = useQuery(sectoresQuery);
  const { data: trabajadores, isLoading } = useQuery(trabajadoresQuery);

  const set = (patch: Partial<z.infer<typeof searchSchema>>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const resultados = useMemo(() => {
    const q = quitarTildes(search.q ?? "").trim();
    return (trabajadores ?? []).filter((t) => {
      if (search.oficio && t.oficio !== search.oficio) return false;
      if (search.sector && t.sector !== search.sector) return false;
      if (search.disponible && !t.disponible) return false;
      if (q) {
        const hay = quitarTildes(`${t.nombre} ${t.oficio} ${t.descripcion} ${t.sector}`);
        if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
  }, [trabajadores, search]);

  const hayFiltros = !!(search.q || search.oficio || search.sector || search.disponible);

  return (
    <>
      <section className="bg-ink-gradient text-ink-foreground">
        <div className="container-page py-12">
          <h1 className="text-3xl font-extrabold sm:text-4xl">Encuentra quién te lo arregle, en tu mismo barrio</h1>
          <div className="mt-6 grid gap-2 rounded-2xl bg-card p-2 text-card-foreground shadow-lift md:grid-cols-[1fr_220px]">
            <label className="flex items-center gap-2 px-3">
              <Search className="size-5 text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">Qué necesitas</span>
              <input
                type="search"
                value={search.q ?? ""}
                onChange={(e) => set({ q: e.target.value || undefined })}
                placeholder="¿Qué necesitas? Ej: filtración"
                className="h-12 w-full bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </label>
            <label className="flex items-center gap-2 border-t px-3 md:border-l md:border-t-0">
              <MapPin className="size-5 text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">Sector</span>
              <select value={search.sector ?? ""} onChange={(e) => set({ sector: e.target.value || undefined })} className="h-12 w-full bg-transparent outline-none">
                <option value="">Todos los sectores</option>
                {sectores.map((s) => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
              </select>
            </label>
          </div>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-3 text-sm text-ink-muted">
            <Switch checked={!!search.disponible} onCheckedChange={(v) => set({ disponible: v || undefined })} />
            Mostrar solo quienes están disponibles
          </label>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2" role="group" aria-label="Filtrar por oficio">
          <Chip active={!search.oficio} onClick={() => set({ oficio: undefined })}>Todos</Chip>
          {oficios.map((o) => (
            <Chip key={o.id} active={search.oficio === o.nombre} onClick={() => set({ oficio: search.oficio === o.nombre ? undefined : o.nombre })}>
              <OficioIcon icono={o.icono} className="size-4" /> {o.nombre}
            </Chip>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {isLoading ? "Cargando…" : `${resultados.length} ${resultados.length === 1 ? "resultado" : "resultados"}`}
          </p>
          {hayFiltros && (
            <button onClick={() => navigate({ search: {}, replace: true })} className="inline-flex items-center gap-1 text-sm font-semibold hover:underline">
              <X className="size-4" /> Limpiar filtros
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)
            : resultados.map((t) => <WorkerCard key={t.id} t={t} />)}
        </div>

        {!isLoading && resultados.length === 0 && (
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-dashed p-10 text-center">
            <SearchX className="mx-auto size-10 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-bold">No encontramos resultados</h2>
            <p className="mt-2 text-sm text-muted-foreground">Prueba con otro oficio, otro sector o quita el filtro de disponibilidad.</p>
          </div>
        )}
      </section>
    </>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
        active ? "border-ink bg-ink text-ink-foreground" : "bg-card hover:border-gold",
      )}
    >
      {children}
    </button>
  );
}
