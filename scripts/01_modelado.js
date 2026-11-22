// =====================================================================
// Tarea 4 - Big Data (202016911) - UNAD
// Caso de uso: Accesos fijos a Internet en Antioquia (MinTIC, 2026-2T)
// Script 01: Construcción del modelo documental a partir de los CSV
// Autor: Johan Sebastian Lopera Morales
//
// Requisito previo: haber importado desde Compass los 3 CSV en la base
// "internet_fijo_antioquia" con estos nombres de colección:
//   raw_accesos      <- accesos_internet_fijo_antioquia_2026T2.csv
//   raw_municipios   <- municipios_antioquia_2026T2.csv
//   raw_proveedores  <- proveedores_internet_fijo_2026T2.csv
// Ejecutar en la pestaña "_MONGOSH" de Compass (o con: mongosh 01_modelado.js)
// =====================================================================

use("internet_fijo_antioquia");

// ---------------------------------------------------------------------
// 1. Colección MUNICIPIOS (catálogo de referencia, _id = código DANE)
// ---------------------------------------------------------------------
db.municipios.drop();
db.raw_municipios.aggregate([
  {
    $project: {
      _id: { $toInt: "$codigo_dane_municipio" },
      nombre: "$municipio",
      departamento: {
        codigo_dane: { $toInt: "$codigo_dane_departamento" },
        nombre: "$departamento"
      },
      poblacion_dane: { $toInt: "$poblacion_dane" },
      accesos_fijos: { $toInt: "$accesos_fijos_internet" },
      penetracion_pct: { $round: [{ $toDouble: "$penetracion" }, 2] },
      periodo: { anno: { $toInt: "$anno" }, trimestre: { $toInt: "$trimestre" } }
    }
  },
  { $out: "municipios" }
]);

// ---------------------------------------------------------------------
// 2. Colección PROVEEDORES (participación nacional de cada operador)
// ---------------------------------------------------------------------
db.proveedores.drop();
db.raw_proveedores.aggregate([
  {
    $project: {
      _id: 0,
      nombre: "$proveedor",
      accesos_nacionales: { $toInt: "$accesos_fijos_internet" },
      participacion_nacional_pct: { $round: [{ $toDouble: "$participacion" }, 4] },
      periodo: { anno: { $toInt: "$anno" }, trimestre: { $toInt: "$trimestre" } }
    }
  },
  { $out: "proveedores" }
]);

// ---------------------------------------------------------------------
// 3. Colección ACCESOS (hechos: un documento por combinación
//    municipio + proveedor + segmento + tecnología + velocidad)
//    - "estrato" solo existe en los documentos del segmento RESIDENCIAL
//      (esquema flexible: los demás segmentos no lo tienen)
//    - "tecnologia" es un subdocumento con el nombre y su familia
// ---------------------------------------------------------------------
db.accesos.drop();
db.raw_accesos.aggregate([
  {
    $set: {
      seg: { $trim: { input: { $toString: "$segmento" } } },
      tec: { $toString: "$tecnologia" }
    }
  },
  {
    $project: {
      _id: 0,
      periodo: { anno: { $toInt: "$anno" }, trimestre: { $toInt: "$trimestre" } },
      municipio: {
        codigo_dane: { $toInt: "$codigo_dane_municipio" },
        nombre: "$municipio"
      },
      proveedor: "$proveedor",
      segmento: {
        $cond: [
          { $regexMatch: { input: "$seg", regex: /^RESIDENCIAL/ } },
          "RESIDENCIAL",
          // normaliza dobles espacios, p. ej. "CORPORATIVO  (ACCESOS ADICIONALES)"
          { $replaceAll: { input: "$seg", find: "  ", replacement: " " } }
        ]
      },
      estrato: {
        $cond: [
          { $regexMatch: { input: "$seg", regex: /^RESIDENCIAL - ESTRATO/ } },
          { $toInt: { $substrCP: ["$seg", 22, 1] } },
          "$$REMOVE"
        ]
      },
      tecnologia: {
        nombre: "$tec",
        familia: {
          $switch: {
            branches: [
              // HFC va primero porque su nombre también contiene "FIBER"
              { case: { $in: ["$tec", ["HYBRID FIBER COAXIAL (HFC)", "CABLE"]] }, then: "Cable / HFC" },
              { case: { $regexMatch: { input: "$tec", regex: /FIBER|FIBRA/ } }, then: "Fibra óptica" },
              { case: { $eq: ["$tec", "XDSL"] }, then: "Cobre (xDSL)" },
              { case: { $regexMatch: { input: "$tec", regex: /SATELITAL/ } }, then: "Satelital" },
              { case: { $regexMatch: { input: "$tec", regex: /WIFI|WIMAX|INALÁMBRICAS|5G/ } }, then: "Inalámbrica" }
            ],
            default: "Otras"
          }
        }
      },
      velocidad: {
        bajada_mbps: { $toDouble: "$velocidad_bajada" },
        subida_mbps: { $toDouble: "$velocidad_subida" }
      },
      accesos: { $toInt: "$accesos_fijos_internet" }
    }
  },
  { $out: "accesos" }
]);

// ---------------------------------------------------------------------
// 4. Índices para acelerar filtros y $lookup
// ---------------------------------------------------------------------
db.accesos.createIndex({ "municipio.codigo_dane": 1 });
db.accesos.createIndex({ proveedor: 1 });
db.accesos.createIndex({ segmento: 1, estrato: 1 });
db.accesos.createIndex({ "tecnologia.familia": 1 });
db.proveedores.createIndex({ nombre: 1 }, { unique: true });

// ---------------------------------------------------------------------
// 5. Verificación
// ---------------------------------------------------------------------
print("municipios :", db.municipios.countDocuments());
print("proveedores:", db.proveedores.countDocuments());
print("accesos    :", db.accesos.countDocuments());
printjson(db.accesos.findOne({ segmento: "RESIDENCIAL" }));
printjson(db.accesos.findOne({ segmento: "CORPORATIVO" }));
printjson(db.municipios.findOne({ _id: 5001 }));
