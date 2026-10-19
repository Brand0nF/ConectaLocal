import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fechaCorta, trabajadoresQuery } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Avatar, EstadoBadge, Stars } from "@/components/site/bits";

export const Route = createFileRoute("/mi-cuenta")({
  head: () => ({
    meta: [
      { title: "Mi cuenta · ConectaLocal" },
      { name: "description", content: "Gestiona tu perfil, disponibilidad y reseñas." },
      { property: "og:title", content: "Mi cuenta · ConectaLocal" },
      { property: "og:description", content: "Panel personal de ConectaLocal." },
    ],
  }),
  component: MiCuenta,
});

function MiCuenta() {
  const { user, perfil, isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const { data: trabajadores = [] } = useQuery(trabajadoresQuery);
  const { data: misResenas = [] } = useQuery({
    queryKey: ["mis-resenas", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("resenas").select("*, trabajadores(id, nombre)").eq("usuario_id", user!.id).order("creado_en", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (loading) return <div className="container-page py-20" />;
  if (!user)
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-extrabold">Inicia sesión</h1>
        <Button asChild variant="gold" className="mt-6"><Link to="/login" search={{ redirect: "/mi-cuenta" }}>Iniciar sesión</Link></Button>
      </div>
    );

  const mio = trabajadores.find((t) => t.user_id === user.id);
  const disponiblesHoy = trabajadores.filter((t) => t.disponible).length;

  async function toggle() {
    if (!mio) return;
    const { error } = await supabase.from("trabajadores").update({ disponible: !mio.disponible }).eq("id", mio.id);
    if (error) return void toast.error("No se pudo actualizar");
    toast.success(mio.disponible ? "Ahora apareces como ocupado" : "Ahora apareces como disponible");
    qc.invalidateQueries();
  }
  async function eliminarPerfil() {
    if (!mio || !window.confirm("¿Eliminar tu perfil público? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from("trabajadores").delete().eq("id", mio.id);
    if (error) return void toast.error("No se pudo eliminar");
    toast.success("Perfil eliminado");
    qc.invalidateQueries();
  }

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Hola, {perfil?.nombre || "vecino"}</h1>
      <p className="mt-1 text-muted-foreground">{user.email} · Cuenta de {perfil?.tipo ?? "cliente"}{isAdmin && " · Administrador"}</p>
      {isAdmin && <Button asChild variant="gold" className="mt-4"><Link to="/admin">Ir al panel de administración</Link></Button>}

      {perfil?.tipo === "trabajador" ? (
        mio ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <section className="rounded-3xl border bg-card p-6 shadow-card lg:col-span-2">
              <div className="flex items-center gap-4">
                <Avatar nombre={mio.nombre} foto={mio.foto_url} className="size-16 text-xl" />
                <div className="flex-1"><h2 className="text-xl font-bold">{mio.nombre}</h2><p className="text-sm text-muted-foreground">{mio.oficio} · {mio.sector}</p></div>
                <EstadoBadge disponible={mio.disponible} />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <Stat v={mio.disponible ? "Disponible" : "Ocupado"} l="Tu estado" />
                <Stat v={mio.promedio ? mio.promedio.toFixed(1).replace(".", ",") : "—"} l="Calificación" />
                <Stat v={String(mio.total_resenas)} l="Reseñas" />
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild variant="outline"><Link to="/registro"><Pencil /> Editar perfil</Link></Button>
                <Button asChild variant="outline"><Link to="/trabajador/$id" params={{ id: String(mio.id) }}><Eye /> Ver perfil público</Link></Button>
                <Button variant="ghost" className="text-destructive" onClick={eliminarPerfil}><Trash2 /> Eliminar</Button>
              </div>
            </section>
            <section className="rounded-3xl bg-ink-gradient p-6 text-ink-foreground">
              <h2 className="text-lg font-bold">Tu disponibilidad</h2>
              <p className="mt-1 text-sm text-ink-muted">Los clientes verán si estás disponible antes de escribirte.</p>
              <Button onClick={toggle} variant={mio.disponible ? "ink-outline" : "whatsapp"} className="mt-5 w-full">
                {mio.disponible ? "Marcarme como ocupado" : "Marcarme como disponible"}
              </Button>
            </section>
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed p-10 text-center">
            <h2 className="text-xl font-bold">Aún no has publicado tu perfil de trabajador</h2>
            <p className="mt-2 text-muted-foreground">Complétalo en un par de minutos y empieza a recibir clientes.</p>
            <Button asChild variant="gold" className="mt-5"><Link to="/registro">Publicar mi perfil</Link></Button>
          </div>
        )
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="grid grid-cols-3 gap-3 text-center lg:col-span-3">
            <Stat v={String(misResenas.length)} l="Reseñas escritas" />
            <Stat v={misResenas.length ? (misResenas.reduce((a, r) => a + r.estrellas, 0) / misResenas.length).toFixed(1).replace(".", ",") : "—"} l="Promedio que das" />
            <Stat v={String(disponiblesHoy)} l="Disponibles hoy" />
          </div>
          <section className="rounded-3xl border bg-card p-6 shadow-card lg:col-span-3">
            <h2 className="text-lg font-bold">Mis reseñas</h2>
            {misResenas.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Aún no escribes reseñas. <Link to="/oficios" className="font-bold underline">Busca un servicio</Link>.</p>
            ) : (
              <ul className="mt-3 divide-y">
                {misResenas.map((r) => (
                  <li key={r.id} className="flex flex-col gap-1 py-4">
                    <div className="flex justify-between">
                      <Link to="/trabajador/$id" params={{ id: String(r.trabajador_id) }} className="font-bold hover:underline">{(r.trabajadores as { nombre: string } | null)?.nombre}</Link>
                      <span className="text-xs text-muted-foreground">{fechaCorta(r.creado_en)}</span>
                    </div>
                    <Stars value={r.estrellas} />
                    {r.comentario && <p className="text-sm text-muted-foreground">{r.comentario}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div className="rounded-2xl bg-secondary p-4">
      <p className="font-display text-2xl font-extrabold">{v}</p>
      <p className="text-xs text-muted-foreground">{l}</p>
    </div>
  );
}
