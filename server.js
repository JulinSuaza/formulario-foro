// server.js
import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();
const DATA_FILE = path.join(__dirname, "formularios.json");

// Configuración CORS más detallada
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Manejar solicitudes OPTIONS (preflight)
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Ruta para recibir formularios
app.post("/api/formulario", (req, res) => {
  console.log("Solicitud recibida en /api/formulario");
  console.log("Datos recibidos:", req.body);
  
  const { nombre, email, mensaje } = req.body;

  if (!nombre || !email || !mensaje) {
    return res.status(400).json({ error: "Faltan campos requeridos." });
  }

  const nuevo = {
    nombre,
    email,
    mensaje,
    fecha: new Date().toISOString()
  };

  try {
    let datos = [];
    if (fs.existsSync(DATA_FILE)) {
      try {
        const fileContent = fs.readFileSync(DATA_FILE, "utf8");
        datos = fileContent ? JSON.parse(fileContent) : [];
      } catch (error) {
        console.error("Error al leer el archivo:", error);
        return res.status(500).json({ error: "Error al procesar los datos existentes" });
      }
    }
    
    datos.push(nuevo);
    
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(datos, null, 2));
      console.log("Datos guardados correctamente");
      return res.status(201).json({ ok: true, mensaje: "Formulario recibido con éxito." });
    } catch (error) {
      console.error("Error al guardar los datos:", error);
      return res.status(500).json({ error: "Error al guardar los datos del formulario" });
    }
  } catch (error) {
    console.error("Error inesperado:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
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
