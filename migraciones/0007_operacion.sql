-- Operación de las salas: lo que se transcribió de cada charla, los links de acción de un solo uso
-- de los avisos y el registro de qué sala estuvo al aire en cada salida.

-- Cada frase confirmada de una sala. Si había una charla en curso, queda asociada a ella; si se
-- borra la charla, se borra su transcripción.
CREATE TABLE segmento (
  sala_id TEXT NOT NULL REFERENCES sala (id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  charla_id TEXT REFERENCES charla (id) ON DELETE CASCADE,
  original TEXT NOT NULL,
  -- Las traducciones de la sala, en JSON ({"en":"...","pt":"..."}).
  traducciones TEXT NOT NULL,
  -- Segundos desde que arrancó la sesión, para exportar con marcas de tiempo.
  inicio REAL NOT NULL,
  fin REAL NOT NULL,
  creado_en INTEGER NOT NULL,
  PRIMARY KEY (sala_id, id)
);

CREATE INDEX segmento_charla ON segmento (charla_id, creado_en);

-- Los botones de los avisos: solo se guarda el hash del token; se usan una vez y vencen a los 15 minutos.
CREATE TABLE accion_token (
  token_hash TEXT PRIMARY KEY,
  sala_id TEXT NOT NULL REFERENCES sala (id) ON DELETE CASCADE,
  accion TEXT NOT NULL CHECK (accion IN ('reiniciar', 'pasar-a-la-nube', 'silenciar-avisos')),
  vence_en INTEGER NOT NULL,
  usado_en INTEGER
);

-- Qué sala salió por cada salida de producción y desde cuándo (NULL = sin subtítulos).
CREATE TABLE registro_aire (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  salida INTEGER NOT NULL,
  sala_id TEXT,
  desde INTEGER NOT NULL
);
