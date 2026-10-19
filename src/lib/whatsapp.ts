/** Normaliza un número chileno de celular a formato 569XXXXXXXX. Devuelve null si no es válido. */
export function normalizarWhatsapp(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let n = digits;
  if (n.length === 9 && n.startsWith("9")) n = "56" + n;
  return /^569\d{8}$/.test(n) ? n : null;
}

export function formatearWhatsapp(n: string): string {
  if (!/^569\d{8}$/.test(n)) return n;
  return `+56 9 ${n.slice(3, 7)} ${n.slice(7)}`;
}

export function enlaceWhatsapp(numero: string, nombre: string, oficio?: string): string {
  const texto = `Hola ${nombre}, te encontré en ConectaLocal${oficio ? ` y necesito un servicio de ${oficio.toLowerCase()}` : ""}. ¿Tienes disponibilidad?`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
