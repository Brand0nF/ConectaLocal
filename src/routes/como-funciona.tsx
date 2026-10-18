import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Cómo funciona · ConectaLocal" },
      { name: "description", content: "Busca, compara y contacta por WhatsApp a trabajadores locales en tres pasos." },
      { property: "og:title", content: "Cómo funciona · ConectaLocal" },
      { property: "og:description", content: "Tres pasos para encontrar un oficio de confianza." },
    ],
  }),
  component: Page,
});

const clientes = [
  ["Busca", "Filtra por oficio, sector o escribe lo que necesitas, como “filtración” o “enchufe”."],
  ["Compara", "Revisa tarifa referencial, disponibilidad y reseñas de otros vecinos."],
  ["Escribe por WhatsApp", "Un clic abre WhatsApp con un mensaje listo. Acuerdas precio y horario directamente."],
];
const trabajadores = [
  ["Crea tu cuenta", "Regístrate gratis como trabajador con tu correo o Google."],
  ["Publica tu perfil", "Indica tu oficio, sector, tarifa y una breve descripción. Agrega una foto si quieres."],
  ["Recibe clientes", "Los vecinos te escriben a tu WhatsApp. Actualiza tu disponibilidad cuando quieras."],
];

function Page() {
  return (
    <>
      <section className="bg-ink-gradient text-ink-foreground">
        <div className="container-page py-16">
          <h1 className="max-w-2xl text-4xl font-extrabold sm:text-5xl">Cómo funciona ConectaLocal</h1>
          <p className="mt-4 max-w-xl text-lg text-ink-muted">Sin intermediarios, sin comisiones. Solo vecinos conectando con vecinos.</p>
        </div>
      </section>
      <div className="container-page grid gap-12 py-16 lg:grid-cols-2">
        {[["Si buscas un servicio", clientes, "/oficios", "Buscar un servicio"], ["Si ofreces un servicio", trabajadores, "/registro", "Ofrece tus servicios"]].map(([t, pasos, to, cta]) => (
          <section key={t as string}>
            <h2 className="text-2xl font-extrabold">{t as string}</h2>
            <ol className="mt-6 space-y-5">
              {(pasos as string[][]).map(([h, d], i) => (
                <li key={h} className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink font-display font-extrabold text-gold">{i + 1}</span>
                  <div><h3 className="font-bold">{h}</h3><p className="text-muted-foreground">{d}</p></div>
                </li>
              ))}
            </ol>
            <Button asChild variant="gold" size="lg" className="mt-8"><Link to={to as "/oficios"}>{cta as string}</Link></Button>
          </section>
        ))}
      </div>
    </>
  );
}
