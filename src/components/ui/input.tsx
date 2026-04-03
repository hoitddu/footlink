import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-12 w-full rounded-2xl bg-[#eef2ee] px-4 text-sm font-medium text-foreground outline-none transition placeholder:text-muted focus:bg-white focus:ring-4 focus:ring-[#b8ff5a]/25",
        className,
      )}
      {...props}
    />
  );
}
