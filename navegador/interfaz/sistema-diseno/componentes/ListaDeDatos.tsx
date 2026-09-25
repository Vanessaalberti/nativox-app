// Pares "nombre → valor" en dos columnas: el resumen de un evento, lo que midió una evaluación.
export function ListaDeDatos({ filas }: { filas: readonly (readonly [string, string])[] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 font-mono text-xs">
      {filas.map(([nombre, valor]) => (
        <div key={nombre} className="contents">
          <dt className="text-ink/60">{nombre}</dt>
          <dd className="font-bold">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}
