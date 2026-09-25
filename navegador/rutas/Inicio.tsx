import { Arranque } from "@navegador/funcionalidades/acceso";
import { Bienvenida } from "@navegador/funcionalidades/crear-evento";

// / — según lo que falte en la instancia: la bienvenida, seguir el asistente o entrar.
export function Inicio() {
  return <Arranque bienvenida={<Bienvenida />} />;
}
