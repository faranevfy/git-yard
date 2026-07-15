import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const root = process.cwd();
const user = process.argv[2] ?? "faranevfy";

// Run the real CLI and capture its ANSI output (uses cache, no network).
const res = spawnSync("node", ["dist/index.js", user], {
  cwd: root,
  encoding: "utf8",
});
if (res.status !== 0) {
  console.error("git-yard failed:", res.stderr || res.error);
  process.exit(1);
}
const ansi = res.stdout.replace(/\n$/, "");

// --- ANSI true-color -> HTML ---
const ESC = "\x1b";
function hex(n) {
  return `#${n.toString(16).padStart(2, "0")}`;
}
function ansiToHtml(text) {
  let fg = null;
  let bg = null;
  let bold = false;
  let dim = false;
  let out = "";
  let buf = "";
  const flush = () => {
    if (!buf) return;
    let style = "";
    if (fg) style += `color:${fg};`;
    if (bg) style += `background:${bg};`;
    if (bold) style += "font-weight:600;";
    if (dim) style += "opacity:0.62;";
    const safe = buf.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    out += style ? `<span style="${style}">${safe}</span>` : safe;
    buf = "";
  };
  let i = 0;
  while (i < text.length) {
    if (text[i] === ESC && text[i + 1] === "[") {
      let j = i + 2;
      while (j < text.length && text[j] !== "m") j++;
      const code = text.slice(i + 2, j);
      i = j + 1;
      flush();
      if (code === "0") {
        fg = bg = null;
        bold = dim = false;
      } else if (code === "39") fg = null;
      else if (code === "49") bg = null;
      else if (code === "1") bold = true;
      else if (code === "2") dim = true;
      else if (code === "22") {
        bold = false;
        dim = false;
      } else if (code.startsWith("38;2;")) {
        const [r, g, b] = code.slice(5).split(";").map(Number);
        fg = `${hex(r)}${hex(g)}${hex(b)}`;
      } else if (code.startsWith("48;2;")) {
        const [r, g, b] = code.slice(5).split(";").map(Number);
        bg = `${hex(r)}${hex(g)}${hex(b)}`;
      }
      continue;
    }
    buf += text[i];
    i++;
  }
  flush();
  return out;
}

const body = ansiToHtml(ansi);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>git-yard — ${user}</title>
<style>
  :root {
    --bg-0: #05080a;
    --bg-1: #0a0f0c;
    --term: #0b1210;
    --edge: #1b2a22;
    --ink: #c7d6cd;
    --green: #3fb950;
    --font: ui-monospace, "SF Mono", "JetBrains Mono", "Fira Code", Menlo, Consolas, monospace;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    min-height: 100%;
    background:
      radial-gradient(120% 90% at 50% -10%, rgba(63,185,80,0.10), transparent 60%),
      linear-gradient(180deg, var(--bg-1), var(--bg-0));
    color: var(--ink);
    font-family: var(--font);
    -webkit-font-smoothing: antialiased;
  }
  body { display: flex; justify-content: center; padding: clamp(16px, 4vw, 56px); }

  .terminal {
    width: min(900px, 100%);
    background: linear-gradient(180deg, var(--term), #070c0a);
    border: 1px solid var(--edge);
    border-radius: 12px;
    box-shadow: 0 30px 70px -30px rgba(0,0,0,0.9), 0 0 50px -24px rgba(63,185,80,0.3);
    overflow: hidden;
  }
  .titlebar {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 16px;
    background: linear-gradient(180deg, #0f1714, #0b120f);
    border-bottom: 1px solid var(--edge);
    font-size: 12px; color: #6b7d72;
  }
  .dots { display: flex; gap: 8px; }
  .dot { width: 12px; height: 12px; border-radius: 50%; }
  .dot.r { background: #e06c75; } .dot.y { background: #e6c07b; } .dot.g { background: var(--green); }
  .titlebar b { color: var(--green); font-weight: 600; }

  pre {
    margin: 0;
    padding: 20px;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre;
    color: var(--ink);
    tab-size: 4;
  }
  pre::-webkit-scrollbar { height: 8px; }
  pre::-webkit-scrollbar-thumb { background: rgba(63,185,80,0.35); border-radius: 8px; }
</style>
</head>
<body>
  <div class="terminal" role="img" aria-label="git-yard terminal output for ${user}">
    <div class="titlebar">
      <span class="dots"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span></span>
      <span>— <b>git-yard</b> · $ git-yard ${user}</span>
    </div>
    <pre>${body}</pre>
  </div>
</body>
</html>
`;

writeFileSync(`${root}/preview.html`, html);
console.log(`wrote preview.html from real git-yard output (${user})`);
