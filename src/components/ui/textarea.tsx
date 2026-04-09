import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "surface-subcard flex min-h-28 w-full rounded-[1.15rem] px-4 py-3.5 text-[0.95rem] font-medium leading-6 text-[#162019] outline-none transition placeholder:text-[#7b867d] focus:bg-white/96 focus:ring-4 focus:ring-[#c7f36b]/18",
        className,
      )}
      {...props}
    />
  );
}
