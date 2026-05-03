// ═══════════════════════════════════════════════════════════════
// ANGEL ONE PROXY SERVER v2.1 — Railway / Render / Heroku
// ═══════════════════════════════════════════════════════════════

const express = require("express");
const fetch   = require("node-fetch");
const app     = express();

const PORT         = process.env.PORT || 3000;
const PROXY_SECRET = process.env.PROXY_SECRET || "";
const ANGEL_BASE   = "https://apiconnect.angelone.in";

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers",
    "Content-Type,Authorization,X-PrivateKey,X-ClientLocalIP,X-ClientPublicIP,X-MACAddress,Accept,X-Proxy-Secret"
  );
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

function authGuard(req, res, next) {
  if (!PROXY_SECRET) return next();
  const incoming = req.headers["x-proxy-secret"] || "";
  if (incoming !== PROXY_SECRET) {
    return res.status(401).json({ status: false, message: "Unauthorized: wrong proxy secret" });
  }
  next();
}

app.get("/", (req, res) => {
  res.json({ status: true, server: "Angel One Proxy", version: "2.1", time: new Date().toISOString() });
});

app.get("/ping", (req, res) => res.json({ pong: true, ts: Date.now() }));

app.post("/angel/login", authGuard, async (req, res) => {
  try {
    const apiKey = req.headers["x-privatekey"] || "";
    const result = await fetch(`${ANGEL_BASE}/rest/auth/angelbroking/user/v1/loginByPassword`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", "Accept": "application/json",
        "X-UserType": "USER", "X-SourceID": "WEB",
        "X-ClientLocalIP": "127.0.0.1", "X-ClientPublicIP": "127.0.0.1",
        "X-MACAddress": "00:00:00:00:00:00", "X-PrivateKey": apiKey,
      },
      body: JSON.stringify(req.body),
    });
    res.json(await result.json());
  } catch(e) { res.status(500).json({ status: false, message: e.message }); }
});

app.post("/angel/refresh", authGuard, async (req, res) => {
  try {
    const result = await fetch(`${ANGEL_BASE}/rest/auth/angelbroking/jwt/v1/generateTokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", "Accept": "application/json",
        "X-UserType": "USER", "X-SourceID": "WEB",
        "X-PrivateKey": req.headers["x-privatekey"] || "",
        "Authorization": req.headers["authorization"] || "",
      },
      body: JSON.stringify(req.body),
    });
    res.json(await result.json());
  } catch(e) { res.status(500).json({ status: false, message: e.message }); }
});

app.post("/angel/quote", authGuard, async (req, res) => {
  try {
    const result = await fetch(`${ANGEL_BASE}/rest/secure/angelbroking/market/v1/quote/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", "Accept": "application/json",
        "X-UserType": "USER", "X-SourceID": "WEB",
        "Authorization": req.headers["authorization"] || "",
        "X-PrivateKey": req.headers["x-privatekey"] || "",
      },
      body: JSON.stringify(req.body),
    });
    res.json(await result.json());
  } catch(e) { res.status(500).json({ status: false, message: e.message }); }
});

app.post("/angel/optionchain", authGuard, async (req, res) => {
  try {
    const result = await fetch(`${ANGEL_BASE}/rest/secure/angelbroking/derivatives/v1/getCandleData`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", "Accept": "application/json",
        "X-UserType": "USER", "X-SourceID": "WEB",
        "Authorization": req.headers["authorization"] || "",
        "X-PrivateKey": req.headers["x-privatekey"] || "",
      },
      body: JSON.stringify(req.body),
    });
    res.json(await result.json());
  } catch(e) { res.status(500).json({ status: false, message: e.message }); }
});

app.post("/angel/expiry", authGuard, async (req, res) => {
  try {
    const { name } = req.body;
    const result = await fetch(`${ANGEL_BASE}/rest/secure/angelbroking/derivatives/v1/getCandleData`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", "Accept": "application/json",
        "X-UserType": "USER", "X-SourceID": "WEB",
        "Authorization": req.headers["authorization"] || "",
        "X-PrivateKey": req.headers["x-privatekey"] || "",
      },
      body: JSON.stringify({ name, expirydate: "", strikePrice: "0", optionType: "CE" }),
    });
    res.json(await result.json());
  } catch(e) { res.status(500).json({ status: false, message: e.message }); }
});

app.get("/angel/scripmaster/NFO", authGuard, async (req, res) => {
  try {
    const result = await fetch("https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json", {
      headers: { "Accept": "application/json" },
    });
    if (!result.ok) return res.status(502).json({ status: false, message: `Scripmaster fetch failed: ${result.status}` });
    const data = await result.json();
    const nfo = Array.isArray(data) ? data.filter(s => s.exch_seg === "NFO") : data;
    res.json({ status: true, data: nfo });
  } catch(e) { res.status(500).json({ status: false, message: e.message }); }
});

app.get("/angel/order/book", authGuard, async (req, res) => {
  try {
    const result = await fetch(`${ANGEL_BASE}/rest/secure/angelbroking/order/v1/getOrderBook`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json", "Accept": "application/json",
        "X-UserType": "USER", "X-SourceID": "WEB",
        "Authorization": req.headers["authorization"] || "",
        "X-PrivateKey": req.headers["x-privatekey"] || "",
      },
    });
    res.json(await result.json());
  } catch(e) { res.status(500).json({ status: false, message: e.message }); }
});

app.post("/angel/order/place", authGuard, async (req, res) => {
  try {
    const result = await fetch(`${ANGEL_BASE}/rest/secure/angelbroking/order/v1/placeOrder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", "Accept": "application/json",
        "X-UserType": "USER", "X-SourceID": "WEB",
        "Authorization": req.headers["authorization"] || "",
        "X-PrivateKey": req.headers["x-privatekey"] || "",
      },
      body: JSON.stringify(req.body),
    });
    res.json(await result.json());
  } catch(e) { res.status(500).json({ status: false, message: e.message }); }
});

app.get("/angel/positions", authGuard, async (req, res) => {
  try {
    const result = await fetch(`${ANGEL_BASE}/rest/secure/angelbroking/order/v1/getPosition`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json", "Accept": "application/json",
        "X-UserType": "USER", "X-SourceID": "WEB",
        "Authorization": req.headers["authorization"] || "",
        "X-PrivateKey": req.headers["x-privatekey"] || "",
      },
    });
    res.json(await result.json());
  } catch(e) { res.status(500).json({ status: false, message: e.message }); }
});

app.listen(PORT, () => {
  console.log(`✅ Angel One Proxy running on port ${PORT}`);
  console.log(`🔐 Auth guard: ${PROXY_SECRET ? "ENABLED" : "DISABLED (open)"}`);
});
