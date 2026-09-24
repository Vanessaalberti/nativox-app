import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const raiz = document.getElementById("raiz");
if (!raiz) {
  throw new Error("Falta el elemento #raiz en index.html");
}

createRoot(raiz).render(
  <StrictMode>
    <main>
      <h1>Nativox</h1>
      <p>Transcripción y traducción en vivo para conferencias.</p>
    </main>
  </StrictMode>,
);
