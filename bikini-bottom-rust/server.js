// Bikini Bottom Rust - tiny game server (no extra packages needed).
// It does two jobs: serves the game files, and relays player positions between friends.
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto");
const PUB = path.join(__dirname, "public");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".glb": "model/gltf-binary", ".mp3": "audio/mpeg", ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon" };

const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/time") { res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" }); return res.end(JSON.stringify({ now: Date.now() })); }
  if (u.pathname === "/health") { res.writeHead(200); return res.end("ok"); }
  let rel; try { rel = decodeURIComponent(u.pathname); } catch (e) { res.writeHead(400); return res.end(); }
  const f = path.join(PUB, rel === "/" ? "index.html" : rel);
  if (!f.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream", "cache-control": "public, max-age=3600" });
    res.end(d);
  });
});

// ---- multiplayer: rooms of players, each sending their own state ~20 times a second ----
const rooms = new Map();
let nid = 1;
function send(c, text, op = 1) {
  if (c.sock.destroyed) return;
  const p = Buffer.from(text);
  let h;
  if (p.length < 126) h = Buffer.from([128 | op, p.length]);
  else if (p.length < 65536) { h = Buffer.alloc(4); h[0] = 128 | op; h[1] = 126; h.writeUInt16BE(p.length, 2); }
  else return;
  c.sock.write(Buffer.concat([h, p]));
}
function drop(c) {
  if (c.gone) return; c.gone = true;
  const r = rooms.get(c.room);
  if (r) { r.delete(c.id); if (!r.size) rooms.delete(c.room); }
}
function onMessage(c, text) {
  let m; try { m = JSON.parse(text); } catch (e) { return; }
  if (m.t === "join" && !c.room) {
    c.room = String(m.room || "friends").slice(0, 20).toLowerCase();
    if (!rooms.has(c.room)) rooms.set(c.room, new Map());
    const r = rooms.get(c.room);
    if (r.size >= 16) { c.sock.destroy(); return; }
    r.set(c.id, c);
    send(c, JSON.stringify({ t: "hello", id: c.id, now: Date.now() }));
  } else if (m.t === "p" && c.room && m.d && typeof m.d === "object") {
    c.p = m.d;
  }
}
function parse(c) {
  for (;;) {
    const b = c.buf;
    if (b.length < 2) return;
    const op = b[0] & 15, masked = b[1] & 128;
    let len = b[1] & 127, off = 2;
    if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
    else if (len === 127) { c.sock.destroy(); return; }
    if (!masked) { c.sock.destroy(); return; }
    if (b.length < off + 4 + len) return;
    const mask = b.slice(off, off + 4), data = Buffer.alloc(len);
    for (let i = 0; i < len; i++) data[i] = b[off + 4 + i] ^ mask[i & 3];
    c.buf = b.slice(off + 4 + len);
    if (op === 8) { c.sock.end(); return; }
    if (op === 9) { send(c, data.toString(), 10); continue; }
    if (op === 1) onMessage(c, data.toString());
  }
}
server.on("upgrade", (req, sock) => {
  if (new URL(req.url, "http://x").pathname !== "/ws" || !req.headers["sec-websocket-key"]) { sock.destroy(); return; }
  const acc = crypto.createHash("sha1").update(req.headers["sec-websocket-key"] + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64");
  sock.write("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + acc + "\r\n\r\n");
  sock.setNoDelay(true);
  const c = { id: "p" + (nid++), sock, room: null, p: null, buf: Buffer.alloc(0), gone: false };
  sock.on("data", d => { c.buf = Buffer.concat([c.buf, d]); if (c.buf.length > 65536) { sock.destroy(); return; } parse(c); });
  sock.on("close", () => drop(c));
  sock.on("error", () => drop(c));
});
setInterval(() => {
  for (const [, r] of rooms) {
    const snap = {};
    for (const [id, c] of r) if (c.p) snap[id] = c.p;
    for (const [id, c] of r) {
      const o = {};
      for (const k in snap) if (k !== id) o[k] = snap[k];
      send(c, JSON.stringify({ t: "state", p: o }));
    }
  }
}, 50);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Game running on port " + PORT));
