# Tarea 4 – Almacenamiento y consulta de datos en Big Data (MongoDB)

**Curso:** Big Data (202016911) – UNAD, ECBTI · Grupo 28
**Autor:** Johan Sebastian Lopera Morales
**Caso de uso:** almacenamiento y análisis de los accesos fijos a Internet en los 125 municipios de Antioquia (MinTIC, 2026 – trimestre 2).

## Contenido

| Carpeta / archivo | Descripción |
| --- | --- |
| `datos/accesos_internet_fijo_antioquia_2026T2.csv` | 31.006 registros de accesos por proveedor, municipio, segmento, tecnología y velocidad |
| `datos/municipios_antioquia_2026T2.csv` | 125 municipios con población DANE y penetración |
| `datos/proveedores_internet_fijo_2026T2.csv` | 1.412 proveedores con su participación nacional |
| `scripts/01_modelado.js` | Construye las colecciones `municipios`, `proveedores` y `accesos` desde los CSV importados y crea los índices |
| `scripts/02_crud.js` | Inserción, selección, actualización y eliminación |
| `scripts/03_filtros_join.js` | Filtros con operadores (`$gte`, `$in`, `$or`, `$lt`, `$exists`, `$regex`) y joins con `$lookup` |
| `scripts/04_agregaciones.js` | Contar, sumar, promediar, máximo/mínimo, top 10 y `$bucket` |
| `capturas/*_capturas.js` | Las mismas consultas, imprimiendo el resultado de cada una (para ejecutar el script completo en mongosh) |

## Fuente de los datos

Portal de Datos Abiertos de Colombia – Ministerio de Tecnologías de la Información y las Comunicaciones:

- Accesos fijos a Internet por proveedor, departamento, municipio, tecnología, segmento y ancho de banda: https://www.datos.gov.co/d/hwrp-3su3
- Accesos fijos a Internet por departamento, municipio y población: https://www.datos.gov.co/d/tvzi-ba2g
- Accesos fijos a Internet por proveedor: https://www.datos.gov.co/d/98dx-ah33

## Cómo ejecutarlo

1. MongoDB Community Server + MongoDB Compass; conexión `mongodb://localhost:27017`.
2. Crear la base `internet_fijo_antioquia` e importar cada CSV en su colección: `raw_accesos`, `raw_municipios`, `raw_proveedores` (Compass → *ADD DATA* → *Import JSON or CSV file*).
3. En el shell `_MONGOSH` de Compass ejecutar `scripts/01_modelado.js`, y luego los scripts 02, 03 y 04 (o sus versiones en `capturas/`).

## Esquema

- **accesos** (31.006): `periodo {anno, trimestre}`, `municipio {codigo_dane, nombre}`, `proveedor`, `segmento`, `estrato` (solo residencial), `tecnologia {nombre, familia}`, `velocidad {bajada_mbps, subida_mbps}`, `accesos`, `velocidad_atipica` (opcional).
- **municipios** (125): `_id` = código DANE, `nombre`, `departamento`, `poblacion_dane`, `accesos_fijos`, `penetracion_pct`.
- **proveedores** (1.412): `nombre` (índice único), `accesos_nacionales`, `participacion_nacional_pct`.
- Relaciones: `accesos.municipio.codigo_dane → municipios._id` y `accesos.proveedor → proveedores.nombre` (`$lookup`).
