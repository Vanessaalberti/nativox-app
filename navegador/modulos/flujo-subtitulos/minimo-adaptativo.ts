// En local, Whisper tarda casi lo mismo con un fragmento corto que con uno largo (procesa siempre
// 30 s): cortar más seguido que lo que tarda una pasada forma cola. El mínimo del corte sigue a la
// pasada medida: promedio de las últimas × 1,2 + 0,3 s, entre 1,5 y 4 s.
const PASADAS_PROMEDIADAS = 5;
const MINIMO = 1.5;
const MAXIMO = 4;

export function crearMinimoAdaptativo(alCambiar: (segundos: number) => void) {
  const pasadas: number[] = [];
  return {
    registrarPasada(ms: number) {
      pasadas.push(ms);
      if (pasadas.length > PASADAS_PROMEDIADAS) pasadas.shift();
      const promedioSegundos = pasadas.reduce((a, b) => a + b, 0) / pasadas.length / 1000;
      alCambiar(Math.min(MAXIMO, Math.max(MINIMO, promedioSegundos * 1.2 + 0.3)));
    },
  };
}
