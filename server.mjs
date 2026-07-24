import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const publicDir = join(process.cwd(), "public");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml" };
const port = Number(process.env.PORT || 3000);

createServer((request, response) => {
  const path = request.url === "/" ? "/index.html" : request.url?.split("?")[0] || "/index.html";
  const file = normalize(join(publicDir, path));
  if (!file.startsWith(publicDir) || !existsSync(file)) { response.writeHead(404); response.end("Tidak ditemukan"); return; }
  response.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
  createReadStream(file).pipe(response);
}).listen(port, () => console.log(`Cageur Rekening Quest siap dicoba di http://localhost:${port}`));
