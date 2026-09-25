# Escalado y costos

*(Se completa con los números verificados del documento de decisiones → "Dimensionamiento y costos a escala".)*

- **Local (por defecto):** $0 de IA; el costo no crece con las salas. Una computadora puede atender una o varias salas según su potencia.
- **Espectadores:** no suman costo de IA. Cada sala genera sus subtítulos **una vez** (en sus 2–3 idiomas) y el Durable Object los reenvía a todos; el espectador solo recibe texto.
- **Varias salas en una computadora:** un solo modelo compartido; capacidad ≈ largo de frase (~6 s) ÷ tiempo de una pasada (estimación: la pasada real la da "Evaluar esta computadora"). Las que no entran se pasan a Workers AI eligiéndolo en la pantalla de control de esa sala; el pase automático está previsto pero todavía no.
- **Nube (opcional):** Whisper turbo en Workers AI, ~$0,037 por hora de sala (gasto = horas de sala × $0,037, menos la cuota gratis diaria); frases de 4 a 8 s, un pedido por frase; límite de 720 pedidos por minuto ≈ 60 salas por cuenta. El administrador la activa en Ajustes → Consumo.
- **Reparto:** Durable Objects con WebSocket Hibernation; los mensajes salientes no se cobran.
- **Base:** D1; los eventos grandes necesitan Workers Paid por las escrituras.

Fuente: `Vibeathon Nerdearla 2026 — Transcripción en vivo.md`.
