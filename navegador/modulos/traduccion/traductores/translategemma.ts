import type { Resultado } from "@compartido/contratos";
import type { Traductor } from "../tipos";

// Lo que este traductor necesita de quien carga el modelo (`modelos-compartidos`): recibe el
// servicio por parámetro porque un módulo no importa a otro.
export interface ServicioGemma {
  traducir(pedido: { texto: string; de: string; a: string }): Promise<Resultado<{ texto: string }>>;
}

// TranslateGemma 4B: traducción de calidad alta (normaliza números y traduce modismos por el
// sentido), pero pesa ~2 a 3 GB y tarda ~2 a 3 s por idioma en una placa modesta. Borra el HTML,
// así que respeta la marca `codigo`: el glosario protegido le llega entre comillas invertidas.
export function crearTranslateGemma(servicio: ServicioGemma): Traductor {
  return {
    nombre: "TranslateGemma 4B",
    marca: "codigo",
    nivel: "calidad",
    async traducir(texto, de, a) {
      const resultado = await servicio.traducir({ texto, de, a });
      return resultado.ok ? { ok: true, valor: resultado.valor.texto } : resultado;
    },
  };
}
