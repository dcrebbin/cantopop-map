import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createServer, type ServerOptions } from "vite";

interface CertPaths {
  key: string;
  cert: string;
  ca?: string;
}

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

function readCertFiles(paths: CertPaths): ServerOptions["https"] {
  ensureFileExists(paths.key, "SSL key");
  ensureFileExists(paths.cert, "SSL certificate");

  return {
    key: fs.readFileSync(paths.key),
    cert: fs.readFileSync(paths.cert),
    ...(paths.ca ? { ca: fs.readFileSync(paths.ca) } : {}),
  };
}

async function main() {
  const host = process.env.HOST ?? "0.0.0.0";
  const port = Number.parseInt(process.env.PORT ?? "3000", 10);
  const https = readCertFiles(resolveCertPaths());

  const server = await createServer({
    server: {
      host,
      port,
      https,
    },
  });

  await server.listen();
  server.printUrls();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
