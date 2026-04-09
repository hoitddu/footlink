import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "surface-subcard flex h-[3.05rem] min-w-0 w-full rounded-[1rem] px-4 text-[0.96rem] font-semibold tracking-[-0.02em] text-[#162019] outline-none transition placeholder:text-[#7b867d] focus:bg-white/96 focus:ring-4 focus:ring-[#c7f36b]/18",
        className,
      )}
      {...props}
    />
  );
}
