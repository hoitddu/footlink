import { closeSync, existsSync, openSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const pidFile = path.join(rootDir, ".next-dev.pid");
const outLog = path.join(rootDir, ".next-dev.log");
const errLog = path.join(rootDir, ".next-dev.err.log");
const devPort = 3000;
const startupDelayMs = 1500;
const probeHosts = ["127.0.0.1", "::1"];

function isProcessRunning(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readTrackedPid() {
  if (!existsSync(pidFile)) {
    return null;
  }

  const rawPid = readFileSync(pidFile, "utf8").trim();
  const pid = Number.parseInt(rawPid, 10);

  return Number.isInteger(pid) ? pid : null;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function canConnect(port, host) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("error", (error) => {
      const errorCode = error && typeof error === "object" && "code" in error ? error.code : "";
      const offlineCodes = new Set(["ECONNREFUSED", "EHOSTUNREACH", "ENETUNREACH", "ETIMEDOUT", "EADDRNOTAVAIL"]);

      if (typeof errorCode === "string" && offlineCodes.has(errorCode)) {
        resolve(false);
        return;
      }

      reject(error);
    });

    socket.setTimeout(500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function ensurePortAvailable(port) {
  const results = await Promise.all(probeHosts.map((host) => canConnect(port, host)));

  if (results.some(Boolean)) {
    throw new Error(`Port ${port} already accepts local connections.`);
  }
}

function openLogFile(pathname) {
  try {
    return openSync(pathname, "a");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Could not open ${path.basename(pathname)}.`);
    console.error(message);
    process.exit(1);
  }
}

function closeIfOpen(fd) {
  if (typeof fd === "number") {
    closeSync(fd);
  }
}

const trackedPid = readTrackedPid();

if (trackedPid && isProcessRunning(trackedPid)) {
  console.log(`Detached dev server already running (PID ${trackedPid}).`);
  console.log("URL: http://localhost:3000");
  console.log("Stop it with: npm run dev:stop");
  process.exit(0);
}

if (existsSync(pidFile)) {
  unlinkSync(pidFile);
}

try {
  await ensurePortAvailable(devPort);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Port ${devPort} is already in use. Stop the existing server before running npm run dev:detached.`);
  console.error(message);
  process.exit(1);
}

const stdoutFd = openLogFile(outLog);
const stderrFd = openLogFile(errLog);

const command = process.platform === "win32" ? process.env.comspec ?? "C:\\Windows\\System32\\cmd.exe" : "npm";
const args = process.platform === "win32" ? ["/d", "/s", "/c", "npm run dev"] : ["run", "dev"];

let child;

try {
  child = spawn(command, args, {
    cwd: rootDir,
    detached: true,
    stdio: ["ignore", stdoutFd, stderrFd],
    windowsHide: true,
  });
} catch (error) {
  closeIfOpen(stdoutFd);
  closeIfOpen(stderrFd);
  const message = error instanceof Error ? error.message : String(error);
  console.error("Failed to spawn detached dev server.");
  console.error(message);
  process.exit(1);
}

closeIfOpen(stdoutFd);
closeIfOpen(stderrFd);

if (!child.pid) {
  console.error("Failed to start detached dev server.");
  process.exit(1);
}

writeFileSync(pidFile, `${child.pid}\n`, "utf8");
child.unref();

await wait(startupDelayMs);

if (!isProcessRunning(child.pid)) {
  if (existsSync(pidFile)) {
    unlinkSync(pidFile);
  }

  console.error("Detached dev server exited during startup. Check .next-dev.err.log for details.");
  process.exit(1);
}

console.log(`Detached dev server started (PID ${child.pid}).`);
console.log("URL: http://localhost:3000");
console.log("Logs: .next-dev.log / .next-dev.err.log");
console.log("Stop it with: npm run dev:stop");
