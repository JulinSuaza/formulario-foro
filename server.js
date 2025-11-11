// server.js
import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "tu_clave_secreta_por_defecto";
const __dirname = path.resolve();
const DATA_FILE = path.join(__dirname, "formularios.json");
const USERS_FILE = path.join(__dirname, "users.json");

// Crear archivo users.json si no existe
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
    req.user = user;
    next();
  });
};

// Ruta de registro
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
    }

    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    res.status(201).json({ message: "Usuario registrado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar el usuario" });
  }
});

// Ruta de login
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    const user = users.find(u => u.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

// Ruta para verificar el token
app.get("/api/verify-token", authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Ruta para recibir formularios (protegida)
app.post("/api/formulario", authenticateToken, (req, res) => {
  const { nombre, email, mensaje } = req.body;

  if (!nombre || !email || !mensaje) {
    return res.status(400).json({ error: "Faltan campos requeridos." });
  }

  const nuevo = {
    nombre,
    email,
    mensaje,
    fecha: new Date().toISOString(),
    enviadoPor: req.user.username // Guardamos qué usuario envió el formulario
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
