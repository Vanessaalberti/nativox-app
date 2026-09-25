import { Link } from "react-router";

// La marca de la barra de arriba: los cuatro cuadros naranjas y "NATIVOX", que llevan al inicio.
export function MarcaDeNativox() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Nativox">
      <span className="grid size-5 grid-cols-2 gap-[2px]" aria-hidden>
        {[0, 1, 2, 3].map((cuadro) => (
          <span key={cuadro} className="size-[9px] bg-naranja" />
        ))}
      </span>
      <span className="font-display text-2xl leading-none font-bold tracking-wider">NATIVOX</span>
    </Link>
  );
}

// "Open source · tu propia instancia", con los dos cuadros de color.
export function SelloOpenSource() {
  return (
    <span className="flex items-center gap-3">
      <span className="flex flex-col gap-[2px]" aria-hidden>
        <span className="size-3.5 bg-naranja" />
        <span className="size-3.5 bg-verde" />
      </span>
      <span className="text-[9px] leading-tight tracking-wider text-ink/70 uppercase">
        <span className="block">Open source</span>
        <span className="block">Tu propia instancia</span>
      </span>
    </span>
  );
}
