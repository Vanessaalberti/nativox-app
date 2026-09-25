import type { Idioma, TranscripcionNube } from "@compartido/contratos";

// Quien transcribe una frase en la nube. La real es Whisper en Workers AI; en las pruebas, uno de
// mentira.
export interface Transcriptor {
  transcribir: (pedido: {
    audio: Uint8Array;
    idioma: Idioma;
    // El glosario y lo último que se dijo: mantiene los términos y la continuidad entre frases.
    prompt: string;
  }) => Promise<Pick<TranscripcionNube, "texto" | "palabras">>;
}
