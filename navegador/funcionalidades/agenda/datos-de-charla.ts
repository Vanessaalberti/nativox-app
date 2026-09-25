import type { Charla, DatosDeCharla } from "@compartido/contratos";

// Lo editable de una charla, para mandarlo de vuelta al guardar un cambio.
export const aDatos = (charla: Charla): DatosDeCharla => ({
  titulo: charla.titulo,
  resumen: charla.resumen,
  oradores: charla.oradores,
  fecha: charla.fecha,
  inicioMin: charla.inicioMin,
  finMin: charla.finMin,
  idioma: charla.idioma,
  glosario: charla.glosario,
});
