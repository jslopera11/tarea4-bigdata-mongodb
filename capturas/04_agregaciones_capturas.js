// =====================================================================
// Tarea 4 - Big Data (202016911) - UNAD
// Script 04: Consultas de agregación (contar, sumar, promediar, máx/mín)
// =====================================================================

use("internet_fijo_antioquia");

// ---------------------------------------------------------------------
// A1. CONTAR: número de documentos por colección
// ---------------------------------------------------------------------
print("\n========== A1. CONTAR: número de documentos por colección ==========");
printjson(db.accesos.countDocuments());
print("\n========== A1. CONTAR: número de documentos por colección ==========");
printjson(db.municipios.countDocuments());
print("\n========== A1. CONTAR: número de documentos por colección ==========");
printjson(db.proveedores.countDocuments());

// A2. CONTAR + SUMAR: total de accesos y número de registros por segmento
print("\n========== A2. CONTAR + SUMAR: total de accesos y número de registros por segmento ==========");
printjson(db.accesos.aggregate([
  { $group: { _id: "$segmento", registros: { $count: {} }, total_accesos: { $sum: "$accesos" } } },
  { $sort: { total_accesos: -1 } }
]).toArray());

// A3. SUMAR + porcentaje: accesos por familia tecnológica y su participación
print("\n========== A3. SUMAR + porcentaje: accesos por familia tecnológica y su participación ==========");
printjson(db.accesos.aggregate([
  { $group: { _id: "$tecnologia.familia", total_accesos: { $sum: "$accesos" } } },
  { $group: { _id: null, total: { $sum: "$total_accesos" },
              familias: { $push: { familia: "$_id", accesos: "$total_accesos" } } } },
  { $unwind: "$familias" },
  { $project: { _id: 0, familia: "$familias.familia", accesos: "$familias.accesos",
                participacion_pct: { $round: [{ $multiply: [{ $divide: ["$familias.accesos", "$total"] }, 100] }, 2] } } },
  { $sort: { accesos: -1 } }
]).toArray());

// A4. PROMEDIAR: velocidad promedio de bajada por estrato (residencial),
//     PONDERADA por número de accesos, excluyendo velocidades atípicas
print("\n========== A4. PROMEDIAR: velocidad promedio de bajada por estrato (residencial) ==========");
printjson(db.accesos.aggregate([
  { $match: { segmento: "RESIDENCIAL", velocidad_atipica: { $ne: true } } },
  { $group: {
      _id: "$estrato",
      accesos: { $sum: "$accesos" },
      suma_ponderada: { $sum: { $multiply: ["$velocidad.bajada_mbps", "$accesos"] } },
      promedio_simple_mbps: { $avg: "$velocidad.bajada_mbps" }
  } },
  { $project: { _id: 0, estrato: "$_id", accesos: 1,
                vel_promedio_ponderada_mbps: { $round: [{ $divide: ["$suma_ponderada", "$accesos"] }, 1] },
                promedio_simple_mbps: { $round: ["$promedio_simple_mbps", 1] } } },
  { $sort: { estrato: 1 } }
]).toArray());

// A5. PROMEDIO / MÁXIMO / MÍNIMO: penetración de Internet fijo en los
//     125 municipios del departamento
print("\n========== A5. PROMEDIO / MÁXIMO / MÍNIMO: penetración de Internet fijo en los ==========");
printjson(db.municipios.aggregate([
  { $group: { _id: "$departamento.nombre",
              municipios: { $count: {} },
              poblacion_total: { $sum: "$poblacion_dane" },
              accesos_total: { $sum: "$accesos_fijos" },
              penetracion_promedio_pct: { $avg: "$penetracion_pct" },
              penetracion_max_pct: { $max: "$penetracion_pct" },
              penetracion_min_pct: { $min: "$penetracion_pct" } } },
  { $set: { penetracion_promedio_pct: { $round: ["$penetracion_promedio_pct", 2] },
            penetracion_departamental_pct: { $round: [{ $multiply: [{ $divide: ["$accesos_total", "$poblacion_total"] }, 100] }, 2] } } }
]).toArray());

// A6. TOP 10 municipios por número de accesos y cantidad de proveedores
print("\n========== A6. TOP 10 municipios por número de accesos y cantidad de proveedores ==========");
printjson(db.accesos.aggregate([
  { $group: { _id: "$municipio.nombre", total_accesos: { $sum: "$accesos" },
              proveedores: { $addToSet: "$proveedor" } } },
  { $project: { _id: 0, municipio: "$_id", total_accesos: 1, num_proveedores: { $size: "$proveedores" } } },
  { $sort: { total_accesos: -1 } },
  { $limit: 10 }
]).toArray());

// A7. $bucket: distribución de accesos por rangos de velocidad de bajada
print("\n========== A7. $bucket: distribución de accesos por rangos de velocidad de bajada ==========");
printjson(db.accesos.aggregate([
  { $match: { velocidad_atipica: { $ne: true } } },
  { $bucket: {
      groupBy: "$velocidad.bajada_mbps",
      boundaries: [0, 25, 100, 300, 600, 1000, 10001],
      default: "otros",
      output: { registros: { $count: {} }, accesos: { $sum: "$accesos" } }
  } }
]).toArray());

// A8. Brecha digital: municipios con MENOR penetración (5 más bajos)
print("\n========== A8. Brecha digital: municipios con MENOR penetración (5 más bajos) ==========");
printjson(db.municipios.find({}, { _id: 0, nombre: 1, poblacion_dane: 1, accesos_fijos: 1, penetracion_pct: 1 })
  .sort({ penetracion_pct: 1 }).limit(5).toArray());
