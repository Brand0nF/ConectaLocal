import { Link } from "@tanstack/react-router";
import { Logo } from "./SiteHeader";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-ink-muted">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            El directorio de oficios y comercio local de Temuco y alrededores. Contacto directo por WhatsApp, sin intermediarios ni comisiones.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-foreground">Explorar</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/oficios" className="hover:text-gold">Todos los servicios</Link></li>
            <li><Link to="/oficios" search={{ disponible: true }} className="hover:text-gold">Disponibles ahora</Link></li>
            <li><Link to="/registro" className="hover:text-gold">Publica tu oficio</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-foreground">Soporte</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/como-funciona" className="hover:text-gold">Cómo funciona</Link></li>
            <li><Link to="/ayuda" className="hover:text-gold">Centro de ayuda</Link></li>
            <li><Link to="/ayuda" hash="faq" className="hover:text-gold">Preguntas frecuentes</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-foreground/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} ConectaLocal. Hecho en La Araucanía.</p>
          <p>ConectaLocal no cobra comisiones: acuerdas precio y forma de pago directamente.</p>
        </div>
      </div>
    </footer>
  );
}
