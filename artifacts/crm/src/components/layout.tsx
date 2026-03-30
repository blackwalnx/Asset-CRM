import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-roles";
import { cn, getInitials } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Shield, 
  ClipboardList, 
  Send, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "./ui";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const { isAdmin, isContributor } = useUserRole();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, hide: isContributor },
    { name: "Contacts", href: "/contacts", icon: Users, hide: isContributor },
    { name: "Interactions", href: "/interactions", icon: MessageSquare, hide: isContributor },
    { name: "Submit Data", href: "/submit", icon: Send, hide: false },
    { name: "User Roles", href: "/admin", icon: Shield, hide: !isAdmin },
    { name: "Audit Log", href: "/audit", icon: ClipboardList, hide: !isAdmin },
  ].filter(item => !item.hide);

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1",
              isActive 
                ? "bg-primary text-primary-foreground" 
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-950 border-r border-zinc-800 fixed inset-y-0 z-20">
        <div className="p-6 flex items-center gap-3">
          <img 
            src={`${import.meta.env.BASE_URL}images/logo.png`} 
            alt="Logo" 
            className="w-8 h-8 opacity-90"
          />
          <h1 className="font-display font-bold text-lg text-zinc-100 tracking-tight">Think Tank CRM</h1>
        </div>
        <nav className="flex-1 px-4 py-2 overflow-y-auto">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-3 px-3 py-2">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300">
                {user?.firstName ? getInitials(`${user.firstName} ${user.lastName}`) : 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 mt-2"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log out
          </Button>
        </div>
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-16 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-6 h-6" />
          <h1 className="font-display font-bold text-zinc-100">CRM</h1>
        </div>
        <Button variant="ghost" size="icon" className="text-zinc-300" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-zinc-950 pt-16">
          <nav className="p-4">
            <NavLinks />
            <div className="mt-8 pt-4 border-t border-zinc-800">
              <Button variant="ghost" className="w-full justify-start text-zinc-400" onClick={() => logout()}>
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </Button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-10 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
