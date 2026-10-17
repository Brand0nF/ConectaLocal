import type { ReactNode } from "react";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="bg-ink-gradient">
      <div className="container-page flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
        <div className="w-full max-w-md rounded-3xl bg-card p-7 shadow-lift sm:p-9">
          <h1 className="text-2xl font-extrabold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function GoogleButton() {
  async function go() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("No se pudo iniciar con Google");
  }
  return (
    <Button type="button" variant="outline" className="h-11 w-full" onClick={go}>
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true"><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.65 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 3.7 14.55 2.75 12 2.75 6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25c6.93 0 9.5-4.86 9.5-7.36 0-.5-.05-.88-.15-1.27z" /></svg>
      Continuar con Google
    </Button>
  );
}

export function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" /> o con tu correo <span className="h-px flex-1 bg-border" />
    </div>
  );
}
