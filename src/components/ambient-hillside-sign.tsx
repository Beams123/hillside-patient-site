import Image from "next/image";

import { cn } from "@/lib/utils";

type AmbientHillsideSignProps = {
  className?: string;
};

export function AmbientHillsideSign({
  className,
}: AmbientHillsideSignProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden bg-brand-surface",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[26.75rem] md:h-[32.5rem]">
        <Image
          src="/hillside-sign-ambient-hero-v3.png"
          alt=""
          width={2172}
          height={724}
          priority
          sizes="960px"
          className="absolute right-0 top-[6.75rem] h-80 w-auto max-w-none brightness-[1.45] md:hidden"
        />
        <div className="absolute inset-x-0 top-[6.75rem] h-80 bg-[linear-gradient(to_bottom,transparent_70%,rgba(14,14,12,0.68)_88%,#0e0e0c_100%)] md:hidden" />
        <div
          className="absolute inset-0 hidden -translate-y-[42px] bg-cover bg-repeat-x brightness-[1.1] md:block"
          style={{
            backgroundImage:
              "url('/hillside-sign-ambient-hero-v3.png')",
            backgroundPosition:
              "calc(100% - max(0px, calc((100vw - 80rem) / 2 - 1rem))) top",
          }}
        />
        <div className="absolute inset-0 hidden bg-[linear-gradient(to_bottom,transparent_42%,rgba(14,14,12,0.68)_70%,#0e0e0c_88%,#0e0e0c_100%)] md:block" />
      </div>
    </div>
  );
}
