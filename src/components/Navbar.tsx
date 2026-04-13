"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { UserButton, SignInButton, useAuth } from "@clerk/nextjs";
import { LayoutDashboard, Briefcase, Grid3X3, LineChart, Menu, X, ChevronRight, Trophy, CalendarDays, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const navItems = [
    { label: "Home", href: "/", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: "World Macro", href: "/world-indices", icon: <Globe className="w-4 h-4" /> },
    { label: "My Portfolio", href: "/portfolio", icon: <Briefcase className="w-4 h-4" /> },
    { label: "Traders League", href: "/league", icon: <Trophy className="w-4 h-4" /> },
    { label: "Heatmap", href: "/heatmap", icon: <Grid3X3 className="w-4 h-4" /> },
    { label: "Advanced Chart", href: "/advanced", icon: <LineChart className="w-4 h-4" /> },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
      isMobileMenuOpen 
        ? "bg-background shadow-lg" 
        : "bg-background/80 backdrop-blur-md"
    }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-8 overflow-hidden">
          <Link href="/" className="font-bold text-lg md:text-xl tracking-tighter flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <LineChart className="w-5 h-5 text-white" />
            </div>
            <span className="inline-block">StockTracker</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/100 hover:text-foreground"
                    }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {isLoaded ? (
            isSignedIn ? (
              <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 md:w-9 md:h-9" } }} />
            ) : (
              <SignInButton mode="modal">
                <Button variant="default" size="sm" className="rounded-lg h-8 md:h-9 px-3 md:px-4 text-xs md:text-sm">
                  Sign In
                </Button>
              </SignInButton>
            )
          ) : (
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-muted animate-pulse" />
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 md:hidden bg-white dark:bg-[#0a0a0a] border-t border-border shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col p-6 gap-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Navigation
            </div>
            {navItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between p-4 rounded-xl text-base font-semibold transition-all bg-muted/90 border border-border shadow-sm ${active
                    ? "text-primary border-primary/40 ring-1 ring-primary/20"
                    : "text-foreground hover:bg-muted/100"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${active ? "text-primary" : "text-muted-foreground"}`}>
                      {item.icon}
                    </div>
                    {item.label}
                  </div>
                  <ChevronRight className={`w-4 h-4 opacity-50 ${active ? "text-primary" : ""}`} />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
