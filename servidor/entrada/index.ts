import { responderSalud } from "@servidor/api/salud";
import { responderError } from "@servidor/plataforma/errores";

export { Sala } from "@servidor/objetos-durables/sala/sala";
export { Produccion } from "@servidor/objetos-durables/produccion/produccion";

export default {
  fetch(pedido) {
    const { pathname } = new URL(pedido.url);

    if (pathname === "/api/salud") {
      return responderSalud();
    }
    return responderError(404, "ruta_inexistente", `No existe la ruta ${pathname}`);
  },
} satisfies ExportedHandler<Env>;
