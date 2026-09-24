import { distanciaEdicion } from "@compartido/distancia-edicion";
import { palabrasParaMedir } from "./texto";

// WER = (reemplazos + borrados + inserciones) / palabras de la referencia. Puede pasar de 1 si
// la hipótesis agrega mucho (una alucinación larga).
export function calcularWer(referencia: string, hipotesis: string): number {
  const esperadas = palabrasParaMedir(referencia);
  const obtenidas = palabrasParaMedir(hipotesis);

  if (esperadas.length === 0) {
    return obtenidas.length === 0 ? 0 : 1;
  }
  return distanciaEdicion(esperadas, obtenidas) / esperadas.length;
}
