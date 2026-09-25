import type { ReactNode } from "react";
import type { EstadoDeLaInstancia } from "@compartido/contratos";
import { useEstadoDeLaInstancia } from "../hooks/useEstadoDeLaInstancia";
import { PantallaDeCarga } from "./PantallaDeCarga";

// Pregunta el estado de la instancia y, mientras llega (o si falla), muestra la pantalla de carga.
export function ConEstadoDeLaInstancia({
  children,
}: {
  children: (estado: EstadoDeLaInstancia) => ReactNode;
}) {
  const { carga, recargar } = useEstadoDeLaInstancia();
  if (carga.fase !== "lista") {
    return <PantallaDeCarga carga={carga} alReintentar={() => void recargar()} />;
  }
  return children(carga.estado);
}
