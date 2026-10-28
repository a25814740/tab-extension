import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";

const rootArg = process.argv[2] ?? "../docs";
const port = Number(process.argv[3] ?? 4174);
const rootDir = path.resolve(process.cwd(), rootArg);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8",
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") {
      pathname = "/preview/index.html";
    }
    if (pathname === "/preview" || pathname === "/preview/") {
      pathname = "/preview/index.html";
    }
    if (pathname.startsWith("/preview/assets/")) {
      pathname = pathname.replace("/preview/assets/", "/preview/assets/");
    } else if (pathname.startsWith("/preview/")) {
      pathname = pathname.replace("/preview/", "/preview/preview/");
    }

    const candidate = path.resolve(rootDir, `.${pathname}`);
    if (!candidate.startsWith(rootDir)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    let filePath = candidate;
    let stat;
    try {
      stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }
    } catch {
      filePath = path.join(rootDir, pathname.replace(/^\//, ""));
    }

    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`static server ready on http://127.0.0.1:${port}\n`);
});
