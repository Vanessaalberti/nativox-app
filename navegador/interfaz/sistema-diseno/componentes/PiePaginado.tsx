const boton =
  "font-mono text-xs font-bold tracking-widest text-ink/50 uppercase transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-30";

// El pie de una tabla paginada: "← Anterior · Página 2 de 5 · Siguiente →". No se ve si hay una
// sola página.
export function PiePaginado({
  pagina,
  totalDePaginas,
  alCambiar,
}: {
  // Empieza en 0.
  pagina: number;
  totalDePaginas: number;
  alCambiar: (pagina: number) => void;
}) {
  if (totalDePaginas <= 1) return null;
  return (
    <div className="flex shrink-0 items-center justify-between border-t border-[#443d30]/20 px-5 py-3">
      <button
        type="button"
        disabled={pagina === 0}
        onClick={() => alCambiar(pagina - 1)}
        className={boton}
      >
        ← Anterior
      </button>
      <span className="font-mono text-xs text-ink/50">
        Página {pagina + 1} de {totalDePaginas}
      </span>
      <button
        type="button"
        disabled={pagina >= totalDePaginas - 1}
        onClick={() => alCambiar(pagina + 1)}
        className={boton}
      >
        Siguiente →
      </button>
    </div>
  );
}
