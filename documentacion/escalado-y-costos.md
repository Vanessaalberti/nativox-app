# Escalado y costos

*(Se completa con los números verificados del documento de decisiones → "Dimensionamiento y costos a escala".)*

- **Local (por defecto):** una computadora por sala; $0 de IA. El costo no crece con las salas.
- **Espectadores:** no suman costo de IA. Cada sala genera sus subtítulos **una vez** (en sus 2–3 idiomas) y el Durable Object los reenvía a todos; el espectador solo recibe texto.
- **Varias salas en una computadora:** un solo modelo compartido; capacidad ≈ largo de frase ÷ tiempo de una pasada (a medir). Las que no entran pasan a Workers AI.
- **Nube (opcional):** Whisper turbo en Workers AI, ~$0,037 por hora de sala; límite de 720 pedidos por minuto ≈ 60 salas por cuenta.
- **Reparto:** Durable Objects con WebSocket Hibernation; los mensajes salientes no se cobran.
- **Base:** D1; los eventos grandes necesitan Workers Paid por las escrituras.

Fuente: `Vibeathon Nerdearla 2026 — Transcripción en vivo.md`.
