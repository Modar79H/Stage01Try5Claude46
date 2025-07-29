"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Building2,
  Package,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  Brain,
  Sparkles,
  TrendingUp,
} from "lucide-react";

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      gradient: "from-blue-600 to-indigo-600",
    },
    {
      name: "Brands",
      href: "/brands",
      icon: Building2,
      gradient: "from-purple-600 to-pink-600",
    },
    {
      name: "Products",
      href: "/products",
      icon: Package,
      gradient: "from-green-600 to-emerald-600",
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      gradient: "from-orange-600 to-red-600",
    },
    {
      name: "AI Assistants",
      href: "/assistants",
      icon: Brain,
      gradient: "from-cyan-600 to-blue-600",
    },
  ];

  const bottomNavigation = [
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard" && pathname === "/") return true;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo Section */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            {!collapsed && (
              <span className="text-xl font-bold gradient-text">RevuIntel</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* User Section */}
        {user && (
          <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium">
                  {user.name?.[0] || user.email?.[0] || "U"}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {!collapsed && (
          <div className="px-4 py-4">
            <Button
              variant="gradient"
              size="sm"
              className="w-full"
              onClick={() => (window.location.href = "/brands/new")}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Brand
            </Button>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                isActive(item.href)
                  ? "bg-gradient-to-r text-white shadow-md"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                isActive(item.href) && item.gradient,
              )}
            >
              <item.icon
                className={cn(
                  "flex-shrink-0 h-5 w-5",
                  collapsed ? "mx-auto" : "mr-3",
                )}
              />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 space-y-1">
          {bottomNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                isActive(item.href)
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
              )}
            >
              <item.icon
                className={cn(
                  "flex-shrink-0 h-5 w-5",
                  collapsed ? "mx-auto" : "mr-3",
                )}
              />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          ))}

          <form action="/api/auth/signout" method="POST">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <LogOut
                className={cn(
                  "flex-shrink-0 h-5 w-5",
                  collapsed ? "mx-auto" : "mr-3",
                )}
              />
              {!collapsed && <span>Sign Out</span>}
            </Button>
          </form>
        </div>

        {/* Pro Badge */}
        {!collapsed && (
          <div className="p-4">
            <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
              <h3 className="font-medium mb-1">Pro Features</h3>
              <p className="text-xs opacity-90 mb-3">
                Unlock advanced AI analysis
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
