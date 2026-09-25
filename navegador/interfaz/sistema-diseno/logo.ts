import { LARGO_MAXIMO_DE_LOGO, type Resultado } from "@compartido/contratos";

const LADO_MAXIMO_PX = 256;

// El logo se guarda en la base como imagen chica: se achica en el navegador antes de enviarlo (un
// PNG de 3 MB no entra) y se convierte a WebP, que conserva la transparencia.
export async function achicarLogo(archivo: File): Promise<Resultado<string>> {
  if (!archivo.type.startsWith("image/")) {
    return { ok: false, motivo: "El logo tiene que ser una imagen (PNG, JPG o WebP)." };
  }
  let imagen: ImageBitmap;
  try {
    imagen = await createImageBitmap(archivo);
  } catch {
    return { ok: false, motivo: "No pudimos leer esa imagen. Probá con otra." };
  }

  const escala = Math.min(1, LADO_MAXIMO_PX / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.max(1, Math.round(imagen.width * escala));
  lienzo.height = Math.max(1, Math.round(imagen.height * escala));
  const contexto = lienzo.getContext("2d");
  if (!contexto) return { ok: false, motivo: "Este navegador no pudo achicar la imagen." };
  contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close();

  const url = lienzo.toDataURL("image/webp", 0.85);
  if (!url.startsWith("data:image/webp") || url.length > LARGO_MAXIMO_DE_LOGO) {
    return {
      ok: false,
      motivo: "El logo sigue siendo demasiado pesado. Probá con uno más simple.",
    };
  }
  return { ok: true, valor: url };
}
