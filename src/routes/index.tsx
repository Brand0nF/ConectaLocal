import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, MapPin, MessageCircle, ShieldCheck, Clock, ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";
import { oficiosQuery, sectoresQuery, trabajadoresQuery, totalResenasQuery } from "@/lib/data";
import { OficioIcon } from "@/components/site/bits";
import { WorkerCard } from "@/components/site/WorkerCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ConectaLocal · Encuentra oficios de confianza en tu barrio" },
      { name: "description", content: "Gasfíter, electricista, carpintero y más en Temuco y alrededores. Filtra por oficio y sector y contacta por WhatsApp con un clic." },
      { property: "og:title", content: "ConectaLocal · Oficios de confianza en tu barrio" },
      { property: "og:description", content: "Directorio local de oficios con contacto directo por WhatsApp." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { data: oficios = [] } = useQuery(oficiosQuery);
  const { data: sectores = [] } = useQuery(sectoresQuery);
  const { data: trabajadores = [] } = useQuery(trabajadoresQuery);
  const { data: totalResenas = 0 } = useQuery(totalResenasQuery);
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("");

  const destacados = trabajadores.filter((t) => t.disponible).slice(0, 3);
  const disponibles = trabajadores.filter((t) => t.disponible).length;
  const conteo = (id: number) => trabajadores.filter((t) => t.oficio_id === id).length;

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/oficios", search: { q: q || undefined, sector: sector || undefined } });
  }

  return (
    <>
      <section className="relative overflow-hidden bg-ink-gradient text-ink-foreground">
        <div className="container-page grid items-center gap-10 py-14 md:py-20 lg:grid-cols-[1.1fr_1fr]">
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-ink-foreground/15 px-3 py-1 text-xs font-semibold text-ink-muted">
              <span className="size-2 rounded-full bg-whatsapp" /> {disponibles} trabajadores disponibles hoy
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Tu vecindario, a un <span className="text-gold">mensaje</span> de distancia
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-muted">
              Encuentra gasfíteres, electricistas, carpinteros y más oficios de confianza en Temuco y alrededores. Escríbeles directo por WhatsApp, sin intermediarios.
            </p>

            <form onSubmit={buscar} role="search" className="mt-8 flex flex-col gap-2 rounded-2xl bg-card p-2 text-card-foreground shadow-lift sm:flex-row">
              <label className="flex flex-1 items-center gap-2 px-3">
                <Search className="size-5 text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">¿Qué necesitas?</span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="¿Qué necesitas? Ej: filtración, enchufe…"
                  className="h-12 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
                />
              </label>
              <label className="flex items-center gap-2 border-t px-3 sm:border-l sm:border-t-0">
                <MapPin className="size-5 text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">Sector</span>
                <select value={sector} onChange={(e) => setSector(e.target.value)} className="h-12 w-full bg-transparent text-base outline-none sm:w-44">
                  <option value="">Todos los sectores</option>
                  {sectores.map((s) => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                </select>
              </label>
              <Button type="submit" variant="gold" size="lg" className="rounded-xl">Buscar</Button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              {oficios.slice(0, 5).map((o) => (
                <Link key={o.id} to="/oficios" search={{ oficio: o.nombre }} className="rounded-full border border-ink-foreground/15 px-3 py-1.5 text-sm text-ink-muted hover:border-gold hover:text-ink-foreground">
                  {o.nombre}
                </Link>
              ))}
            </div>
          </div>
          <div className="relative hidden lg:block">
            <img src={heroImg} alt="Electricista local sonriendo en la puerta de una casa de madera en el sur de Chile" width={1600} height={1104} className="aspect-[4/5] w-full rounded-3xl object-cover shadow-lift" />
            <div className="absolute -bottom-6 -left-6 flex items-center gap-3 rounded-2xl bg-card p-4 text-card-foreground shadow-lift">
              <span className="grid size-11 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground"><MessageCircle className="size-5" /></span>
              <div>
                <p className="text-sm font-bold">Contacto en 1 clic</p>
                <p className="text-xs text-muted-foreground">Directo a WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-ink-foreground/10">
          <dl className="container-page grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
            {[
              [trabajadores.length, "Trabajadores"],
              [oficios.length, "Oficios"],
              [sectores.length, "Sectores"],
              [totalResenas, "Reseñas"],
            ].map(([n, l]) => (
              <div key={l as string}>
                <dt className="text-sm text-ink-muted">{l}</dt>
                <dd className="font-display text-3xl font-extrabold text-gold">{n}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-gold">Categorías</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Explora por oficio</h2>
          </div>
          <Link to="/oficios" className="inline-flex items-center gap-1 font-semibold hover:underline">Ver todo <ArrowRight className="size-4" /></Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {oficios.map((o) => (
            <Link key={o.id} to="/oficios" search={{ oficio: o.nombre }} className="group flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-gold">
              <span className="grid size-11 place-items-center rounded-xl bg-gold-soft text-accent-foreground transition-colors group-hover:bg-gold">
                <OficioIcon icono={o.icono} className="size-5" />
              </span>
              <span>
                <span className="block font-bold">{o.nombre}</span>
                <span className="text-xs text-muted-foreground">{conteo(o.id)} {conteo(o.id) === 1 ? "persona" : "personas"}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {destacados.length > 0 && (
        <section className="bg-secondary/60 py-20">
          <div className="container-page">
            <p className="text-sm font-bold uppercase tracking-wider text-gold">Recomendados</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Mejor evaluados y disponibles</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {destacados.map((t) => <WorkerCard key={t.id} t={t} />)}
            </div>
          </div>
        </section>
      )}

      <section className="container-page grid gap-12 py-20 lg:grid-cols-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-gold">Por qué ConectaLocal</p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Encontrar a alguien de confianza no debería ser difícil</h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Hoy se pierde tiempo preguntando en grupos o redes sociales. Y los trabajadores locales no tienen dónde mostrar su trabajo de forma ordenada. ConectaLocal los reúne en un solo lugar.
          </p>
        </div>
        <ul className="grid gap-4">
          {[
            [MapPin, "Cerca de ti", "Trabajadores de tu mismo sector, en Temuco y alrededores."],
            [MessageCircle, "Contacto directo", "Escribes por WhatsApp y acuerdas el precio tú mismo. Sin comisiones."],
            [ShieldCheck, "Perfiles reales", "Oficio, tarifa referencial y reseñas de clientes verificados."],
            [Clock, "Disponibilidad al día", "Cada trabajador indica si está disponible o con la agenda llena."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof MapPin;
            return (
              <li key={t as string} className="flex gap-4 rounded-2xl border bg-card p-5 shadow-card">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink text-gold"><I className="size-5" /></span>
                <div>
                  <h3 className="font-bold">{t as string}</h3>
                  <p className="text-sm text-muted-foreground">{d as string}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="container-page pb-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-ink-gradient p-8 text-ink-foreground md:flex-row md:items-center md:p-12">
          <div>
            <h2 className="text-3xl font-extrabold">¿Tienes un oficio?</h2>
            <p className="mt-2 max-w-lg text-ink-muted">Publica tu perfil gratis y recibe clientes de tu barrio directo en tu WhatsApp.</p>
          </div>
          <Button asChild variant="gold" size="lg"><Link to="/registro">Ofrece tus servicios</Link></Button>
        </div>
      </section>
    </>
  );
}
