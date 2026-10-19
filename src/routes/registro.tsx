import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { oficiosQuery, sectoresQuery } from "@/lib/data";
import { normalizarWhatsapp } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar } from "@/components/site/bits";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Ofrece tus servicios · ConectaLocal" },
      { name: "description", content: "Publica gratis tu oficio y recibe clientes de tu barrio por WhatsApp." },
      { property: "og:title", content: "Ofrece tus servicios · ConectaLocal" },
      { property: "og:description", content: "Publica tu perfil de trabajador gratis." },
    ],
  }),
  component: Registro,
});

const schema = z.object({
  nombre: z.string().trim().min(2, "Ingresa tu nombre completo").max(100),
  oficio_id: z.number({ invalid_type_error: "Elige tu oficio" }).int().positive("Elige tu oficio"),
  sector_id: z.number({ invalid_type_error: "Elige tu sector" }).int().positive("Elige tu sector"),
  tarifa: z.string().trim().min(1, "Indica una tarifa referencial").max(80),
  descripcion: z.string().trim().min(10, "Describe tus trabajos (mínimo 10 caracteres)").max(200),
});

function Registro() {
  const { user, perfil, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: oficios = [] } = useQuery(oficiosQuery);
  const { data: sectores = [] } = useQuery(sectoresQuery);
  const [existenteId, setExistenteId] = useState<number | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [f, setF] = useState({ nombre: "", whatsapp: "", oficio_id: 0, sector_id: 0, tarifa: "", descripcion: "", disponible: true });
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("trabajadores").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setExistenteId(data.id);
        setFoto(data.foto_url);
        setConsent(true);
        setF({ nombre: data.nombre, whatsapp: data.whatsapp.slice(3), oficio_id: data.oficio_id, sector_id: data.sector_id, tarifa: data.tarifa, descripcion: data.descripcion, disponible: data.disponible });
      } else if (perfil) setF((p) => ({ ...p, nombre: p.nombre || perfil.nombre }));
    });
  }, [user, perfil]);

  if (loading) return <div className="container-page py-20" />;
  if (!user)
    return (
      <div className="container-page max-w-xl py-20 text-center">
        <h1 className="text-3xl font-extrabold">Ofrece tus servicios</h1>
        <p className="mt-3 text-muted-foreground">Crea una cuenta de trabajador gratis para publicar tu perfil y recibir clientes por WhatsApp.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild variant="gold" size="lg"><Link to="/crear-cuenta" search={{ tipo: "trabajador" }}>Crear cuenta</Link></Button>
          <Button asChild variant="outline" size="lg"><Link to="/login" search={{ redirect: "/registro" }}>Ya tengo cuenta</Link></Button>
        </div>
      </div>
    );
  if (perfil?.tipo === "cliente")
    return (
      <div className="container-page max-w-xl py-20 text-center">
        <h1 className="text-3xl font-extrabold">Tu cuenta es de cliente</h1>
        <p className="mt-3 text-muted-foreground">Para ofrecer servicios, cambia tu cuenta a trabajador. Podrás seguir buscando servicios.</p>
        <Button className="mt-6" onClick={async () => {
          const { error } = await supabase.from("profiles").update({ tipo: "trabajador" }).eq("id", user.id);
          if (error) return void toast.error("No se pudo cambiar");
          window.location.reload();
        }}>Cambiar a cuenta de trabajador</Button>
      </div>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = schema.safeParse(f);
    if (!p.success) return void toast.error(p.error.issues[0]?.message ?? "Datos no válidos");
    const wa = normalizarWhatsapp(f.whatsapp);
    if (!wa) return void toast.error("Ingresa un celular válido, ej: 9 1234 5678");
    if (!consent) return void toast.error("Debes aceptar que tu WhatsApp sea visible");
    setSaving(true);
    let foto_url = foto;
    if (archivo) {
      if (archivo.size > 2 * 1024 * 1024) { setSaving(false); return void toast.error("La foto debe pesar menos de 2 MB"); }
      const path = `${user!.id}/${Date.now()}.${archivo.type === "image/png" ? "png" : "jpg"}`;
      const { error } = await supabase.storage.from("fotos").upload(path, archivo, { contentType: archivo.type });
      if (error) { setSaving(false); return void toast.error("No se pudo subir la foto"); }
      foto_url = path;
    }
    const row = { ...p.data, whatsapp: wa, disponible: f.disponible, foto_url, user_id: user!.id };
    const { error } = existenteId
      ? await supabase.from("trabajadores").update(row).eq("id", existenteId)
      : await supabase.from("trabajadores").insert(row);
    setSaving(false);
    if (error) return void toast.error("No se pudo guardar tu perfil");
    toast.success(existenteId ? "Perfil actualizado" : "¡Tu perfil ya está publicado!");
    qc.invalidateQueries();
    navigate({ to: "/mi-cuenta" });
  }

  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{existenteId ? "Editar mi perfil" : "Ofrece tus servicios"}</h1>
      <p className="mt-2 text-muted-foreground">Completa tus datos. Los clientes te contactarán directamente por WhatsApp.</p>
      <form onSubmit={submit} className="mt-8 grid gap-5 rounded-3xl border bg-card p-6 shadow-card sm:grid-cols-2 sm:p-8">
        <div className="flex items-center gap-4 sm:col-span-2">
          {archivo ? <img src={URL.createObjectURL(archivo)} alt="" className="size-20 rounded-full object-cover ring-2 ring-gold" /> : <Avatar nombre={f.nombre || "?"} foto={foto} className="size-20 text-2xl" />}
          <div className="space-y-1.5">
            <Label htmlFor="foto">Foto (opcional)</Label>
            <Input id="foto" type="file" accept="image/jpeg,image/png" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
            <p className="text-xs text-muted-foreground">JPG o PNG, máximo 2 MB.</p>
          </div>
        </div>
        <Field id="nombre" label="Nombre completo"><Input id="nombre" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} autoComplete="name" /></Field>
        <Field id="wa" label="WhatsApp">
          <div className="flex"><span className="inline-flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm">+56</span>
            <Input id="wa" inputMode="numeric" placeholder="9 1234 5678" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} className="rounded-l-none" /></div>
        </Field>
        <Field id="oficio" label="Oficio">
          <select id="oficio" value={f.oficio_id} onChange={(e) => setF({ ...f, oficio_id: Number(e.target.value) })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value={0}>Elige tu oficio</option>
            {oficios.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
          </select>
        </Field>
        <Field id="sector" label="Sector donde trabajas">
          <select id="sector" value={f.sector_id} onChange={(e) => setF({ ...f, sector_id: Number(e.target.value) })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value={0}>Elige tu sector</option>
            {sectores.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </Field>
        <div className="sm:col-span-2"><Field id="tarifa" label="Tarifa referencial"><Input id="tarifa" maxLength={80} placeholder="Ej: Desde $15.000 la visita" value={f.tarifa} onChange={(e) => setF({ ...f, tarifa: e.target.value })} /></Field></div>
        <div className="sm:col-span-2"><Field id="desc" label="¿Qué trabajos haces?">
          <Textarea id="desc" rows={3} maxLength={200} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} />
          <p className="text-right text-xs text-muted-foreground">{f.descripcion.length}/200</p>
        </Field></div>
        <label className="flex items-center gap-3 text-sm font-semibold sm:col-span-2"><Switch checked={f.disponible} onCheckedChange={(v) => setF({ ...f, disponible: v })} /> Estoy disponible ahora</label>
        <label className="flex items-start gap-3 text-sm sm:col-span-2"><Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} className="mt-0.5" /> Acepto que mi número de WhatsApp sea visible para que los clientes me contacten.</label>
        <Button type="submit" variant="gold" size="lg" disabled={saving} className="sm:col-span-2">{saving ? "Guardando…" : existenteId ? "Guardar cambios" : "Publicar mi perfil"}</Button>
      </form>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label>{children}</div>;
}
