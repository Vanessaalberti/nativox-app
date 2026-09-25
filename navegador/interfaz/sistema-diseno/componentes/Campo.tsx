import { useId, useState, type ReactNode } from "react";

export interface PropiedadesCampo {
  etiqueta: string;
  valor: string;
  alCambiar: (valor: string) => void;
  tipo?: "text" | "email" | "password" | "date" | "number";
  placeholder?: string;
  autoComplete?: string;
  ayuda?: ReactNode;
  // Color del borde al enfocar: el verde es el de "crear evento".
  acento?: "naranja" | "verde";
  minimo?: number;
  maximo?: number;
  // Se ve pero no se cambia (un valor que sale de otro campo).
  soloLectura?: boolean;
}

const ENFOQUE = { naranja: "focus:border-naranja", verde: "focus:border-verde" } as const;

// Etiqueta + campo (+ ayuda). Las contraseñas traen su botón "Mostrar / Ocultar".
export function Campo({
  etiqueta,
  valor,
  alCambiar,
  tipo = "text",
  placeholder,
  autoComplete,
  ayuda,
  acento = "naranja",
  minimo,
  maximo,
  soloLectura = false,
}: PropiedadesCampo) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const esContrasena = tipo === "password";

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase"
      >
        {etiqueta}
      </label>
      <div className="relative">
        <input
          id={id}
          type={esContrasena && visible ? "text" : tipo}
          value={valor}
          onChange={(evento) => alCambiar(evento.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          min={minimo}
          max={maximo}
          readOnly={soloLectura}
          className={`w-full border-[1.5px] border-[#443d30] bg-canvas px-4 py-3 font-mono text-sm text-ink outline-none transition-colors ${ENFOQUE[acento]} ${esContrasena ? "pr-24" : ""} ${soloLectura ? "bg-ink/5 text-ink/70" : ""}`}
        />
        {esContrasena && (
          <button
            type="button"
            onClick={() => setVisible((actual) => !actual)}
            className="absolute top-1/2 right-3 -translate-y-1/2 font-mono text-[10px] tracking-widest text-ink/60 uppercase hover:text-ink"
          >
            {visible ? "Ocultar" : "Mostrar"}
          </button>
        )}
      </div>
      {ayuda !== undefined && <p className="mt-2 font-mono text-[11px] text-ink/60">{ayuda}</p>}
    </div>
  );
}
