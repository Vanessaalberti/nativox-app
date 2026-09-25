-- El equipo que opera las salas cuando el evento tiene roles separados. Cada persona entra con un
-- código de invitación; en la base queda solo su hash (el código se muestra una sola vez).
CREATE TABLE operador (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  codigo_hash TEXT NOT NULL UNIQUE,
  -- NULL hasta que la persona entra por primera vez: así se distingue "Invitado" de "Activo".
  ultimo_ingreso INTEGER,
  creado_en INTEGER NOT NULL
);

-- Las salas que puede ver y operar cada persona.
CREATE TABLE sala_operador (
  operador_id INTEGER NOT NULL REFERENCES operador (id) ON DELETE CASCADE,
  sala_id TEXT NOT NULL REFERENCES sala (id) ON DELETE CASCADE,
  PRIMARY KEY (operador_id, sala_id)
);

CREATE INDEX sala_operador_sala ON sala_operador (sala_id);
