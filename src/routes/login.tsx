import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard, Divider, GoogleButton } from "@/components/site/AuthCard";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Iniciar sesión · ConectaLocal" },
      { name: "description", content: "Ingresa a tu cuenta de ConectaLocal." },
      { property: "og:title", content: "Iniciar sesión · ConectaLocal" },
      { property: "og:description", content: "Accede para gestionar tu perfil o dejar reseñas." },
    ],
  }),
  component: Login,
});

function safe(path?: string) {
  return path && path.startsWith("/") && !path.startsWith("//") ? path : "/mi-cuenta";
}

function Login() {
  const { redirect } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ver, setVer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<"login" | "reset">("login");

  useEffect(() => {
    if (user) navigate({ to: safe(redirect) });
  }, [user, redirect, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (modo === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/restablecer` });
      setLoading(false);
      if (error) return void toast.error(error.message);
      toast.success("Te enviamos un correo para restablecer tu contraseña");
      return setModo("login");
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message.includes("confirm") ? "Confirma tu correo antes de ingresar" : "Correo o contraseña incorrectos");
  }

  return (
    <AuthCard title={modo === "login" ? "Bienvenido de vuelta" : "Recuperar contraseña"} subtitle={modo === "login" ? "Ingresa para gestionar tu perfil o dejar reseñas." : "Te enviaremos un enlace a tu correo."}>
      {modo === "login" && <><GoogleButton /><Divider /></>}
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
        </div>
        {modo === "login" && (
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <button type="button" onClick={() => setModo("reset")} className="text-xs font-semibold text-muted-foreground hover:underline">¿La olvidaste?</button>
            </div>
            <div className="relative">
              <Input id="password" type={ver ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-11" />
              <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground">
                {ver ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        )}
        <Button type="submit" className="h-11 w-full" disabled={loading}>{modo === "login" ? "Iniciar sesión" : "Enviar enlace"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {modo === "reset" ? (
          <button onClick={() => setModo("login")} className="font-bold text-foreground hover:underline">Volver a iniciar sesión</button>
        ) : (
          <>¿No tienes cuenta? <Link to="/crear-cuenta" className="font-bold text-foreground hover:underline">Crear cuenta</Link></>
        )}
      </p>
    </AuthCard>
  );
}
