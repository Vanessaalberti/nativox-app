import { normalizarPalabra, separarPalabras } from "../texto";

// Transcripción en vivo (LocalAgreement, como whisper_streaming): mientras se habla, Whisper
// vuelve a transcribir cada ~1 s lo que se viene diciendo. Lo que dos pasadas seguidas dicen
// igual al principio queda estable y no retrocede; el resto puede cambiar en la próxima pasada.
// La confirmación definitiva llega con el corte de la frase.
export interface AcuerdoLocal {
  agregarPasada(texto: string): { estable: string; provisorio: string };
  reiniciar(): void;
}

export function crearAcuerdoLocal(): AcuerdoLocal {
  let anterior: string[] = [];
  let estable: string[] = [];

  return {
    agregarPasada(texto) {
      const palabras = separarPalabras(texto);
      const comun = largoComun(anterior, palabras);
      if (comun > estable.length) estable = palabras.slice(0, comun);
      anterior = palabras;
      return {
        estable: estable.join(" "),
        provisorio: palabras.slice(estable.length).join(" "),
      };
    },
    reiniciar() {
      anterior = [];
      estable = [];
    },
  };
}

function largoComun(a: readonly string[], b: readonly string[]): number {
  let largo = 0;
  while (
    largo < a.length &&
    largo < b.length &&
    normalizarPalabra(a[largo] ?? "") === normalizarPalabra(b[largo] ?? "")
  ) {
    largo++;
  }
  return largo;
}
