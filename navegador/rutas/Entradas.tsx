import {
  EntradaAdministrador,
  EntradaOperador,
  EntradaPorRol,
  SinAcceso,
} from "@navegador/funcionalidades/acceso";

// /entrada · /entrada/admin · /entrada/operador · /sin-acceso: cómo entra cada persona.
export const EntradaRol = () => <EntradaPorRol />;
export const EntradaAdmin = () => <EntradaAdministrador />;
export const EntradaOperadorCodigo = () => <EntradaOperador />;
export const PaginaSinAcceso = () => <SinAcceso />;
