import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs-extra";

const app = express();
const PORT = process.env.PORT || 3000;

// Permitir solicitudes desde cualquier dominio (tu foro)
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const FILE_PATH = "./formularios.json";

// Asegurar que el archivo existe
if (!fs.existsSync(FILE_PATH)) {
  fs.writeJsonSync(FILE_PATH, []);
}

// Ruta para recibir formularios
app.post("/api/formulario", async (req, res) => {
  try {
    const nuevo = {
      id: Date.now(),
      nombre: req.body.nombre,
      email: req.body.email,
      mensaje: req.body.mensaje,
      fecha: new Date().toLocaleString(),
    };

    const data = await fs.readJson(FILE_PATH);
    data.push(nuevo);
    await fs.writeJson(FILE_PATH, data, { spaces: 2 });

    console.log("Nuevo formulario recibido:", nuevo);
    res.status(200).json({ ok: true, mensaje: "Formulario guardado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: "Error al guardar el formulario" });
  }
});

// Ruta para ver todos los formularios (solo admins)
app.get("/api/formularios", async (req, res) => {
  try {
    const data = await fs.readJson(FILE_PATH);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: "Error al leer formularios" });
  }
});

app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));
