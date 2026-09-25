import type { Linea, Resultado } from "@compartido/contratos";
import type { EntradaGlosario } from "@compartido/glosario";

export interface FragmentoDeAudio {
  numero: number;
  audio: Float32Array;
  inicio: number;
  fin: number;
  segundosDeContexto: number;
}

// Lo que el flujo necesita de cada pieza. Entran por parámetro (ver el README): quien arma la
// sesión elige el motor, el traductor y el cortador, y en las pruebas se usan de mentira.
export interface PiezasDelFlujo {
  cortador: {
    agregar(bloque: Float32Array): FragmentoDeAudio[];
    terminar(): FragmentoDeAudio[];
    cambiarMinimo(segundos: number): void;
    pendiente(): { audio: Float32Array; inicio: number; tieneVoz: boolean };
  };
  // Ya con el filtro de alucinaciones y su reintento.
  transcribir(
    audio: Float32Array,
    opciones: { prompt: string; idioma: string },
  ): Promise<Resultado<{ texto: string; ms: number }>>;
  quitarRepetido(anterior: string, nuevo: string): string;
  crearAcuerdo(): {
    agregarPasada(texto: string): { estable: string; provisorio: string };
    reiniciar(): void;
  };
  // Ya con el glosario protegido, el contexto de la línea anterior y su cola.
  traducir(pedido: {
    texto: string;
    anterior: string;
    de: string;
    a: string;
  }): Promise<Resultado<{ texto: string }>>;
}

export interface Medicion {
  numero: number;
  transcripcionMs: number;
  traduccionMs: number;
  // Desde que terminó de decirse la frase hasta que se ve confirmada y traducida.
  retrasoConfirmacionSegundos: number;
  retrasoTraduccionSegundos: number;
}

export interface OpcionesFlujo extends PiezasDelFlujo {
  idSesion: string;
  idiomaOriginal: string;
  idiomasDestino: readonly string[];
  glosario: readonly EntradaGlosario[];
  // Cada cuánto se muestra lo que se viene diciendo (texto provisorio); 0 = solo frases enteras.
  pasadaProvisoriaCadaMs: number;
  ahoraMs(): number;
  alCambiarLinea: (linea: Linea) => void;
  alMedir: (medicion: Medicion) => void;
  alFallar: (motivo: string) => void;
}
