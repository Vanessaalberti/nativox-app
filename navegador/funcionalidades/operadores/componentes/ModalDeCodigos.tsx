import { Aviso, Boton, CajaCopiable, Modal } from "@navegador/interfaz/sistema-diseno";

// Los códigos de invitación recién creados. El servidor guarda solo su hash: esta es la única
// vez que se ven, así que se ofrece copiarlos todos o descargarlos.
export function ModalDeCodigos({
  codigos,
  alCerrar,
}: {
  codigos: readonly { nombre: string; codigo: string }[];
  alCerrar: () => void;
}) {
  const texto = codigos.map(({ nombre, codigo }) => `${nombre}: ${codigo}`).join("\n");

  return (
    <Modal
      etiqueta="Equipo"
      titulo={codigos.length === 1 ? "Su código de invitación" : "Códigos de invitación"}
      alCerrar={alCerrar}
    >
      <div className="flex flex-col gap-5">
        <Aviso>
          Mandale a cada persona su código por WhatsApp, Slack o donde use tu equipo. Se muestra{" "}
          <strong>una sola vez</strong>: si se pierde, generás uno nuevo (y el anterior deja de
          servir).
        </Aviso>
        <ul className="flex flex-col gap-4">
          {codigos.map(({ nombre, codigo }) => (
            <li key={codigo}>
              <p className="mb-1 font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
                {nombre}
              </p>
              <CajaCopiable valor={codigo} />
            </li>
          ))}
        </ul>
        {codigos.length > 1 && (
          <CajaCopiable
            valor={texto}
            descarga={{
              nombre: "nativox-codigos-de-operadores.txt",
              contenido: `NATIVOX — códigos de invitación de operadores\n\n${texto}\n\nCada código se muestra una sola vez. Compartilos por un canal privado.\n`,
            }}
          />
        )}
        <div className="flex justify-end">
          <Boton onClick={alCerrar}>Listo, ya los copié</Boton>
        </div>
      </div>
    </Modal>
  );
}
