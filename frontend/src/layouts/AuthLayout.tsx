import { Card } from "@/components/ui/card";
import React from "react";
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="flex min-h-svw items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-6">
        <Outlet />
      </Card>
    </div>
  );
}
