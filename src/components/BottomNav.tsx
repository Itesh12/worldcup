"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Trophy, User, ShieldCheck } from "lucide-react";
import { useSession } from "next-auth/react";

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';

  const navItems = [
    { name: "Live", href: "/dashboard", icon: LayoutDashboard },
    { name: "Matches", href: "/matches", icon: Calendar },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Profile", href: "/profile", icon: User },
  ];

  // Add Admin tab if user is an admin
  if (isAdmin) {
    navItems.push({ name: "Admin", href: "/admin", icon: ShieldCheck });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#050B14]/80 backdrop-blur-xl border-t border-white/5 pb-safe">
      <div className={`grid h-16 ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.name === 'Admin' && pathname?.startsWith('/admin'));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 group"
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                    : "text-slate-500 group-hover:text-slate-400"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "animate-pulse-slow" : ""}`} />
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-widest transition-colors ${
                  isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-400"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
