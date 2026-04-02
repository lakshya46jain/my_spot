import { Link, useLocation } from "@tanstack/react-router";
import {
  Home,
  User,
  Compass,
  Heart,
  PlusCircle,
  Shield,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";

const baseNavItems = [
  { to: "/explore", icon: Home, label: "Home", access: "all" as const },
  { to: "/profile", icon: User, label: "Profile", access: "authenticated" as const },
  { to: "/favorites", icon: Heart, label: "Favorites", access: "all" as const },
  { to: "/add-spot", icon: PlusCircle, label: "Add Spot", access: "all" as const },
  { to: "/admin", icon: Shield, label: "Admin", access: "authenticated" as const },
];

export function FloatingRightNav() {
  const location = useLocation();
  const { isLoggedIn, isGuest, logout } = useAuth();

  // Filter nav items based on role
  const navItems = baseNavItems.filter((item) => {
    if (item.access === "authenticated" && !isLoggedIn) return false;
    return true;
  });

  return (
    <TooltipProvider delayDuration={200}>
      <nav className="fixed right-4 top-1/2 -translate-y-1/2 z-50">
        <div className="flex flex-col gap-1.5 rounded-2xl bg-card/95 backdrop-blur-md border border-border p-2 shadow-xl">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-warm-100 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="left" className="rounded-lg">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* Logout / Back to Landing */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/"
                onClick={() => {
                  // Database implementation required here — clear session/tokens on logout
                  logout();
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 text-muted-foreground hover:bg-warm-100 hover:text-foreground"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="left" className="rounded-lg">
              {isGuest ? "Exit Guest Mode" : "Sign Out"}
            </TooltipContent>
          </Tooltip>
        </div>
      </nav>
    </TooltipProvider>
  );
}
