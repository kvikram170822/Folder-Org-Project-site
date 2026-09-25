(() => {
  "use strict";

  const TOKEN = "intelligent-explorer-beta:accepted";

  function bytesToHex(bytes) {
    return Array.from(new Uint8Array(bytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function normalize(raw) {
    // Accept noise: spaces, dashes, lowercase -> canonical IE-XXXX-XXXX.
    return raw
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .replace(/^([A-Z0-9]{2})([A-Z0-9]{4})([A-Z0-9]{4})$/, "$1-$2-$3");
  }

  function isValid(canonical) {
    return /^IE-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(canonical);
  }

  async function digest(value) {
    const data = new TextEncoder().encode(value);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return bytesToHex(buf);
  }

  const accepted = () => localStorage.getItem(TOKEN) === "1";

  function show(id, on) {
    const el = document.getElementById(id);
    if (el) el.hidden = !on;
  }

  function setError(msg) {
    const box = document.getElementById("gateError");
    box.textContent = msg;
    box.hidden = !msg;
  }

  function fmtBytes(n) {
    if (n >= 1_073_741_824) return (n / 1_073_741_824).toFixed(1) + " GB";
    if (n >= 1_048_576) return (n / 1_048_576).toFixed(1) + " MB";
    return Math.round(n / 1024) + " KB";
  }

  async function renderDownloads() {
    const list = document.getElementById("downloadList");
    const verEl = document.getElementById("relVersion");
    list.textContent = "";
    try {
      const res = await fetch("releases.json", { cache: "no-store" });
      if (!res.ok) throw new Error("no release manifest");
      const data = await res.json();
      verEl.textContent = data.version || "?";
      for (const item of data.downloads || []) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = item.url;
        a.download = item.name;
        const name = document.createElement("span");
        name.className = "dl-name";
        name.textContent = item.name;
        const meta = document.createElement("span");
        meta.className = "dl-meta";
        meta.textContent = `${item.platform} · ${fmtBytes(item.size)}`;
        a.append(name, meta);
        li.appendChild(a);
        list.appendChild(li);
      }
    } catch {
      liNote("Release manifest unavailable — check back shortly.");
    }
  }

  function liNote(text) {
    const list = document.getElementById("downloadList");
    const li = document.createElement("li");
    li.style.gridColumn = "1 / -1";
    li.style.fontSize = "13px";
    li.style.color = "#64748b";
    li.textContent = text;
    list.appendChild(li);
  }

  function unlock(code) {
    const value = normalize(code);
    if (!isValid(value)) {
      setError("That doesn’t look like a valid format — codes look like IE-XXXX-XXXX.");
      return;
    }
    digest(value)
      .then((hex) => {
        const acceptedSet = Array.isArray(window.INVITE_DIGESTS)
          ? window.INVITE_DIGESTS
          : [];
        if (!acceptedSet.includes(hex)) {
          setError("This invite code isn’t valid right now. Codes rotate through beta — get a current one.");
          return;
        }
        localStorage.setItem(TOKEN, "1");
        setError("");
        show("gateSuccess", true);
        show("gateForm", false);
        const help = document.getElementById("codeHelp");
        if (help) help.hidden = true;
        renderDownloads();
      })
      .catch(() => setError("Couldn’t verify the code in this browser."));
  }

  document.getElementById("gateForm").addEventListener("submit", (e) => {
    e.preventDefault();
    unlock(document.getElementById("code").value);
  });

  if (accepted()) {
    show("gateSuccess", true);
    show("gateForm", false);
    const help = document.getElementById("codeHelp");
    if (help) help.hidden = true;
    renderDownloads();
  }
})();