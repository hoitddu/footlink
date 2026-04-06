export default function RootLoading() {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col items-center justify-center bg-[#08110b]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#112317]">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#b8ff5a"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <span className="text-lg font-bold tracking-[0.18em] text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          FOOTLINK
        </span>
      </div>
    </div>
  );
}
