import { DurableObject } from "cloudflare:workers";

// Se declara desde el esqueleto para que el binding PRODUCCION y la migración "v1" existan desde
// el primer despliegue. Las salidas de producción llegan en el paso 7 del plan de construcción.
export class Produccion extends DurableObject<Env> {}
