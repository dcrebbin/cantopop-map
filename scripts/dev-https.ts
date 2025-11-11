import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import process from "node:process";
import next from "next";

type CertPaths = {
  key: string;
  cert: string;
  ca?: string;
};

const DEFAULT_CERT_DIR = path.join(process.cwd(), ".ssl");
const DEFAULT_CERT_PATHS: CertPaths = {
  key: path.join(DEFAULT_CERT_DIR, "localhost-key.pem"),
  cert: path.join(DEFAULT_CERT_DIR, "localhost.pem"),
};

function resolveCertPaths(): CertPaths {
  const key = process.env.LOCAL_SSL_KEY ?? DEFAULT_CERT_PATHS.key;
  const cert = process.env.LOCAL_SSL_CERT ?? DEFAULT_CERT_PATHS.cert;
  const ca = process.env.LOCAL_SSL_CA;

  return { key, cert, ca };
}

function ensureFileExists(filePath: string, label: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      [
        `Missing ${label} at ${filePath}.`,
        "Generate local certificates with a tool like mkcert or provide custom paths via LOCAL_SSL_KEY/CERT/CA environment variables.",
        `Default directory: ${DEFAULT_CERT_DIR}`,
      ].join(" "),
    );
  }
}

function readCertFiles(paths: CertPaths): https.ServerOptions {
  ensureFileExists(paths.key, "SSL key");
  ensureFileExists(paths.cert, "SSL certificate");

  const options: https.ServerOptions = {
    key: fs.readFileSync(paths.key),
    cert: fs.readFileSync(paths.cert),
  };

  if (paths.ca) {
    ensureFileExists(paths.ca, "SSL CA bundle");
    options.ca = fs.readFileSync(paths.ca);
  }

  return options;
}

async function main() {
  const dev = process.env.NODE_ENV !== "production";
  const hostname = process.env.HOST ?? "0.0.0.0";
  const port = Number.parseInt(process.env.PORT ?? "3000", 10);

  const certPaths = resolveCertPaths();
  const httpsOptions = readCertFiles(certPaths);

  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();
  const handleUpgrade = app.getUpgradeHandler();

  await app.prepare();

  const server = https.createServer(httpsOptions, (req, res) => {
    handle(req, res).catch((error) => {
      console.error("Unhandled error while processing request:", error);
      res.statusCode = 500;
      res.end("Internal Server Error");
    });
  });

  server.on("upgrade", (req, socket, head) => {
    handleUpgrade(req, socket, head).catch((error) => {
      console.error("Unhandled error while upgrading connection:", error);
      const reason = error instanceof Error ? error : new Error(String(error));
      socket.destroy(reason);
    });
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on https://${hostname}:${port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
