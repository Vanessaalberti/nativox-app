import { Link } from "react-router";

// / — provisoria hasta el paso 9 (crear evento): por ahora lleva a una sala de prueba.
export function Inicio() {
  return (
    <main className="grilla-fondo flex min-h-screen flex-col justify-center gap-6 px-5 md:px-[72px]">
      <h1 className="font-display text-7xl leading-[0.9] tracking-tight uppercase">Nativox</h1>
      <p className="max-w-xl text-lg">
        Transcripción y traducción en vivo para conferencias, en tu navegador.
      </p>
      <Link
        to="/sala/prueba/control"
        className="self-start rounded-sm bg-naranja px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-ink hover:bg-ink hover:text-canvas"
      >
        Abrir una sala de prueba →
      </Link>
    </main>
  );
}
