import { MUESTRAS_POR_BLOQUE } from "./tipos";

// Código del AudioWorklet: corre en el hilo de audio, junta los cuadros de 128 muestras en
// bloques de 100 ms y los pasa a mono. Va como texto (Blob) porque el worklet se carga por URL
// y así no depende de cómo el empaquetador publique los archivos.
const CODIGO_PROCESADOR = `
class ProcesadorCaptura extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bloque = new Float32Array(${String(MUESTRAS_POR_BLOQUE)});
    this.largo = 0;
  }
  process(entradas) {
    const canales = entradas[0];
    if (!canales || canales.length === 0) return true;
    for (let i = 0; i < canales[0].length; i++) {
      let suma = 0;
      for (const canal of canales) suma += canal[i];
      this.bloque[this.largo++] = suma / canales.length;
      if (this.largo === this.bloque.length) {
        this.port.postMessage(this.bloque, [this.bloque.buffer]);
        this.bloque = new Float32Array(${String(MUESTRAS_POR_BLOQUE)});
        this.largo = 0;
      }
    }
    return true;
  }
}
registerProcessor("captura-audio", ProcesadorCaptura);
`;

export const NOMBRE_PROCESADOR = "captura-audio";

export function urlDelProcesador(): string {
  return URL.createObjectURL(new Blob([CODIGO_PROCESADOR], { type: "text/javascript" }));
}
