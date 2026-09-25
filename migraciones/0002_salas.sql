-- Las salas del evento. Cada una traduce desde un idioma original a uno o dos idiomas destino.
CREATE TABLE sala (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  idioma_original TEXT NOT NULL CHECK (idioma_original IN ('es', 'en', 'pt')),
  -- Idiomas a los que se traduce, separados por coma ("en,pt"); vacío si solo se transcribe.
  idiomas_destino TEXT NOT NULL DEFAULT '',
  -- El orden en que se muestran (el de creación).
  posicion INTEGER NOT NULL,
  creada_en INTEGER NOT NULL
);

CREATE INDEX sala_posicion ON sala (posicion);
