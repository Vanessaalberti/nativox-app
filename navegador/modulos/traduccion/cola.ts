export type Cola = <T>(tarea: () => Promise<T>) => Promise<T>;

// Una cola por traductor: las traducciones salen en el orden en que se pidieron (primero la línea
// nueva, después la corrección de la anterior) y un traductor lento no se pisa consigo mismo.
export function crearCola(): Cola {
  let ultima: Promise<unknown> = Promise.resolve();
  return <T>(tarea: () => Promise<T>) => {
    const esta = ultima.then(tarea, tarea);
    ultima = esta.catch(() => undefined);
    return esta;
  };
}
