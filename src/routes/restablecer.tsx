import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/site/AuthCard";

export const Route = createFileRoute("/restablecer")({
  head: () => ({
    meta: [
      { title: "Nueva contraseña · ConectaLocal" },
      { name: "description", content: "Define una nueva contraseña para tu cuenta." },
      { property: "og:title", content: "Nueva contraseña · ConectaLocal" },
      { property: "og:description", content: "Restablece tu contraseña." },
    ],
  }),
  component: Restablecer,
});

function Restablecer() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Mínimo 8 caracteres");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error("El enlace expiró. Solicita uno nuevo.");
    toast.success("Contraseña actualizada");
    navigate({ to: "/mi-cuenta" });
  }
  return (
    <AuthCard title="Nueva contraseña" subtitle="Escribe tu nueva contraseña.">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="pw">Contraseña nueva</Label><Input id="pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" /></div>
        <Button type="submit" className="h-11 w-full" disabled={loading}>Guardar</Button>
      </form>
    </AuthCard>
  );
}
