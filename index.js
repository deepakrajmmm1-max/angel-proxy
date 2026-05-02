index.js
const http = require("http");
const https = require("https");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-UserType,X-SourceID,X-ClientLocalIP,X-ClientPublicIP,X-MACAddress,X-PrivateKey,apikey,jwtToken,accept");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const target = "apiconnect.angelone.in";
  const path = req.url;

  const options = {
    hostname: target,
    port: 443,
    path: path,
    method: req.method,
    headers: {
      ...req.headers,
      host: target,
    },
  };

  delete options.headers["origin"];
  delete options.headers["referer"];

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      ...proxyRes.headers,
      "Access-Control-Allow-Origin": "*",
    });
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (e) => {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  });

  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log("Angel One Proxy running on port " + PORT);
});
