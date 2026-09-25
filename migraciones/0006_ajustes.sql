-- Los ajustes del administrador, uno por clave: "general" (las preferencias, en JSON) y "webhook"
-- (la dirección del canal de avisos, un secreto que nunca vuelve al navegador).
CREATE TABLE ajuste (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);
