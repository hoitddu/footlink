import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const pidFile = path.join(rootDir, ".next-dev.pid");

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

if (!existsSync(pidFile)) {
  console.log("No detached dev server is currently tracked.");
  process.exit(0);
}

const rawPid = readFileSync(pidFile, "utf8").trim();
const pid = Number.parseInt(rawPid, 10);

if (!Number.isInteger(pid)) {
  unlinkSync(pidFile);
  console.log("Removed an invalid detached dev server pid file.");
  process.exit(0);
}

if (!isProcessRunning(pid)) {
  unlinkSync(pidFile);
  console.log("Tracked detached dev server is not running. Removed stale pid file.");
  process.exit(0);
}

if (process.platform === "win32") {
  const result = spawnSync("taskkill", ["/pid", String(pid), "/t", "/f"], {
    stdio: "inherit",
    windowsHide: true,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
} else {
  process.kill(-pid, "SIGTERM");
}

unlinkSync(pidFile);
console.log(`Stopped detached dev server (PID ${pid}).`);
