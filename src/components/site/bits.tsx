import { useQuery } from "@tanstack/react-query";
import {
  Armchair, Car, Droplets, Hammer, KeyRound, PaintRoller, Sprout, Star, Wrench, Zap, MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { enlaceWhatsapp } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";

const ICONS: Record<string, LucideIcon> = {
  droplets: Droplets, zap: Zap, "paint-roller": PaintRoller, sprout: Sprout, hammer: Hammer,
  "key-round": KeyRound, armchair: Armchair, car: Car, wrench: Wrench,
};

export function OficioIcon({ icono, className }: { icono: string; className?: string }) {
  const I = ICONS[icono] ?? Wrench;
  return <I className={className} aria-hidden="true" />;
}

export function Stars({ value, size = "sm" }: { value: number | null; size?: "sm" | "lg" }) {
  const v = value ?? 0;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={value ? `${value} de 5 estrellas` : "Sin calificaciones"}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={cn(size === "lg" ? "size-5" : "size-4", i <= Math.round(v) ? "fill-gold text-gold" : "text-border")}
        />
      ))}
    </span>
  );
}

export function useFotoUrl(path: string | null) {
  return useQuery({
    queryKey: ["foto", path],
    enabled: !!path,
    staleTime: 1000 * 60 * 50,
    queryFn: async () => {
      const { data } = await supabase.storage.from("fotos").createSignedUrl(path!, 60 * 60);
      return data?.signedUrl ?? null;
    },
  });
}

export function Avatar({ nombre, foto, className }: { nombre: string; foto: string | null; className?: string }) {
  const { data: url } = useFotoUrl(foto);
  const iniciales = nombre.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full bg-gold-soft font-display font-extrabold text-accent-foreground ring-2 ring-gold", className)}>
      {url ? <img src={url} alt={`Foto de ${nombre}`} className="size-full object-cover" /> : <span aria-hidden="true">{iniciales}</span>}
    </div>
  );
}

export function WhatsAppButton({
  numero, nombre, oficio, disponible = true, className, size = "default",
}: { numero: string; nombre: string; oficio?: string; disponible?: boolean; className?: string; size?: "default" | "lg" }) {
  return (
    <Button asChild variant="whatsapp" size={size} className={cn(size === "default" && "rounded-full", className)}>
      <a href={enlaceWhatsapp(numero, nombre, oficio)} target="_blank" rel="noopener noreferrer" aria-label={`Escribir a ${nombre} por WhatsApp`}>
        <MessageCircle />
        {disponible ? "Contactar por WhatsApp" : "Consultar disponibilidad"}
      </a>
    </Button>
  );
}

export function EstadoBadge({ disponible }: { disponible: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
        disponible ? "bg-whatsapp/10 text-success" : "bg-muted text-muted-foreground",
      )}
    >
      <span className={cn("size-2 rounded-full", disponible ? "bg-whatsapp" : "bg-muted-foreground/50")} aria-hidden="true" />
      {disponible ? "Disponible" : "Ocupado"}
    </span>
  );
}
