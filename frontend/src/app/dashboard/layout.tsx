"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Users, FileText, Camera, LogOut, LayoutDashboard, UserPlus, ClipboardList, Menu, X } from "lucide-react";
import { toast } from "sonner";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Attendance Register", href: "/dashboard/attendance", icon: ClipboardList },
  { name: "Scan Attendance", href: "/dashboard/attendance/scan", icon: Camera },
  { name: "Register Staff", href: "/dashboard/staff/register", icon: UserPlus },
  { name: "Staff Directory", href: "/dashboard/staff", icon: Users },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
    }
  }, [router]);

  // Close mobile sidebar drawer automatically on navigation changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    router.push("/");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 💻 Desktop Sidebar (hidden on mobile, fixed on desktop) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col fixed h-full z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
          <Camera className="w-6 h-6 text-primary mr-2" />
          <span className="text-xl font-bold text-gray-900">StaffCam</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-primary-foreground" : "text-gray-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-semibold text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* 📱 Mobile Sidebar Overlay Drawer (< 768px) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setIsSidebarOpen(false)}
          />
          {/* Sidebar Drawer Panel */}
          <aside className="relative flex w-64 max-w-xs bg-white flex-col h-full z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 shrink-0">
              <div className="flex items-center">
                <Camera className="w-6 h-6 text-primary mr-2" />
                <span className="text-xl font-bold text-gray-900">StaffCam</span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                title="Close Navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-primary-foreground" : "text-gray-400"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-100 shrink-0">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-sm font-semibold text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="mr-3 h-5 w-5 text-gray-400" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 min-h-screen flex flex-col min-w-0 w-full max-w-full overflow-x-hidden">
        {/* Header with hamburger menu toggle */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between md:justify-start px-6 md:px-8 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 focus:outline-none"
              title="Open Navigation"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-base md:text-xl font-bold text-gray-800 capitalize leading-none">
              {navigation.find((n) => n.href === pathname)?.name || "Dashboard"}
            </h1>
          </div>
          <div className="md:hidden flex items-center">
            <Camera className="w-5 h-5 text-primary mr-1" />
            <span className="text-sm font-bold text-gray-900">StaffCam</span>
          </div>
        </header>
        
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

