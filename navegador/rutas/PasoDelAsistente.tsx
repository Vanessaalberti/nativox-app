import { GuardaDeAdministrador } from "@navegador/funcionalidades/acceso";
import { CrearCuenta, DatosDelEvento, ElegirTipo } from "@navegador/funcionalidades/crear-evento";

// /crear-evento · /crear-evento/cuenta · /crear-evento/evento: los tres pasos del asistente. El
// último necesita la sesión del administrador y que el evento todavía no exista.
export const PasoTipo = () => <ElegirTipo />;
export const PasoCuenta = () => <CrearCuenta />;
export function PasoEvento() {
  return (
    <GuardaDeAdministrador evento="sin">
      <DatosDelEvento />
    </GuardaDeAdministrador>
  );
}
