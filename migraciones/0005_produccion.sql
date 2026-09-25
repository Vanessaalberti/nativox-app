-- Producción: el estilo de los subtítulos de cada sala (para su link de vMix/OBS) y las salidas,
-- cada una con un link fijo que muestra la sala que esté al aire.
ALTER TABLE sala ADD COLUMN estilo TEXT;

CREATE TABLE salida (
  numero INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  -- La sala que sale por esta salida; NULL = sin subtítulos. Si se borra la sala, la salida queda libre.
  sala_al_aire TEXT REFERENCES sala (id) ON DELETE SET NULL,
  estilo TEXT NOT NULL,
  creada_en INTEGER NOT NULL
);
