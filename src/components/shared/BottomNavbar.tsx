"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Wallet, 
  User, 
  Trophy,
  LayoutDashboard
} from "lucide-react";
import { useSession } from "next-auth/react";

export function BottomNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Only show for players (or if role is user)
  const isPlayer = (session?.user as any)?.role === "user";
  const isAdmin = (session?.user as any)?.role === "admin" || (session?.user as any)?.role === "subadmin";

  // If not logged in, don't show
  if (!session) return null;

  const navItems = [
    {
      label: "Home",
      icon: Home,
      href: "/dashboard",
      active: pathname === "/dashboard"
    },
    {
      label: "Wallet",
      icon: Wallet,
      href: "/wallet",
      active: pathname === "/wallet"
    },
    {
      label: "Profile",
      icon: User,
      href: "/profile",
      active: pathname === "/profile"
    },
    {
      label: "Hall of Fame",
      icon: Trophy,
      href: "/hall-of-fame",
      active: pathname === "/hall-of-fame"
    }
  ];

  // If admin/subadmin, maybe show different items or just dashboard?
  // Let's stick to player experience for now as requested.
  if (isAdmin && !pathname.includes("view=player")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-[#050B14]/80 backdrop-blur-2xl border-t border-white/5" />
      
      {/* Safe Area Padding for iOS */}
      <div className="relative pb-safe pt-2 px-6 flex items-center justify-between h-20">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex flex-col items-center gap-1.5 transition-all duration-300"
            >
              <div className={`relative p-2 rounded-2xl transition-all duration-300 ${
                item.active 
                  ? "bg-indigo-500/20 text-indigo-400" 
                  : "text-slate-500 hover:text-slate-400"
              }`}>
                {item.active && (
                  <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full scale-150 animate-pulse" />
                )}
                <Icon className={`w-6 h-6 relative z-10 ${item.active ? "scale-110" : ""}`} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest transition-all ${
                item.active ? "text-white" : "text-slate-600"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
