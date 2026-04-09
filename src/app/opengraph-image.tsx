import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "FOOTLINK";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

async function getLogoDataUrl() {
  const logo = await readFile(join(process.cwd(), "public", "footlink_logo.png"));

  return `data:image/png;base64,${logo.toString("base64")}`;
}

export default async function OpenGraphImage() {
  const logoSrc = await getLogoDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #f7faf7 0%, #eef4ef 100%)",
          color: "#112317",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 36,
            padding: "44px 56px",
            borderRadius: 40,
            background: "rgba(255,255,255,0.82)",
            boxShadow: "0 28px 80px rgba(10, 28, 16, 0.10)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt="FootLink logo"
            width={240}
            height={160}
            style={{
              objectFit: "contain",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 78,
              fontWeight: 800,
              letterSpacing: "0.18em",
            }}
          >
            FOOTLINK
          </div>
        </div>
      </div>
    ),
    size,
  );
}
