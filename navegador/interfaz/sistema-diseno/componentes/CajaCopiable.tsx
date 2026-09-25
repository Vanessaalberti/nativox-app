import { useState } from "react";
import { Boton } from "./Boton";

type Copia = "nada" | "copiado" | "fallo";

// Un valor que se copia con un clic (un link, un código) y, si se pide, también se descarga en un
// .txt. Si el navegador no deja copiar, lo dice: el valor queda a la vista para copiarlo a mano.
export function CajaCopiable({
  valor,
  descarga,
  grande = false,
}: {
  valor: string;
  descarga?: { nombre: string; contenido: string };
  grande?: boolean;
}) {
  const [copia, setCopia] = useState<Copia>("nada");

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor);
      setCopia("copiado");
    } catch {
      setCopia("fallo");
    }
    setTimeout(() => setCopia("nada"), 2500);
  };

  const descargar = () => {
    if (!descarga) return;
    const enlace = document.createElement("a");
    const url = URL.createObjectURL(
      new Blob([descarga.contenido], { type: "text/plain;charset=utf-8" }),
    );
    enlace.href = url;
    enlace.download = descarga.nombre;
    enlace.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-3">
      <p
        className={`border-[1.5px] border-ink/25 bg-canvas px-4 py-3 font-mono font-bold break-all select-all ${grande ? "text-xl tracking-widest" : "text-sm"}`}
      >
        {valor}
      </p>
      <div className="flex flex-wrap gap-3">
        <Boton variante="secundario" onClick={() => void copiar()}>
          {copia === "copiado" ? "✓ Copiado" : copia === "fallo" ? "Copialo a mano" : "Copiar"}
        </Boton>
        {descarga && (
          <Boton variante="secundario" onClick={descargar}>
            Descargar (.txt)
          </Boton>
        )}
      </div>
    </div>
  );
}
