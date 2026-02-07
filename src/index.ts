// ============================================================
// baaa.sh — sheepsay as a service
// ============================================================

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const ua = request.headers.get("user-agent") || "";
    const accept = request.headers.get("accept") || "";
    const isTerminal = isCLI(ua, accept);

    if (url.pathname === "/favicon.ico") {
      return new Response(SHEEP_FAVICON_SVG, {
        headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=86400" },
      });
    }

    const raw = decodeURIComponent(url.pathname.slice(1)).replace(/\+/g, " ").trim();
    const message = raw || randomMessage();
    const face = randomFace();

    if (isTerminal) {
      return new Response(sheepsay(message, face) + "\n", {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    return new Response(html(message, raw !== "", face), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
} satisfies ExportedHandler;

// ============================================================
// CLI detection
// ============================================================

const CLI_AGENTS = ["curl/", "wget/", "httpie/", "fetch/", "undici/", "node-fetch", "got/", "powershell", "lwp-request", "python-requests", "http.rb", "xh/"];

function isCLI(ua: string, accept: string): boolean {
  const lower = ua.toLowerCase();
  if (CLI_AGENTS.some((a) => lower.includes(a))) return true;
  if (accept.includes("text/plain") && !accept.includes("text/html")) return true;
  return false;
}

// ============================================================
// Random messages
// ============================================================

const RANDOM_MESSAGES = [
  "baaa!",
  "you herd me",
  "wool you be my friend?",
  "feeling sheepish",
  "ewe know what I mean",
  "shear brilliance",
  "just going with the flock",
  "the grass is greener over here",
  "count me in",
  "I've been fleeced!",
  "hay there",
  "on the lam",
  "that's baaad",
  "shear joy",
  "just keep bleating",
  "pull the wool over your eyes",
  "life is bleat-iful",
  "ewe complete me",
  "no ifs, ands, or muttons",
  "another one bites the dust bunny",
  "wake up sheeple",
  "I sheep you not",
  "fleece navidad",
  "what in the wool?",
  "to bleat or not to bleat",
];

function randomMessage(): string {
  return RANDOM_MESSAGES[Math.floor(Math.random() * RANDOM_MESSAGES.length)];
}

// ============================================================
// Sheep faces
// ============================================================

interface SheepFace {
  eyes: string;  // 2 chars, e.g. "oo"
  mouth: string; // 2 chars, e.g. "--"
  name: string;
}

const FACES: SheepFace[] = [
  { eyes: "oo", mouth: "--", name: "standard" },
  { eyes: "^^", mouth: "--", name: "happy" },
  { eyes: "zz", mouth: "__", name: "sleepy" },
  { eyes: "OO", mouth: "oo", name: "surprised" },
  { eyes: "oO", mouth: "~~", name: "skeptical" },
  { eyes: "\u2665\u2665", mouth: "--", name: "smitten" },
];

function randomFace(): SheepFace {
  return FACES[Math.floor(Math.random() * FACES.length)];
}

// ============================================================
// Sheepsay — ASCII speech bubble + sheep
// ============================================================

const MAX_WIDTH = 40;

function sheepsay(text: string, face: SheepFace): string {
  const lines = wrapText(text, MAX_WIDTH);
  const bubble = speechBubble(lines);
  return bubble + "\n" + makeSheep(face);
}

function makeSheep(face: SheepFace): string {
  return `    \\
     \\
       @@@@@@
      @@@@@@@@
     @@  ${face.eyes}  @@
      @( ${face.mouth} )@
       @@@@@@
      @@@@@@@@
       ||  ||
       ''  ''`;
}

function wrapText(text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (word.length > width) {
      if (current) lines.push(current);
      for (let i = 0; i < word.length; i += width) {
        lines.push(word.slice(i, i + width));
      }
      current = "";
      continue;
    }
    if (current && current.length + 1 + word.length > width) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);
  if (lines.length === 0) lines.push("");
  return lines;
}

function speechBubble(lines: string[]): string {
  const maxLen = Math.max(...lines.map((l) => l.length));
  const padded = lines.map((l) => l.padEnd(maxLen));
  const border = "─".repeat(maxLen + 2);

  if (lines.length === 1) {
    return ` ╭${border}╮\n │ ${padded[0]} │\n ╰${border}╯`;
  }

  const top = ` ╭${border}╮`;
  const bottom = ` ╰${border}╯`;
  const middle = padded.map((line, i) => {
    if (i === 0) return ` / ${line} \\`;
    if (i === lines.length - 1) return ` \\ ${line} /`;
    return ` │ ${line} │`;
  });

  return [top, ...middle, bottom].join("\n");
}

// ============================================================
// SPA HTML
// ============================================================

const SHEEP_FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🐑</text></svg>`;

function html(message: string, hasPath: boolean, face: SheepFace): string {
  const escaped = escapeHtml(message);
  const initialArt = escapeHtml(sheepsay(message, face));

  const facesJson = JSON.stringify(FACES);
  const messagesJson = JSON.stringify(RANDOM_MESSAGES);
  const initialFaceIdx = FACES.indexOf(face);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>baaa.sh \u2014 sheepsay as a service</title>
<link rel="icon" href="/favicon.ico">
<meta name="description" content="Sheepsay as a service. Like cowsay, but fluffier.">
<meta property="og:title" content="baaa.sh \u2014 sheepsay">
<meta property="og:description" content="${escaped} \u2014 sheepsay as a service">
<meta property="og:type" content="website">
<meta property="og:url" content="https://baaa.sh">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #1a1b26;
    --surface: #24283b;
    --border: #414868;
    --text: #c0caf5;
    --text-dim: #565f89;
    --accent: #7aa2f7;
    --green: #9ece6a;
    --pink: #f7768e;
    --wool: #e0af68;
  }

  body {
    font-family: "Berkeley Mono", "SF Mono", "Cascadia Code", "JetBrains Mono", "Fira Code", ui-monospace, monospace;
    background: var(--bg);
    color: var(--text);
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1rem;
  }

  h1 {
    font-size: clamp(1.5rem, 5vw, 2.5rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    margin-bottom: 0.25rem;
  }

  h1 span { color: var(--wool); }

  .subtitle {
    color: var(--text-dim);
    font-size: 0.9rem;
    margin-bottom: 2rem;
  }

  .input-wrap {
    width: 100%;
    max-width: 600px;
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  input[type="text"] {
    flex: 1;
    padding: 0.75rem 1rem;
    font-family: inherit;
    font-size: 1rem;
    background: var(--surface);
    color: var(--text);
    border: 1.5px solid var(--border);
    border-radius: 8px;
    outline: none;
    transition: border-color 0.15s;
  }

  input[type="text"]:focus { border-color: var(--accent); }
  input::placeholder { color: var(--text-dim); }

  button {
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 0.75rem 1.25rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
    white-space: nowrap;
  }

  button:active { transform: scale(0.97); }

  .btn-copy { background: var(--accent); color: var(--bg); }
  .btn-shuffle {
    background: var(--wool);
    color: var(--bg);
    font-size: 1.1rem;
    padding: 0.75rem 1rem;
  }
  .btn-curl {
    background: var(--surface);
    color: var(--green);
    border: 1.5px solid var(--border);
  }

  .output-wrap {
    width: 100%;
    max-width: 600px;
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }

  .output-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--border);
    font-size: 0.75rem;
    color: var(--text-dim);
  }

  .output-bar .dots span {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 6px;
  }

  .dot-r { background: var(--pink); }
  .dot-y { background: var(--wool); }
  .dot-g { background: var(--green); }

  #output {
    padding: 1rem 1.5rem;
    font-size: clamp(0.65rem, 1.8vw, 0.875rem);
    line-height: 1.35;
    white-space: pre;
    overflow-x: auto;
    min-height: 200px;
    color: var(--text);
  }

  .curl-hint {
    width: 100%;
    max-width: 600px;
    margin-top: 1.5rem;
    padding: 1rem 1.25rem;
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: 12px;
    font-size: 0.8rem;
    color: var(--text-dim);
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .curl-hint code {
    color: var(--green);
    flex: 1;
    overflow-x: auto;
    white-space: nowrap;
  }

  footer {
    margin-top: auto;
    padding-top: 3rem;
    font-size: 0.75rem;
    color: var(--text-dim);
  }

  footer a { color: var(--accent); text-decoration: none; }
  footer a:hover { text-decoration: underline; }

  .toast {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(120%);
    background: var(--green);
    color: var(--bg);
    padding: 0.5rem 1.25rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    opacity: 0;
    transition: transform 0.25s ease, opacity 0.25s ease;
    pointer-events: none;
  }

  .toast.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
</style>
</head>
<body>

<h1><span>baaa</span>.sh</h1>
<p class="subtitle">sheepsay as a service \u2014 like cowsay, but fluffier</p>

<div class="input-wrap">
  <input type="text" id="msg" placeholder="what should the sheep say?" value="${hasPath ? escaped : ""}" autofocus spellcheck="false" autocomplete="off">
  <button class="btn-shuffle" onclick="shuffleFace()" title="Random sheep face">\u{1F3B2}</button>
  <button class="btn-copy" onclick="copyArt()" title="Copy ASCII art">Copy</button>
</div>

<div class="output-wrap">
  <div class="output-bar">
    <div class="dots"><span class="dot-r"></span><span class="dot-y"></span><span class="dot-g"></span></div>
    <span id="face-label"></span>
  </div>
  <div id="output">${initialArt}</div>
</div>

<div class="curl-hint">
  <span>$</span>
  <code id="curl-cmd">curl baaa.sh/${hasPath ? encodeURIComponent(message).replace(/%20/g, "+") : "hello+world"}</code>
  <button class="btn-curl" onclick="copyCurl()">Copy</button>
</div>

<div class="toast" id="toast">Copied!</div>

<footer>
  <a href="https://github.com">source</a> \u00b7 a dumb thing by someone with a good domain
</footer>

<script>
const MAX_WIDTH = 40;
const FACES = ${facesJson};
const MESSAGES = ${messagesJson};

let currentFaceIdx = ${initialFaceIdx};
let placeholderMsg = ${JSON.stringify(message)};

function makeSheep(face) {
  return [
    "    \\\\",
    "     \\\\",
    "       @@@@@@",
    "      @@@@@@@@",
    "     @@  " + face.eyes + "  @@",
    "      @( " + face.mouth + " )@",
    "       @@@@@@",
    "      @@@@@@@@",
    "       ||  ||",
    "       ''  ''"
  ].join("\\n");
}

function wrapText(text, width) {
  const words = text.split(/\\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (w.length > width) {
      if (cur) lines.push(cur);
      for (let i = 0; i < w.length; i += width) lines.push(w.slice(i, i + width));
      cur = "";
      continue;
    }
    if (cur && cur.length + 1 + w.length > width) { lines.push(cur); cur = w; }
    else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  if (!lines.length) lines.push("");
  return lines;
}

function speechBubble(lines) {
  const max = Math.max(...lines.map(l => l.length));
  const pad = lines.map(l => l.padEnd(max));
  const b = "\\u2500".repeat(max + 2);
  if (lines.length === 1) return " \\u256D" + b + "\\u256E\\n \\u2502 " + pad[0] + " \\u2502\\n \\u2570" + b + "\\u256F";
  const top = " \\u256D" + b + "\\u256E";
  const bot = " \\u2570" + b + "\\u256F";
  const mid = pad.map((l, i) => {
    if (i === 0) return " / " + l + " \\\\";
    if (i === lines.length - 1) return " \\\\ " + l + " /";
    return " \\u2502 " + l + " \\u2502";
  });
  return [top, ...mid, bot].join("\\n");
}

function sheepsay(text, face) {
  const lines = wrapText(text, MAX_WIDTH);
  return speechBubble(lines) + "\\n" + makeSheep(face);
}

// DOM
const msgInput = document.getElementById("msg");
const output = document.getElementById("output");
const curlCmd = document.getElementById("curl-cmd");
const faceLabel = document.getElementById("face-label");
const toast = document.getElementById("toast");

function render() {
  const text = msgInput.value.trim() || placeholderMsg;
  const face = FACES[currentFaceIdx];
  output.textContent = sheepsay(text, face);
  const encoded = encodeURIComponent(text).replace(/%20/g, "+");
  curlCmd.textContent = "curl baaa.sh/" + encoded;
  faceLabel.textContent = "sheepsay \\u2014 " + face.name + " sheep";
}

function shuffleFace() {
  currentFaceIdx = Math.floor(Math.random() * FACES.length);
  placeholderMsg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  render();
}

msgInput.addEventListener("input", render);

function copyArt() {
  navigator.clipboard.writeText(output.textContent).then(showToast);
}
function copyCurl() {
  navigator.clipboard.writeText(curlCmd.textContent).then(showToast);
}

let toastTimer;
function showToast() {
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1500);
}

render();
</script>
</body>
</html>`;
}

// ============================================================
// Utilities
// ============================================================

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
