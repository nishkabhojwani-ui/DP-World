"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard",    label: "Dashboard" },
  { href: "/rotation",     label: "Rotation Planner" },
  { href: "/crew-changes", label: "Crew Changes" },
  { href: "/crew-pool",    label: "Crew Pool" },
  { href: "/compliance",   label: "Compliance" },
  { href: "/recruitment",  label: "Recruitment" },
  { href: "/vessels",      label: "Vessels" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col h-full" style={{ background: "#E8F1F8", borderRight: "1px solid #D1E0F0" }}>

      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid #D1E0F0" }}>
        <Image src="/logo.png" alt="DP World" width={200} height={60} style={{ maxWidth: "100%", height: "auto" }} />
      </div>

      {/* Nav section label */}
      <div className="px-5 pt-5 pb-2">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#003D7A" }}>Navigation</span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              style={active ? {
                background: "#003D7A",
                borderLeft: "3px solid #E5341A",
                color: "#fff",
              } : {
                borderLeft: "3px solid transparent",
                color: "#003D7A",
              }}
              className={`flex items-center px-3 py-2.5 rounded-r-md text-sm font-medium transition-all duration-150 ${!active ? "hover:bg-blue-100 hover:text-blue-900" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid #D1E0F0" }}>
        <div className="text-xs font-semibold" style={{ color: "#003D7A", letterSpacing: "0.04em" }}>FLEET OPS v1.0</div>
        <div className="text-xs mt-0.5" style={{ color: "#003D7A" }}>© 2025 DP World</div>
      </div>
    </aside>
  );
}
