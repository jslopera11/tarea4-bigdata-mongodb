// Tarea 4 - Capturas faltantes: R1, R2, F1, F2 y A1 (pegar completo en _MONGOSH)
use("internet_fijo_antioquia");
db.accesos.insertMany([
  { periodo: { anno: 2026, trimestre: 2 }, municipio: { codigo_dane: 5364, nombre: "JARDÍN" }, proveedor: "UNAD CONECTA S.A.S. (PRUEBA)", segmento: "RESIDENCIAL", estrato: 2, tecnologia: { nombre: "FIBER TO THE HOME (FTTH)", familia: "Fibra óptica" }, velocidad: { bajada_mbps: 300, subida_mbps: 150 }, accesos: 45, origen: "registro de prueba" },
  { periodo: { anno: 2026, trimestre: 2 }, municipio: { codigo_dane: 5364, nombre: "JARDÍN" }, proveedor: "UNAD CONECTA S.A.S. (PRUEBA)", segmento: "RESIDENCIAL", estrato: 3, tecnologia: { nombre: "FIBER TO THE HOME (FTTH)", familia: "Fibra óptica" }, velocidad: { bajada_mbps: 500, subida_mbps: 250 }, accesos: 20, origen: "registro de prueba" },
  { periodo: { anno: 2026, trimestre: 2 }, municipio: { codigo_dane: 5364, nombre: "JARDÍN" }, proveedor: "UNAD CONECTA S.A.S. (PRUEBA)", segmento: "CORPORATIVO", tecnologia: { nombre: "OTRAS TECNOLOGÍAS INALÁMBRICAS", familia: "Inalámbrica" }, velocidad: { bajada_mbps: 100, subida_mbps: 100 }, accesos: 3, origen: "registro de prueba", contacto_soporte: { telefono: "604 000 0000", sla_horas: 4 } }
]);

print("\n========== R1. SELECCIÓN: documentos de prueba (find) ==========");
printjson(db.accesos.find({ origen: "registro de prueba" }).toArray());

print("\n========== R2. SELECCIÓN con proyección + sort + limit (Medellín, top 5) ==========");
printjson(db.accesos.find(
  { "municipio.nombre": "MEDELLÍN" },
  { _id: 0, proveedor: 1, segmento: 1, estrato: 1, "tecnologia.nombre": 1, "velocidad.bajada_mbps": 1, accesos: 1 }
).sort({ accesos: -1 }).limit(5).toArray());

print("\n========== F1. $gte: accesos residenciales con bajada >= 1000 Mbps ==========");
printjson(db.accesos.countDocuments({ segmento: "RESIDENCIAL", "velocidad.bajada_mbps": { $gte: 1000 } }));

print("\n========== F2. $in: estratos 5 y 6 con tecnología satelital ==========");
printjson(db.accesos.find(
  { estrato: { $in: [5, 6] }, "tecnologia.familia": "Satelital" },
  { _id: 0, "municipio.nombre": 1, proveedor: 1, estrato: 1, "velocidad.bajada_mbps": 1, accesos: 1 }
).limit(5).toArray());


db.accesos.deleteMany({ origen: "registro de prueba" });
print("\n(Se eliminan de nuevo los registros de prueba: la base queda limpia)");

print("\n========== A1. CONTAR: documentos por colección (accesos, municipios, proveedores) ==========");
print(db.accesos.countDocuments(), db.municipios.countDocuments(), db.proveedores.countDocuments());
