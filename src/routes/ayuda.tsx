import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, UserRound, MessageCircle, ShieldCheck } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/ayuda")({
  head: () => ({
    meta: [
      { title: "Centro de ayuda y preguntas frecuentes · ConectaLocal" },
      { name: "description", content: "Resuelve tus dudas sobre cómo buscar, contactar y publicar servicios en ConectaLocal." },
      { property: "og:title", content: "Centro de ayuda · ConectaLocal" },
      { property: "og:description", content: "Preguntas frecuentes y guías de uso." },
    ],
  }),
  component: Ayuda,
});

const temas = [
  [Search, "Buscar servicios", "Usa el buscador o los filtros por oficio y sector. Activa “solo disponibles” para ver quién puede atenderte ahora."],
  [MessageCircle, "Contactar", "El botón verde abre WhatsApp con un mensaje listo. Funciona en celular y computador."],
  [UserRound, "Tu cuenta", "Crea una cuenta de cliente para dejar reseñas o de trabajador para publicar tu perfil."],
  [ShieldCheck, "Seguridad", "Acuerda precio antes de iniciar, pide boleta si corresponde y deja tu reseña al terminar."],
] as const;

const faq = [
  ["¿ConectaLocal cobra comisión?", "No. El contacto es directo entre cliente y trabajador. Acuerdan precio y forma de pago entre ustedes."],
  ["¿Necesito cuenta para contactar a alguien?", "No. Cualquier persona puede buscar y escribir por WhatsApp. La cuenta solo se necesita para dejar reseñas o publicar un perfil."],
  ["¿Cómo publico mi oficio?", "Crea una cuenta de trabajador y completa el formulario “Ofrece tus servicios”. Tu perfil queda visible de inmediato."],
  ["¿Puedo cambiar mi disponibilidad?", "Sí. Desde “Mi cuenta” puedes marcarte como disponible u ocupado con un clic."],
  ["¿Quién puede dejar reseñas?", "Las cuentas de cliente. Cada cliente puede dejar una reseña por trabajador y editarla después."],
  ["¿Qué significa “Destacado”?", "Son perfiles verificados por el equipo de ConectaLocal por su buen servicio."],
  ["¿Cómo elimino mi perfil?", "En “Mi cuenta” encontrarás el botón Eliminar. Tu perfil dejará de aparecer en el directorio."],
];

function Ayuda() {
  return (
    <>
      <section className="bg-ink-gradient text-ink-foreground">
        <div className="container-page py-16">
          <h1 className="text-4xl font-extrabold sm:text-5xl">Centro de ayuda</h1>
          <p className="mt-4 max-w-xl text-lg text-ink-muted">Todo lo que necesitas saber para usar ConectaLocal.</p>
        </div>
      </section>
      <div className="container-page py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {temas.map(([I, t, d]) => (
            <div key={t} className="rounded-2xl border bg-card p-5 shadow-card">
              <span className="grid size-11 place-items-center rounded-xl bg-gold-soft text-accent-foreground"><I className="size-5" /></span>
              <h2 className="mt-4 font-bold">{t}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <section id="faq" className="mx-auto mt-16 max-w-3xl scroll-mt-24">
          <h2 className="text-3xl font-extrabold">Preguntas frecuentes</h2>
          <Accordion type="single" collapsible className="mt-6 rounded-2xl border bg-card px-5 shadow-card">
            {faq.map(([q, a], i) => (
              <AccordionItem key={q} value={`q${i}`}>
                <AccordionTrigger className="text-left text-base font-bold">{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-6 text-center text-sm text-muted-foreground">¿No encontraste tu respuesta? <Link to="/como-funciona" className="font-bold text-foreground underline">Revisa cómo funciona</Link>.</p>
        </section>
      </div>
    </>
  );
}
