import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Hammer, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/site/AuthCard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crear-cuenta")({
  validateSearch: z.object({ tipo: z.enum(["cliente", "trabajador"]).optional() }),
  head: () => ({
    meta: [
      { title: "Crear cuenta · ConectaLocal" },
      { name: "description", content: "Crea tu cuenta gratis como cliente o trabajador." },
      { property: "og:title", content: "Crear cuenta · ConectaLocal" },
      { property: "og:description", content: "Únete gratis a ConectaLocal." },
    ],
  }),
  component: CrearCuenta,
});

const schema = z.object({
  nombre: z.string().trim().min(2, "Ingresa tu nombre").max(100),
  email: z.string().trim().email("Correo no válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

function CrearCuenta() {
  const search = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<"cliente" | "trabajador">(search.tipo ?? "cliente");
  const [form, setForm] = useState({ nombre: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/mi-cuenta" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = schema.safeParse(form);
    if (!p.success) return void toast.error(p.error.issues[0]?.message ?? "Datos no válidos");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: p.data.email,
      password: p.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}${tipo === "trabajador" ? "/registro" : "/mi-cuenta"}`,
        data: { nombre: p.data.nombre, tipo },
      },
    });
    setLoading(false);
    if (error) return void toast.error(error.message.includes("registered") ? "Ese correo ya tiene una cuenta" : error.message);
    if (!data.session) setEnviado(true);
  }

  if (enviado)
    return (
      <AuthCard title="Revisa tu correo" subtitle="Te enviamos un enlace para confirmar tu cuenta.">
        <p className="text-sm text-muted-foreground">Abre el correo que enviamos a <b className="text-foreground">{form.email}</b> y haz clic en el enlace. Si no lo ves, revisa la carpeta de spam.</p>
        <Button asChild variant="outline" className="mt-6 w-full"><Link to="/login">Ir a iniciar sesión</Link></Button>
      </AuthCard>
    );

  return (
    <AuthCard title="Crea tu cuenta" subtitle="Es gratis y toma menos de un minuto.">
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de cuenta">
        {([["cliente", UserRound, "Busco servicios"], ["trabajador", Hammer, "Ofrezco servicios"]] as const).map(([v, I, l]) => (
          <button key={v} type="button" role="radio" aria-checked={tipo === v} onClick={() => setTipo(v)}
            className={cn("flex flex-col items-center gap-1 rounded-xl border-2 p-4 text-sm font-bold transition-colors", tipo === v ? "border-gold bg-gold-soft" : "hover:border-gold/50")}>
            <I className="size-5" /> {l}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="space-y-1.5"><Label htmlFor="nombre">Nombre completo</Label><Input id="nombre" autoComplete="name" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="h-11" /></div>
        <div className="space-y-1.5"><Label htmlFor="email">Correo electrónico</Label><Input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11" /></div>
        <div className="space-y-1.5"><Label htmlFor="password">Contraseña</Label><Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-11" /><p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p></div>
        <Button type="submit" className="h-11 w-full" disabled={loading}>Crear cuenta</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">¿Ya tienes cuenta? <Link to="/login" className="font-bold text-foreground hover:underline">Inicia sesión</Link></p>
    </AuthCard>
  );
}
