// =====================================================================
// Tarea 4 - Big Data (202016911) - UNAD
// Script 03: Consultas con filtros, operadores y relaciones ($lookup)
// =====================================================================

use("internet_fijo_antioquia");

// ---------------------------------------------------------------------
// F1. Operadores de comparación ($gte) + lógico implícito (AND)
//     Accesos residenciales con velocidad de bajada >= 1 Gbps
// ---------------------------------------------------------------------
print("\n========== F1. Operadores de comparación ($gte) + lógico implícito (AND) ==========");
printjson(db.accesos.countDocuments({ segmento: "RESIDENCIAL", "velocidad.bajada_mbps": { $gte: 1000 } }));

// F2. Operador $in: estratos altos (5 y 6) con tecnología satelital
print("\n========== F2. Operador $in: estratos altos (5 y 6) con tecnología satelital ==========");
printjson(db.accesos.find(
  { estrato: { $in: [5, 6] }, "tecnologia.familia": "Satelital" },
  { _id: 0, "municipio.nombre": 1, proveedor: 1, estrato: 1, "velocidad.bajada_mbps": 1, accesos: 1 }
).limit(5).toArray());

// F3. Operador $or + $lt: accesos con muy baja velocidad (< 10 Mbps)
//     o con tecnología de cobre (xDSL), solo en el Valle de Aburrá
print("\n========== F3. Operador $or + $lt: accesos con muy baja velocidad (< 10 Mbps) ==========");
printjson(db.accesos.countDocuments({
  "municipio.nombre": { $in: ["MEDELLÍN", "BELLO", "ITAGUI", "ENVIGADO", "SABANETA",
                              "LA ESTRELLA", "CALDAS", "COPACABANA", "GIRARDOTA", "BARBOSA"] },
  $or: [
    { "velocidad.bajada_mbps": { $lt: 10 } },
    { "tecnologia.familia": "Cobre (xDSL)" }
  ]
}));

// F4. Operador $exists: documentos SIN estrato (segmentos no residenciales)
//     Demuestra el esquema flexible: el campo existe solo donde aplica
print("\n========== F4. Operador $exists: documentos SIN estrato (segmentos no residenciales) ==========");
printjson(db.accesos.countDocuments({ estrato: { $exists: false } }));

// F5. Operador $regex: proveedores satelitales / Starlink (insensible a mayúsculas)
print("\n========== F5. Operador $regex: proveedores satelitales / Starlink (insensible a mayúsculas) ==========");
printjson(db.accesos.distinct("proveedor", { proveedor: { $regex: "starlink|hughes|satel", $options: "i" } }));

// F6. Operadores sobre el catálogo de municipios: penetración menor al 20%
//     y población mayor a 50.000 habitantes, ordenados por penetración
//     (municipios grandes con brecha de conectividad fija)
print("\n========== F6. Operadores sobre el catálogo de municipios: penetración menor al 20% ==========");
printjson(db.municipios.find(
  { penetracion_pct: { $lt: 20 }, poblacion_dane: { $gt: 50000 } },
  { nombre: 1, poblacion_dane: 1, accesos_fijos: 1, penetracion_pct: 1 }
).sort({ penetracion_pct: 1 }).toArray());

// ---------------------------------------------------------------------
// J1. JOIN accesos -> municipios ($lookup)
//     Accesos con fibra óptica en estratos 1 y 2, enriquecidos con la
//     población y la penetración del municipio
// ---------------------------------------------------------------------
print("\n========== J1. JOIN accesos -> municipios ($lookup) ==========");
printjson(db.accesos.aggregate([
  { $match: { "tecnologia.familia": "Fibra óptica", estrato: { $in: [1, 2] } } },
  { $group: { _id: "$municipio.codigo_dane", accesos_fibra_e12: { $sum: "$accesos" } } },
  { $lookup: { from: "municipios", localField: "_id", foreignField: "_id", as: "mun" } },
  { $unwind: "$mun" },
  { $project: { _id: 0, municipio: "$mun.nombre", poblacion: "$mun.poblacion_dane",
                penetracion_pct: "$mun.penetracion_pct", accesos_fibra_e12: 1 } },
  { $sort: { accesos_fibra_e12: -1 } },
  { $limit: 10 }
]).toArray());

// J2. JOIN accesos -> proveedores ($lookup por nombre)
//     Top 10 proveedores en Antioquia comparados con su participación
//     nacional
print("\n========== J2. JOIN accesos -> proveedores ($lookup por nombre) ==========");
printjson(db.accesos.aggregate([
  { $group: { _id: "$proveedor", accesos_antioquia: { $sum: "$accesos" },
              municipios: { $addToSet: "$municipio.nombre" } } },
  { $lookup: { from: "proveedores", localField: "_id", foreignField: "nombre", as: "prov" } },
  { $unwind: "$prov" },
  { $project: { _id: 0, proveedor: "$_id", accesos_antioquia: 1,
                municipios_con_presencia: { $size: "$municipios" },
                accesos_nacionales: "$prov.accesos_nacionales",
                participacion_nacional_pct: "$prov.participacion_nacional_pct",
                pct_de_sus_accesos_en_antioquia: {
                  $round: [{ $multiply: [{ $divide: ["$accesos_antioquia", "$prov.accesos_nacionales"] }, 100] }, 2] } } },
  { $sort: { accesos_antioquia: -1 } },
  { $limit: 10 }
]).toArray());
