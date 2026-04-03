import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-[1.4rem] bg-[#eef2ee] px-4 py-3 text-sm font-medium text-foreground outline-none transition placeholder:text-muted focus:bg-white focus:ring-4 focus:ring-[#b8ff5a]/25",
        className,
      )}
      {...props}
    />
  );
}
