// =====================================================================
// Tarea 4 - Big Data (202016911) - UNAD
// Script 02: Consultas básicas (CRUD) - inserción, selección,
//            actualización y eliminación
// Sugerencia: ejecute cada bloque por separado en el _MONGOSH de Compass
// y tome un pantallazo del código y del resultado.
// =====================================================================

use("internet_fijo_antioquia");
// Se quita la marca de U2 por si ya se ejecutó antes (para que U2 muestre 68)
db.accesos.updateMany({}, { $unset: { velocidad_atipica: "" } });
db.accesos.deleteMany({ origen: "registro de prueba" });
db.proveedores.deleteMany({ nombre: "UNAD CONECTA S.A.S. (PRUEBA)" });

// ---------------------------------------------------------------------
// C1. INSERCIÓN de un documento (insertOne)
//     Registro de prueba: un nuevo ISP rural en el municipio de Jardín
// ---------------------------------------------------------------------
print("\n========== C1. INSERCIÓN de un documento (insertOne) ==========");
printjson(db.accesos.insertOne({
  periodo: { anno: 2026, trimestre: 2 },
  municipio: { codigo_dane: 5364, nombre: "JARDÍN" },
  proveedor: "UNAD CONECTA S.A.S. (PRUEBA)",
  segmento: "RESIDENCIAL",
  estrato: 2,
  tecnologia: { nombre: "FIBER TO THE HOME (FTTH)", familia: "Fibra óptica" },
  velocidad: { bajada_mbps: 300, subida_mbps: 150 },
  accesos: 45,
  origen: "registro de prueba"          // campo que solo tienen los de prueba
}));

// ---------------------------------------------------------------------
// C2. INSERCIÓN de varios documentos (insertMany)
//     Observe que el documento corporativo NO tiene campo "estrato"
// ---------------------------------------------------------------------
print("\n========== C2. INSERCIÓN de varios documentos (insertMany) ==========");
printjson(db.accesos.insertMany([
  {
    periodo: { anno: 2026, trimestre: 2 },
    municipio: { codigo_dane: 5364, nombre: "JARDÍN" },
    proveedor: "UNAD CONECTA S.A.S. (PRUEBA)",
    segmento: "RESIDENCIAL", estrato: 3,
    tecnologia: { nombre: "FIBER TO THE HOME (FTTH)", familia: "Fibra óptica" },
    velocidad: { bajada_mbps: 500, subida_mbps: 250 },
    accesos: 20, origen: "registro de prueba"
  },
  {
    periodo: { anno: 2026, trimestre: 2 },
    municipio: { codigo_dane: 5364, nombre: "JARDÍN" },
    proveedor: "UNAD CONECTA S.A.S. (PRUEBA)",
    segmento: "CORPORATIVO",
    tecnologia: { nombre: "OTRAS TECNOLOGÍAS INALÁMBRICAS", familia: "Inalámbrica" },
    velocidad: { bajada_mbps: 100, subida_mbps: 100 },
    accesos: 3, origen: "registro de prueba",
    contacto_soporte: { telefono: "604 000 0000", sla_horas: 4 }   // campo extra
  }
]));

// Se registra también el proveedor en su colección
print("\n========== C2. INSERCIÓN de varios documentos (insertMany) ==========");
printjson(db.proveedores.insertOne({
  nombre: "UNAD CONECTA S.A.S. (PRUEBA)",
  accesos_nacionales: 68,
  participacion_nacional_pct: 0.0006,
  periodo: { anno: 2026, trimestre: 2 }
}));

// ---------------------------------------------------------------------
// R1. SELECCIÓN: buscar los documentos de prueba insertados
// ---------------------------------------------------------------------
print("\n========== R1. SELECCIÓN: buscar los documentos de prueba insertados ==========");
printjson(db.accesos.find({ origen: "registro de prueba" }).toArray());

// R2. SELECCIÓN con proyección: solo algunos campos de Medellín,
//     ordenado por número de accesos (descendente), los 5 primeros
print("\n========== R2. SELECCIÓN con proyección: solo algunos campos de Medellín ==========");
printjson(db.accesos.find(
  { "municipio.nombre": "MEDELLÍN" },
  { _id: 0, proveedor: 1, segmento: 1, estrato: 1, "tecnologia.nombre": 1,
    "velocidad.bajada_mbps": 1, accesos: 1 }
).sort({ accesos: -1 }).limit(5).toArray());

// R3. SELECCIÓN de un documento del catálogo de municipios por su _id (DANE)
print("\n========== R3. SELECCIÓN de un documento del catálogo de municipios por su _id (DANE) ==========");
printjson(db.municipios.findOne({ _id: 5001 }));

// ---------------------------------------------------------------------
// U1. ACTUALIZACIÓN de un documento (updateOne con $set e $inc)
//     El ISP de prueba sube la velocidad y suma 5 accesos nuevos
// ---------------------------------------------------------------------
print("\n========== U1. ACTUALIZACIÓN de un documento (updateOne con $set e $inc) ==========");
printjson(db.accesos.updateOne(
  { proveedor: "UNAD CONECTA S.A.S. (PRUEBA)", estrato: 2 },
  { $set: { "velocidad.bajada_mbps": 600, "velocidad.subida_mbps": 300 },
    $inc: { accesos: 5 } }
));
print("\n========== U1. ACTUALIZACIÓN de un documento (updateOne con $set e $inc) ==========");
printjson(db.accesos.find({ proveedor: "UNAD CONECTA S.A.S. (PRUEBA)", estrato: 2 }).toArray());

// U2. ACTUALIZACIÓN de varios documentos (updateMany)
//     Marcar como "velocidad_atipica" los registros con más de 10.000 Mbps
//     de bajada (valores fuera de lo técnicamente esperable en un acceso
//     fijo; MinTIC también advierte sobre valores atípicos)
print("\n========== U2. ACTUALIZACIÓN de varios documentos (updateMany) ==========");
printjson(db.accesos.updateMany(
  { "velocidad.bajada_mbps": { $gt: 10000 } },
  { $set: { velocidad_atipica: true } }
));
print("\n========== U2. ACTUALIZACIÓN de varios documentos (updateMany) ==========");
printjson(db.accesos.countDocuments({ velocidad_atipica: true }));

// ---------------------------------------------------------------------
// D1. ELIMINACIÓN de un documento (deleteOne)
// ---------------------------------------------------------------------
print("\n========== D1. ELIMINACIÓN de un documento (deleteOne) ==========");
printjson(db.accesos.deleteOne({ proveedor: "UNAD CONECTA S.A.S. (PRUEBA)", segmento: "CORPORATIVO" }));

// D2. ELIMINACIÓN de varios documentos (deleteMany)
//     Se borran los registros de prueba restantes y el proveedor de prueba
print("\n========== D2. ELIMINACIÓN de varios documentos (deleteMany) ==========");
printjson(db.accesos.deleteMany({ origen: "registro de prueba" }));
print("\n========== D2. ELIMINACIÓN de varios documentos (deleteMany) ==========");
printjson(db.proveedores.deleteOne({ nombre: "UNAD CONECTA S.A.S. (PRUEBA)" }));

// Verificación: ya no debe quedar ninguno
print("\n========== D2. ELIMINACIÓN de varios documentos (deleteMany) ==========");
printjson(db.accesos.countDocuments({ origen: "registro de prueba" }));
