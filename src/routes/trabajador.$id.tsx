import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, BadgeCheck, MapPin, Wallet, Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fechaCorta, resenasQuery, trabajadorQuery } from "@/lib/data";
import { formatearWhatsapp } from "@/lib/whatsapp";
import { Avatar, EstadoBadge, OficioIcon, Stars, WhatsAppButton } from "@/components/site/bits";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trabajador/$id")({
  head: () => ({
    meta: [
      { title: "Perfil del trabajador · ConectaLocal" },
      { name: "description", content: "Revisa oficio, tarifa, disponibilidad y reseñas, y contacta por WhatsApp." },
      { property: "og:title", content: "Perfil del trabajador · ConectaLocal" },
      { property: "og:description", content: "Oficio local con contacto directo por WhatsApp." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const id = Number(Route.useParams().id);
  const { data: t, isLoading } = useQuery(trabajadorQuery(id));
  const { data: resenas = [] } = useQuery(resenasQuery(id));

  if (isLoading) return <div className="container-page py-12"><Skeleton className="h-80 rounded-3xl" /></div>;
  if (!t)
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-extrabold">Perfil no encontrado</h1>
        <p className="mt-2 text-muted-foreground">Es posible que este trabajador haya dado de baja su perfil.</p>
        <Button asChild variant="gold" className="mt-6"><Link to="/oficios">Volver a buscar</Link></Button>
      </div>
    );

  return (
    <div className="container-page py-10">
      <Link to="/oficios" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a resultados
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section className="rounded-3xl border bg-card p-6 shadow-card sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar nombre={t.nombre} foto={t.foto_url} className="size-24 text-3xl" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-extrabold">{t.nombre}</h1>
                  {t.destacado && <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-1 text-xs font-bold text-accent-foreground"><BadgeCheck className="size-4" /> Destacado</span>}
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-muted-foreground">
                  <OficioIcon icono={t.oficio_icono} className="size-5" /> {t.oficio}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Stars value={t.promedio} />
                  <span className="text-sm text-muted-foreground">
                    {t.promedio ? `${t.promedio.toFixed(1).replace(".", ",")} · ${t.total_resenas} reseña${t.total_resenas === 1 ? "" : "s"}` : "Aún sin reseñas"}
                  </span>
                </div>
              </div>
            </div>
            <h2 className="mt-8 text-lg font-bold">Sobre su trabajo</h2>
            <p className="mt-2 text-muted-foreground">{t.descripcion}</p>
          </section>

          <section id="resenas" className="rounded-3xl border bg-card p-6 shadow-card sm:p-8">
            <h2 className="text-xl font-extrabold">Reseñas de clientes</h2>
            <ResenaForm trabajadorId={t.id} ownerId={t.user_id} />
            <ul className="mt-6 divide-y">
              {resenas.length === 0 && <li className="py-4 text-sm text-muted-foreground">Sé el primero en dejar una reseña.</li>}
              {resenas.map((r) => (
                <li key={r.id} className="py-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold">{r.autor_nombre}</p>
                    <span className="text-xs text-muted-foreground">{fechaCorta(r.creado_en)}</span>
                  </div>
                  <Stars value={r.estrellas} />
                  {r.comentario && <p className="mt-2 text-sm text-muted-foreground">{r.comentario}</p>}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border bg-card p-6 shadow-card">
            <EstadoBadge disponible={t.disponible} />
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex gap-3"><Wallet className="size-5 text-gold" /><div><dt className="text-muted-foreground">Tarifa referencial</dt><dd className="font-bold">{t.tarifa}</dd></div></div>
              <div className="flex gap-3"><MapPin className="size-5 text-gold" /><div><dt className="text-muted-foreground">Sector</dt><dd className="font-bold">{t.sector}</dd></div></div>
              <div className="flex gap-3"><Star className="size-5 text-gold" /><div><dt className="text-muted-foreground">WhatsApp</dt><dd className="font-bold">{formatearWhatsapp(t.whatsapp)}</dd></div></div>
            </dl>
            <WhatsAppButton numero={t.whatsapp} nombre={t.nombre} oficio={t.oficio} disponible={t.disponible} size="lg" className="mt-6 w-full" />
            <p className="mt-3 text-center text-xs text-muted-foreground">Se abrirá WhatsApp con un mensaje listo para enviar.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ResenaForm({ trabajadorId, ownerId }: { trabajadorId: number; ownerId: string | null }) {
  const { user, perfil } = useAuth();
  const qc = useQueryClient();
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [existe, setExiste] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("resenas").select("estrellas, comentario").eq("trabajador_id", trabajadorId).eq("usuario_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) { setEstrellas(data.estrellas); setComentario(data.comentario); setExiste(true); }
      });
  }, [user, trabajadorId]);

  if (!user)
    return (
      <p className="mt-4 rounded-xl bg-secondary p-4 text-sm">
        <Link to="/login" search={{ redirect: `/trabajador/${trabajadorId}` }} className="font-bold underline">Inicia sesión</Link> como cliente para dejar tu reseña.
      </p>
    );
  if (ownerId === user.id) return <p className="mt-4 rounded-xl bg-secondary p-4 text-sm">Este es tu perfil. Las reseñas las dejan tus clientes.</p>;
  if (perfil && perfil.tipo !== "cliente") return <p className="mt-4 rounded-xl bg-secondary p-4 text-sm">Solo las cuentas de cliente pueden dejar reseñas.</p>;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!estrellas) return toast.error("Elige una calificación de 1 a 5 estrellas");
    setSaving(true);
    const { error } = await supabase.from("resenas").upsert(
      { trabajador_id: trabajadorId, usuario_id: user!.id, autor_nombre: perfil?.nombre || "Cliente", estrellas, comentario: comentario.trim().slice(0, 300), creado_en: new Date().toISOString() },
      { onConflict: "trabajador_id,usuario_id" },
    );
    setSaving(false);
    if (error) return toast.error("No se pudo guardar la reseña");
    toast.success(existe ? "Reseña actualizada" : "¡Gracias por tu reseña!");
    setExiste(true);
    qc.invalidateQueries({ queryKey: ["resenas"] });
    qc.invalidateQueries({ queryKey: ["trabajador", trabajadorId] });
    qc.invalidateQueries({ queryKey: ["trabajadores"] });
  }

  async function borrar() {
    const { error } = await supabase.from("resenas").delete().eq("trabajador_id", trabajadorId).eq("usuario_id", user!.id);
    if (error) return toast.error("No se pudo eliminar");
    setExiste(false); setEstrellas(0); setComentario("");
    toast.success("Reseña eliminada");
    qc.invalidateQueries();
  }

  return (
    <form onSubmit={enviar} className="mt-5 rounded-2xl bg-secondary p-5">
      <p className="text-sm font-bold">{existe ? "Tu reseña" : "Califica este servicio"}</p>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Calificación en estrellas">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={estrellas === n} aria-label={`${n} de 5`} onClick={() => setEstrellas(n)}>
            <Star className={cn("size-8 transition-colors", n <= estrellas ? "fill-gold text-gold" : "text-border hover:text-gold")} />
          </button>
        ))}
      </div>
      <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} maxLength={300} rows={3} placeholder="Cuéntanos tu experiencia (opcional)" className="mt-3 bg-card" />
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{comentario.length}/300</span>
        <div className="flex gap-2">
          {existe && <Button type="button" variant="ghost" size="sm" onClick={borrar}><Trash2 /> Eliminar</Button>}
          <Button type="submit" disabled={saving}>{existe ? "Actualizar" : "Publicar reseña"}</Button>
        </div>
      </div>
    </form>
  );
}
