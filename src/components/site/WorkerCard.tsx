import { Link } from "@tanstack/react-router";
import { MapPin, BadgeCheck } from "lucide-react";
import type { Trabajador } from "@/lib/data";
import { Avatar, EstadoBadge, OficioIcon, Stars, WhatsAppButton } from "./bits";

export function WorkerCard({ t }: { t: Trabajador }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-lift">
      <div className="flex items-start gap-4">
        <Avatar nombre={t.nombre} foto={t.foto_url} className="size-14 text-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-lg font-bold">
              <Link to="/trabajador/$id" params={{ id: String(t.id) }} className="hover:underline">
                {t.nombre}
              </Link>
            </h3>
            {t.destacado && <BadgeCheck className="size-5 shrink-0 text-gold" aria-label="Destacado" />}
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <OficioIcon icono={t.oficio_icono} className="size-4" /> {t.oficio}
          </p>
        </div>
        <EstadoBadge disponible={t.disponible} />
      </div>
      <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{t.descripcion}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-1 text-muted-foreground"><MapPin className="size-4" /> {t.sector}</span>
        <span className="inline-flex items-center gap-1.5">
          <Stars value={t.promedio} />
          <span className="text-muted-foreground">
            {t.promedio ? `${t.promedio.toFixed(1).replace(".", ",")} (${t.total_resenas})` : "Nuevo"}
          </span>
        </span>
      </div>
      <p className="mt-3 font-display text-base font-bold">{t.tarifa}</p>
      <div className="mt-auto flex gap-2 pt-5">
        <WhatsAppButton numero={t.whatsapp} nombre={t.nombre} oficio={t.oficio} disponible={t.disponible} className="flex-1" />
        <Link
          to="/trabajador/$id"
          params={{ id: String(t.id) }}
          className="inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold hover:bg-secondary"
        >
          Ver perfil
        </Link>
      </div>
    </article>
  );
}
