import { DurableObject } from "cloudflare:workers";

// Se declara desde el esqueleto para que el binding SALA y la migración "v1" existan desde el
// primer despliegue. El reparto por WebSocket llega en el paso 5 del plan de construcción.
export class Sala extends DurableObject<Env> {}
