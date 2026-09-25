import { describe, expect, it } from "vitest";
import { crearCortador, type Fragmento } from "./index";
import { unir as unirPartes } from "./silencios";

const FRECUENCIA = 16_000;

// Audio de prueba determinista: "voz" es un tono con volumen que ondula (como las sílabas) y
// "silencio" es un ruido de fondo muy bajo, como el de una sala.
function voz(segundos: number): Float32Array {
  const audio = new Float32Array(Math.round(segundos * FRECUENCIA));
  for (let i = 0; i < audio.length; i++) {
    const silabas = 0.6 + 0.4 * Math.sin((2 * Math.PI * 4 * i) / FRECUENCIA);
    audio[i] = 0.2 * silabas * Math.sin((2 * Math.PI * 220 * i) / FRECUENCIA);
  }
  return audio;
}

function silencio(segundos: number): Float32Array {
  const audio = new Float32Array(Math.round(segundos * FRECUENCIA));
  let semilla = 7;
  for (let i = 0; i < audio.length; i++) {
    semilla = (semilla * 1_103_515_245 + 12_345) % 2_147_483_648;
    audio[i] = (semilla / 2_147_483_648 - 0.5) * 0.002;
  }
  return audio;
}

const unir = (...partes: Float32Array[]) => unirPartes(partes);

// Pasa el audio en bloques de 100 ms, como llega de la captura.
function cortarTodo(audio: Float32Array, minimoSegundos = 1.5): Fragmento[] {
  const cortador = crearCortador({ minimoSegundos });
  const fragmentos: Fragmento[] = [];
  for (let i = 0; i < audio.length; i += 1600) {
    fragmentos.push(...cortador.agregar(audio.slice(i, i + 1600)));
  }
  return [...fragmentos, ...cortador.terminar()];
}

// Tres frases separadas por pausas de fin de frase (0,5 s y 0,4 s), con una pausa entre
// palabras de 0,15 s adentro de la primera, como en el discurso de JFK.
const tresFrases = unir(
  silencio(0.6),
  voz(1.2),
  silencio(0.15),
  voz(1.0),
  silencio(0.5),
  voz(2.0),
  silencio(0.4),
  voz(1.5),
  silencio(1.0),
);

describe("crearCortador", () => {
  it("corta en las tres frases y no entre palabras", () => {
    const fragmentos = cortarTodo(tresFrases);

    expect(fragmentos.map((f) => f.numero)).toEqual([0, 1, 2]);
    // La frase termina a los 2,95 s y el corte cae 0,15 s dentro de la pausa.
    expect(fragmentos[0]?.inicio).toBeCloseTo(0.35, 1);
    expect(fragmentos[0]?.fin).toBeCloseTo(3.1, 1);
    expect(fragmentos[1]?.inicio).toBeCloseTo(3.2, 1);
    expect(fragmentos[1]?.fin).toBeCloseTo(5.6, 1);
    expect(fragmentos[2]?.fin).toBeCloseTo(7.5, 1);
  });

  it("pega adelante 1,5 s del fragmento anterior como contexto, salvo en el primero", () => {
    const [primero, segundo] = cortarTodo(tresFrases);

    expect(primero?.segundosDeContexto).toBe(0);
    expect(segundo?.segundosDeContexto).toBeCloseTo(1.5, 2);
    const duracionNueva = (segundo?.fin ?? 0) - (segundo?.inicio ?? 0);
    expect((segundo?.audio.length ?? 0) / FRECUENCIA).toBeCloseTo(1.5 + duracionNueva, 1);
  });

  it("no manda un fragmento sin voz", () => {
    expect(cortarTodo(silencio(10))).toEqual([]);
  });

  it("sin fin de frase, corta en la pausa corta más larga antes de los 8 s", () => {
    const sinFinDeFrase = unir(voz(3), silencio(0.13), voz(2), silencio(0.2), voz(4), silencio(1));
    const [primero] = cortarTodo(sinFinDeFrase);

    // La pausa de 0,2 s va de 5,13 a 5,33 s: se corta en la mitad.
    expect(primero?.fin).toBeCloseTo(5.23, 1);
  });

  it("sin ninguna pausa, corta en el máximo de 8 s", () => {
    const [primero] = cortarTodo(unir(voz(12), silencio(1)));

    expect(primero?.fin).toBeCloseTo(8, 1);
  });

  it("acorta los silencios internos largos a 0,2 s", () => {
    const conPausaLarga = unir(
      voz(1),
      silencio(0.25),
      voz(0.5),
      silencio(1.2),
      voz(1),
      silencio(2),
    );
    const cortador = crearCortador({ minimoSegundos: 4 });
    const fragmentos = [...cortador.agregar(conPausaLarga), ...cortador.terminar()];
    const [unico] = fragmentos;

    expect(fragmentos).toHaveLength(1);
    const duracionOriginal = (unico?.fin ?? 0) - (unico?.inicio ?? 0);
    expect((unico?.audio.length ?? 0) / FRECUENCIA).toBeCloseTo(duracionOriginal - 1.0, 1);
  });

  it("usa el mínimo nuevo desde el corte siguiente", () => {
    const cortador = crearCortador({ minimoSegundos: 4 });
    cortador.cambiarMinimo(1.5);
    const fragmentos = [...cortador.agregar(tresFrases), ...cortador.terminar()];

    expect(fragmentos).toHaveLength(3);
  });

  it("deja ver lo que se viene diciendo desde el último corte", () => {
    const cortador = crearCortador({ minimoSegundos: 1.5 });
    cortador.agregar(unir(silencio(0.5), voz(1)));

    const pendiente = cortador.pendiente();
    expect(pendiente.tieneVoz).toBe(true);
    expect(pendiente.audio.length / FRECUENCIA).toBeGreaterThan(1);
  });
});
