# Integración continua

| Archivo | Cuándo | Qué hace |
| --- | --- | --- |
| `ci.yml` | Cada PR y cada push a `main` | Instala · lint (incluye límites de import) · tipos · pruebas · código muerto (`knip`) · duplicación (`jscpd`) · construcción. *Falta sumar secretos (`gitleaks`)* |
| `calidad.yml` | Cada PR que toque transcripción, traducción, glosario o audio | Corre las `muestras/`: WER y términos del glosario. Falla si empeora más que el umbral |
| `punta-a-punta.yml` | Cada PR a `main` | Playwright: crear evento → sala → transcribir un audio de `muestras/` → la audiencia recibe los subtítulos |
