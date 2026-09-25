-- La agenda de cada sala: las charlas con su horario y su glosario propio.
CREATE TABLE charla (
  id TEXT PRIMARY KEY,
  sala_id TEXT NOT NULL REFERENCES sala (id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  resumen TEXT NOT NULL DEFAULT '',
  oradores TEXT NOT NULL DEFAULT '',
  -- El día (AAAA-MM-DD) y el horario en minutos desde la medianoche, en la hora local del evento.
  fecha TEXT NOT NULL,
  inicio_min INTEGER NOT NULL CHECK (inicio_min >= 0 AND inicio_min < 1440),
  fin_min INTEGER NOT NULL CHECK (fin_min > inicio_min AND fin_min <= 1440),
  -- NULL: se habla el idioma original de la sala.
  idioma TEXT CHECK (idioma IS NULL OR idioma IN ('es', 'en', 'pt')),
  -- El glosario de esta charla, en el formato de `compartido/glosario` (un término por renglón).
  glosario TEXT NOT NULL DEFAULT '',
  creada_en INTEGER NOT NULL
);

CREATE INDEX charla_sala_fecha ON charla (sala_id, fecha, inicio_min);
