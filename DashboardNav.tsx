import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import {
  LayoutDashboard,
  Search,
  Bell,
  LogOut,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analysis", label: "Analysis", icon: Search },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

export default function DashboardNav() {
  const [location] = useLocation();
  const { logout, user } = useUser();
  const [open, setOpen] = useState(false);

  const NavContent = () => (
    <>
      <div className="flex flex-col gap-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Button
              variant={location === href ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setOpen(false)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          </Link>
        ))}
      </div>
      <div className="mt-auto pt-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <div className="flex flex-col h-full py-4">
              <NavContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex flex-col h-full w-64 p-4 border-r">
        <NavContent />
      </div>
    </>
  );
}
