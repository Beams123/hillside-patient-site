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
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-brand-surface",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-full sm:h-[32.5rem]">
        <div
          className="ambient-sign-image absolute inset-0 -translate-y-0 bg-contain bg-top bg-no-repeat opacity-95 sm:-translate-y-[42px] sm:bg-cover sm:bg-repeat-x"
          style={{
            backgroundImage:
              "url('/hillside-sign-ambient-hero-v3.png')",
            backgroundPosition:
              "calc(100% - max(0px, calc((100vw - 80rem) / 2 - 1rem))) top",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_42%,rgba(14,14,12,0.68)_70%,#0e0e0c_88%,#0e0e0c_100%)]" />
      </div>
    </div>
  );
}
