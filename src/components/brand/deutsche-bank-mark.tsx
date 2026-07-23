import Image from "next/image";
import { cn } from "@/lib/utils";

/** Deutsche Bank mark from provided brand asset. */
export function DeutscheBankMark({
  className,
  title = "Deutsche Bank",
  size = 36,
}: {
  className?: string;
  title?: string;
  size?: number;
}) {
  return (
    <Image
      src="/brand/deutsche-bank-mark.png"
      alt={title}
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      priority
    />
  );
}
