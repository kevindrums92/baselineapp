import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, "dist");
const port = process.env.PORT || 3000;

// Estáticos del build
app.use(express.static(distPath, { maxAge: "1h" }));

// SPA fallback (para rutas que no sean archivos)
app.use((req, res, next) => {
  // Si parece un archivo (tiene punto), no hacemos fallback
  if (req.path.includes(".")) return next();
  return res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
