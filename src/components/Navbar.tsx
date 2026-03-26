"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignInButton, useAuth } from "@clerk/nextjs";
import { LayoutDashboard, Briefcase, Grid3X3, LineChart, User } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();

  const navItems = [
    { label: "Home", href: "/", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: "My Portfolio", href: "/portfolio", icon: <Briefcase className="w-4 h-4" /> },
    { label: "Heatmap", href: "/heatmap", icon: <Grid3X3 className="w-4 h-4" /> },
    { label: "Advanced Chart", href: "/advanced", icon: <LineChart className="w-4 h-4" /> },
    { label: "Account", href: "/account", icon: <User className="w-4 h-4" /> },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-xl tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <LineChart className="w-5 h-5 text-white" />
            </div>
            <span className="hidden sm:inline-block">StockTracker</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isLoaded ? (
            isSignedIn ? (
              <UserButton appearance={{ elements: { userButtonAvatarBox: "w-9 h-9" } }} />
            ) : (
                <SignInButton mode="modal">
                    <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                        Sign In
                    </button>
                </SignInButton>
            )
          ) : (
            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
          )}
        </div>
      </div>
    </nav>
  );
}
