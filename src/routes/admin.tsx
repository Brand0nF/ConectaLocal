import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Star, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fechaCorta, oficiosQuery, sectoresQuery, trabajadoresQuery } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EstadoBadge, Stars } from "@/components/site/bits";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administración · ConectaLocal" },
      { name: "description", content: "Panel de administración de ConectaLocal." },
      { property: "og:title", content: "Administración · ConectaLocal" },
      { property: "og:description", content: "Gestión de trabajadores, reseñas y categorías." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const { data: trabajadores = [] } = useQuery(trabajadoresQuery);
  const { data: oficios = [] } = useQuery(oficiosQuery);
  const { data: sectores = [] } = useQuery(sectoresQuery);
  const { data: resenas = [] } = useQuery({
    queryKey: ["resenas", "todas"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("resenas").select("*, trabajadores(nombre)").order("creado_en", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (loading) return <div className="container-page py-20" />;
  if (!isAdmin)
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-extrabold">Acceso restringido</h1>
        <p className="mt-2 text-muted-foreground">Esta sección es solo para administradores.</p>
        <Button asChild variant="gold" className="mt-6"><Link to="/">Volver al inicio</Link></Button>
      </div>
    );

  const done = (msg: string) => (r: { error: unknown }) => {
    if (r.error) return toast.error("No se pudo completar la acción");
    toast.success(msg);
    qc.invalidateQueries();
  };

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-extrabold">Panel de administración</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Trabajadores", trabajadores.length], ["Disponibles", trabajadores.filter((t) => t.disponible).length], ["Reseñas", resenas.length], ["Oficios", oficios.length]].map(([l, v]) => (
          <div key={l as string} className="rounded-2xl border bg-card p-4 shadow-card"><p className="text-sm text-muted-foreground">{l}</p><p className="font-display text-3xl font-extrabold">{v}</p></div>
        ))}
      </div>

      <Tabs defaultValue="trabajadores" className="mt-8">
        <TabsList><TabsTrigger value="trabajadores">Trabajadores</TabsTrigger><TabsTrigger value="resenas">Reseñas</TabsTrigger><TabsTrigger value="categorias">Oficios y sectores</TabsTrigger></TabsList>

        <TabsContent value="trabajadores" className="mt-4 overflow-x-auto rounded-2xl border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left"><tr><th className="p-3">Nombre</th><th className="p-3">Oficio</th><th className="p-3">Sector</th><th className="p-3">Estado</th><th className="p-3">Nota</th><th className="p-3 text-right">Acciones</th></tr></thead>
            <tbody className="divide-y">
              {trabajadores.map((t) => (
                <tr key={t.id}>
                  <td className="p-3 font-semibold"><Link to="/trabajador/$id" params={{ id: String(t.id) }} className="hover:underline">{t.nombre}</Link></td>
                  <td className="p-3">{t.oficio}</td><td className="p-3">{t.sector}</td>
                  <td className="p-3"><EstadoBadge disponible={t.disponible} /></td>
                  <td className="p-3">{t.promedio ?? "—"} ({t.total_resenas})</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <Button size="sm" variant={t.destacado ? "gold" : "outline"} onClick={() => supabase.from("trabajadores").update({ destacado: !t.destacado }).eq("id", t.id).then(done(t.destacado ? "Quitado de destacados" : "Marcado como destacado"))}>
                      <Star /> {t.destacado ? "Destacado" : "Destacar"}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" aria-label={`Eliminar ${t.nombre}`} onClick={() => confirm(`¿Eliminar a ${t.nombre}?`) && supabase.from("trabajadores").delete().eq("id", t.id).then(done("Trabajador eliminado"))}><Trash2 /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>

        <TabsContent value="resenas" className="mt-4 rounded-2xl border bg-card shadow-card">
          <ul className="divide-y">
            {resenas.map((r) => (
              <li key={r.id} className="flex items-start gap-4 p-4">
                <div className="flex-1">
                  <p className="text-sm"><b>{r.autor_nombre}</b> sobre <b>{(r.trabajadores as { nombre: string } | null)?.nombre}</b> · <span className="text-muted-foreground">{fechaCorta(r.creado_en)}</span></p>
                  <Stars value={r.estrellas} />
                  {r.comentario && <p className="mt-1 text-sm text-muted-foreground">{r.comentario}</p>}
                </div>
                <Button size="sm" variant="ghost" className="text-destructive" aria-label="Eliminar reseña" onClick={() => confirm("¿Eliminar esta reseña?") && supabase.from("resenas").delete().eq("id", r.id).then(done("Reseña eliminada"))}><Trash2 /></Button>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="categorias" className="mt-4 grid gap-6 md:grid-cols-2">
          <Lista titulo="Oficios" items={oficios} onAdd={(nombre) => supabase.from("oficios").insert({ nombre }).then(done("Oficio agregado"))} onDel={(id) => supabase.from("oficios").delete().eq("id", id).then(done("Oficio eliminado"))} />
          <Lista titulo="Sectores" items={sectores} onAdd={(nombre) => supabase.from("sectores").insert({ nombre }).then(done("Sector agregado"))} onDel={(id) => supabase.from("sectores").delete().eq("id", id).then(done("Sector eliminado"))} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Lista({ titulo, items, onAdd, onDel }: { titulo: string; items: { id: number; nombre: string }[]; onAdd: (n: string) => void; onDel: (id: number) => void }) {
  const [v, setV] = useState("");
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-card">
      <h2 className="text-lg font-bold">{titulo}</h2>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (v.trim()) { onAdd(v.trim()); setV(""); } }}>
        <Input value={v} onChange={(e) => setV(e.target.value)} placeholder={`Nuevo ${titulo.toLowerCase().slice(0, -1)}`} aria-label={`Agregar ${titulo}`} />
        <Button type="submit" size="icon" aria-label="Agregar"><Plus /></Button>
      </form>
      <ul className="mt-3 divide-y text-sm">
        {items.map((i) => (
          <li key={i.id} className="flex items-center justify-between py-2">{i.nombre}
            <Button size="sm" variant="ghost" aria-label={`Eliminar ${i.nombre}`} onClick={() => confirm(`¿Eliminar ${i.nombre}? Solo funciona si nadie lo usa.`) && onDel(i.id)}><Trash2 /></Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
