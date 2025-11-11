// server.js
import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();
const DATA_FILE = path.join(__dirname, "formularios.json");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📝 Ruta para recibir formularios
app.post("/api/formulario", (req, res) => {
  const { nombre, email, mensaje } = req.body;

  if (!nombre || !email || !mensaje) {
    return res.status(400).json({ error: "Faltan campos requeridos." });
  }

  const nuevo = {
    nombre,
    email,
    mensaje,
    fecha: new Date().toISOString(),
  };

  let datos = [];
  if (fs.existsSync(DATA_FILE)) {
    datos = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  }
  datos.push(nuevo);
  fs.writeFileSync(DATA_FILE, JSON.stringify(datos, null, 2));

  res.status(201).json({ ok: true, mensaje: "Formulario recibido con éxito." });
});

// 🌐 Ruta bonita para ver los formularios
app.get("/api/formularios", (req, res) => {
  let datos = [];
  if (fs.existsSync(DATA_FILE)) {
    datos = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  }

  const html = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Formularios Recibidos</title>
    <style>
      body {
        font-family: 'Segoe UI', sans-serif;
        background: #f3f4f6;
        color: #111827;
        padding: 30px;
      }
      h1 {
        text-align: center;
        color: #2563eb;
        margin-bottom: 20px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      th, td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
      }
      th {
        background: #2563eb;
        color: white;
      }
      tr:hover {
        background-color: #f9fafb;
      }
      .no-data {
        text-align: center;
        color: #6b7280;
        padding: 40px;
      }
    </style>
  </head>
  <body>
    <h1>📋 Formularios Recibidos</h1>
    ${
      datos.length > 0
        ? `
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Mensaje</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${datos
            .map(
              (d) => `
            <tr>
              <td>${d.nombre}</td>
              <td>${d.email}</td>
              <td>${d.mensaje}</td>
              <td>${new Date(d.fecha).toLocaleString("es-CO")}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      `
        : `<div class="no-data">Aún no hay formularios enviados 😴</div>`
    }
  </body>
  </html>
  `;

  res.send(html);
});

// 🔹 Ruta raíz de prueba
app.get("/", (req, res) => {
  res.send("<h2>Servidor de formularios activo ✅</h2>");
});

app.listen(PORT, () => console.log(`Servidor ejecutándose en puerto ${PORT}`));
