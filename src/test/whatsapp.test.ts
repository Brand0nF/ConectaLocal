import { describe, expect, it } from "vitest";
import { enlaceWhatsapp, normalizarWhatsapp } from "@/lib/whatsapp";

describe("WhatsApp", () => {
  it("acepta celular de 9 dígitos con espacios", () => {
    expect(normalizarWhatsapp("9 1234 5678")).toBe("56912345678");
  });
  it("acepta formato internacional", () => {
    expect(normalizarWhatsapp("+56 9 1234 5678")).toBe("56912345678");
  });
  it("rechaza números que no son celulares chilenos", () => {
    expect(normalizarWhatsapp("2 2345 678")).toBeNull();
    expect(normalizarWhatsapp("812345678")).toBeNull();
  });
  it("arma enlace wa.me con el número", () => {
    expect(enlaceWhatsapp("56912345678", "Ana").startsWith("https://wa.me/56912345678?text=")).toBe(true);
  });
});
