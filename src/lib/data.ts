import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Oficio = { id: number; nombre: string; icono: string };
export type Sector = { id: number; nombre: string };
export type Trabajador = {
  id: number;
  user_id: string | null;
  nombre: string;
  whatsapp: string;
  oficio_id: number;
  sector_id: number;
  tarifa: string;
  descripcion: string;
  foto_url: string | null;
  disponible: boolean;
  destacado: boolean;
  creado_en: string;
  oficio: string;
  oficio_icono: string;
  sector: string;
  promedio: number | null;
  total_resenas: number;
};
export type Resena = {
  id: number;
  trabajador_id: number;
  usuario_id: string | null;
  autor_nombre: string;
  estrellas: number;
  comentario: string;
  creado_en: string;
};

type Row = {
  id: number; user_id: string | null; nombre: string; whatsapp: string; oficio_id: number; sector_id: number;
  tarifa: string; descripcion: string; foto_url: string | null; disponible: boolean; destacado: boolean; creado_en: string;
  oficios: { nombre: string; icono: string } | null;
  sectores: { nombre: string } | null;
  resenas: { estrellas: number }[] | null;
};

const SELECT = "*, oficios(nombre, icono), sectores(nombre), resenas(estrellas)";

function mapRow(r: Row): Trabajador {
  const est = r.resenas ?? [];
  const total = est.length;
  const promedio = total ? Math.round((est.reduce((a, b) => a + b.estrellas, 0) / total) * 10) / 10 : null;
  return {
    id: r.id, user_id: r.user_id, nombre: r.nombre, whatsapp: r.whatsapp, oficio_id: r.oficio_id, sector_id: r.sector_id,
    tarifa: r.tarifa, descripcion: r.descripcion, foto_url: r.foto_url, disponible: r.disponible, destacado: r.destacado,
    creado_en: r.creado_en, oficio: r.oficios?.nombre ?? "", oficio_icono: r.oficios?.icono ?? "wrench",
    sector: r.sectores?.nombre ?? "", promedio, total_resenas: total,
  };
}

export const oficiosQuery = queryOptions({
  queryKey: ["oficios"],
  queryFn: async () => {
    const { data, error } = await supabase.from("oficios").select("*").order("nombre");
    if (error) throw error;
    return data as Oficio[];
  },
});

export const sectoresQuery = queryOptions({
  queryKey: ["sectores"],
  queryFn: async () => {
    const { data, error } = await supabase.from("sectores").select("*").order("nombre");
    if (error) throw error;
    return data as Sector[];
  },
});

export const trabajadoresQuery = queryOptions({
  queryKey: ["trabajadores"],
  queryFn: async () => {
    const { data, error } = await supabase.from("trabajadores").select(SELECT);
    if (error) throw error;
    return (data as unknown as Row[]).map(mapRow).sort(
      (a, b) =>
        Number(b.destacado) - Number(a.destacado) ||
        Number(b.disponible) - Number(a.disponible) ||
        (b.promedio ?? 0) - (a.promedio ?? 0) ||
        b.total_resenas - a.total_resenas,
    );
  },
});

export const trabajadorQuery = (id: number) =>
  queryOptions({
    queryKey: ["trabajador", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("trabajadores").select(SELECT).eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? mapRow(data as unknown as Row) : null;
    },
  });

export const resenasQuery = (trabajadorId: number) =>
  queryOptions({
    queryKey: ["resenas", trabajadorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resenas").select("*").eq("trabajador_id", trabajadorId).order("creado_en", { ascending: false });
      if (error) throw error;
      return data as Resena[];
    },
  });

export const totalResenasQuery = queryOptions({
  queryKey: ["resenas-total"],
  queryFn: async () => {
    const { count, error } = await supabase.from("resenas").select("id", { count: "exact", head: true });
    if (error) throw error;
    return count ?? 0;
  },
});

export function quitarTildes(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
}
