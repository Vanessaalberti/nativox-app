import { DurableObject } from "cloudflare:workers";

// Reservado: el binding PRODUCCION y la migración "v1" existen desde el primer deploy y quitarlos
// exige una migración nueva. Las salidas de producción hoy se guardan en D1 (`almacen-produccion`).
export class Produccion extends DurableObject<Env> {}
