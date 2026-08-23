import { Card } from "@/components/ui/card";
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-[oklch(0.145_0_0)] p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,oklch(1_0_0/12%)_1px,transparent_1px)] bg-size-[28px_28px] mask-[radial-gradient(ellipse_60%_60%_at_50%_35%,black,transparent)]"
      />

      <div className="relative flex items-center gap-2 pb-8">
        <span className="flex size-7 items-center justify-center rounded-md bg-black font-heading text-sm font-semibold text-brand-foreground">
          T
        </span>
        {/* <span className="text-sm font-semibold tracking-wide text-white">
          Trade Blotter
        </span> */}
      </div>

      <Card className="relative w-full max-w-sm p-6">
        <Outlet />
      </Card>

      <p className="relative pt-8 text-xs text-white/30">POC</p>
    </div>
  );
}
