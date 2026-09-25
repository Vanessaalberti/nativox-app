-- Un evento por instancia (cada organizador despliega la suya) y una cuenta de administrador.
-- Los CHECK (id = 1) hacen que un segundo "Crear evento" falle aunque dos pedidos lleguen a la vez:
-- el primero que completa el asistente queda como dueño.

CREATE TABLE evento (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  nombre TEXT NOT NULL,
  -- 'todo-en-uno' (una cuenta administra y opera) o 'roles-separados' (operadores con código).
  tipo TEXT NOT NULL CHECK (tipo IN ('todo-en-uno', 'roles-separados')),
  -- Data URL de la imagen (chica): se guarda acá para no depender de otro servicio.
  logo TEXT,
  fecha_inicio TEXT,
  fecha_fin TEXT,
  -- Lo que el organizador estimó al crear el evento (alimenta el consumo estimado).
  salas_simultaneas INTEGER NOT NULL,
  horas_por_dia INTEGER NOT NULL,
  dias INTEGER NOT NULL,
  -- Workers AI como respaldo en las computadoras que no llegan en vivo; el modo principal es local.
  nube_como_respaldo INTEGER NOT NULL DEFAULT 0 CHECK (nube_como_respaldo IN (0, 1)),
  creado_en INTEGER NOT NULL
);

CREATE TABLE administrador (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  email TEXT NOT NULL,
  -- pbkdf2-sha256$iteraciones$sal$hash (ver servidor/modulos/cripto-acceso).
  contrasena_hash TEXT NOT NULL,
  -- SHA-256 del código de recuperación: el código en sí se muestra una sola vez.
  codigo_recuperacion_hash TEXT NOT NULL,
  creado_en INTEGER NOT NULL
);

-- Sesiones opacas: el navegador guarda un token al azar y acá solo queda su hash, así que una
-- copia de la base no sirve para entrar.
CREATE TABLE sesion (
  token_hash TEXT PRIMARY KEY,
  rol TEXT NOT NULL CHECK (rol IN ('administrador', 'operador')),
  cuenta_id INTEGER NOT NULL,
  creada_en INTEGER NOT NULL,
  vence_en INTEGER NOT NULL
);

CREATE INDEX sesion_vence_en ON sesion (vence_en);

-- Ingresos fallidos por email y por IP, para frenar los intentos en cadena.
CREATE TABLE intento_ingreso (
  clave TEXT NOT NULL,
  momento INTEGER NOT NULL
);

CREATE INDEX intento_ingreso_clave ON intento_ingreso (clave, momento);
