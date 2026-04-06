/* eslint-disable @next/next/no-img-element */
export default function RootLoading() {
  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-[#08110b]">
      {/* Background image — use plain img to avoid client JS dependency */}
      <img
        src="/landing-bg.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-55"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,16,11,0.45)_0%,rgba(6,16,11,0.9)_100%)]" />

      {/* Content */}
      <main className="relative z-10 flex flex-1 flex-col justify-between px-6 pb-10 pt-8 text-white">
        {/* Top: brand */}
        <div className="flex items-center">
          <span className="text-lg font-bold tracking-[0.18em]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            FOOTLINK
          </span>
        </div>

        {/* Bottom: tagline */}
        <div className="pb-14">
          <div className="space-y-3">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b8ff5a]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              SUWON PILOT
            </p>
            <h1 className="text-[3.8rem] font-bold leading-[0.92] tracking-[-0.08em]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Connect.
              <br />
              Play.
              <br />
              Repeat.
            </h1>
          </div>
        </div>
      </main>

      {/* CTA placeholder (shimmer while loading) */}
      <div className="relative z-10 px-6 pb-12">
        <div className="flex min-h-[6.6rem] w-full items-center justify-center rounded-[1.2rem] bg-[#112317]/80">
          <span
            className="block whitespace-nowrap text-center text-[1.95rem] font-black leading-none tracking-[-0.03em] text-white/40 [transform:skewX(-12deg)]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Let&apos;s hit the pitch!
          </span>
        </div>
      </div>
    </div>
  );
}
