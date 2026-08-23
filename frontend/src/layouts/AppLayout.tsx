import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import React from "react";
import { Outlet } from "react-router-dom";
import { ChevronDown, LogOut, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
export default function AppLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-semibold">Trade Blotter</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-40 p-1">
            <div className="w-full flex mt-2 px-4">
              <User />
              <span className="m-auto">{user?.username}</span>
            </div>
            <Separator />
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-destructive hover:bg-accent"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </PopoverContent>
        </Popover>
      </header>
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}
