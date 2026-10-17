import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, LogOut, UserRound, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight" aria-label="ConectaLocal, inicio">
      <span className="grid size-8 place-items-center rounded-lg bg-gold text-ink text-sm">CL</span>
      <span className={light ? "text-ink-foreground" : "text-foreground"}>
        Conecta<span className="text-gold">Local</span>
      </span>
    </Link>
  );
}

const links = [
  { to: "/oficios", label: "Buscar servicios" },
  { to: "/como-funciona", label: "Cómo funciona" },
  { to: "/ayuda", label: "Ayuda" },
] as const;

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function salir() {
    await signOut();
    setOpen(false);
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-foreground/10 bg-ink/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo light />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink-foreground"
              activeProps={{ className: "text-ink-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {isAdmin && (
                <Button asChild variant="ink-outline" size="sm">
                  <Link to="/admin"><ShieldCheck /> Admin</Link>
                </Button>
              )}
              <Button asChild variant="ink-outline" size="sm">
                <Link to="/mi-cuenta"><UserRound /> Mi cuenta</Link>
              </Button>
              <Button variant="ghost" size="sm" className="text-ink-muted hover:bg-ink-foreground/10 hover:text-ink-foreground" onClick={salir}>
                <LogOut /> Salir
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground">
                <Link to="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild variant="gold" size="sm" className="rounded-full px-4">
                <Link to="/registro">Ofrece tus servicios</Link>
              </Button>
            </>
          )}
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground md:hidden" aria-label="Abrir menú">
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 bg-ink text-ink-foreground border-ink-foreground/10">
            <SheetTitle className="sr-only">Menú</SheetTitle>
            <div className="mt-2"><Logo light /></div>
            <nav className="mt-8 flex flex-col gap-1" aria-label="Menú móvil">
              {links.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 font-display text-lg font-bold hover:bg-ink-foreground/10">
                  {l.label}
                </Link>
              ))}
              <div className="my-4 h-px bg-ink-foreground/10" />
              {user ? (
                <>
                  {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 font-semibold hover:bg-ink-foreground/10">Panel admin</Link>}
                  <Link to="/mi-cuenta" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 font-semibold hover:bg-ink-foreground/10">Mi cuenta</Link>
                  <button onClick={salir} className="rounded-lg px-3 py-3 text-left font-semibold text-ink-muted hover:bg-ink-foreground/10">Cerrar sesión</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 font-semibold hover:bg-ink-foreground/10">Iniciar sesión</Link>
                  <Button asChild variant="gold" size="lg" className="mt-2">
                    <Link to="/registro" onClick={() => setOpen(false)}>Ofrece tus servicios</Link>
                  </Button>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
