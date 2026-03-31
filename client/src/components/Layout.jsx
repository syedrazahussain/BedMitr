import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Shield,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "./ui/Button.jsx";

const navClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? "text-aqua-400" : "text-slate-400 hover:text-white"
  }`;

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const dashLink =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "hospital"
        ? "/hospital-panel"
        : "/dashboard";

  const roleChip = (() => {
    if (!user) return null;
    if (user.role === "admin") {
      return { text: "Administrator", icon: ShieldCheck, className: "bg-violet-500/15 text-violet-200 border-violet-500/20" };
    }
    if (user.role === "hospital") {
      return { text: "Hospital staff", icon: Stethoscope, className: "bg-aqua-500/15 text-aqua-200 border-aqua-500/20" };
    }
    return { text: "Citizen", icon: Activity, className: "bg-emerald-500/15 text-emerald-200 border-emerald-500/20" };
  })();

  const RoleIcon = roleChip?.icon;

  return (
    <div className="min-h-screen flex flex-col bg-ink-950 bg-premium-mesh bg-[length:48px_48px]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-xl focus:bg-ink-900/90 focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:border focus:border-white/10"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-50 border-b border-white/[0.06] glass">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-aqua-500/20 to-cyan-500/10 border border-aqua-500/20 shadow-glow">
                <Activity className="h-5 w-5 text-aqua-400" />
              </span>
              <span className="font-display font-bold text-lg tracking-tight">
                Bed<span className="text-gradient">Mitra</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <NavLink to="/find" className={navClass}>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> Live ICU map
                </span>
              </NavLink>
              {user && (
                <NavLink to={dashLink} className={navClass}>
                  <span className="inline-flex items-center gap-1.5">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </span>
                </NavLink>
              )}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-xs text-slate-500 max-w-[140px] truncate">
                    {user.fullName}
                  </span>
                  {roleChip && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${roleChip.className}`}
                    >
                      {RoleIcon && <RoleIcon className="h-3 w-3" />}
                      {roleChip.text}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    className="px-4 py-2 text-sm font-medium"
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-slate-300 hover:text-white transition"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-aqua-600 to-teal-600 px-4 py-2 text-sm font-semibold text-ink-950 shadow-glow hover:opacity-95 transition"
                  >
                    <UserPlus className="h-4 w-4" /> Join
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              className="md:hidden p-2 rounded-lg border border-white/10 text-slate-300"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-white/[0.06] glass px-4 py-4 space-y-3"
          >
            <NavLink to="/find" className="block py-2 text-slate-200" onClick={() => setOpen(false)}>
              Live ICU map
            </NavLink>
            {user && (
              <NavLink to={dashLink} className="block py-2 text-slate-200" onClick={() => setOpen(false)}>
                Dashboard
              </NavLink>
            )}
            {user ? (
              <button
                type="button"
                className="w-full text-left py-2 text-red-300"
                onClick={() => {
                  logout();
                  setOpen(false);
                  navigate("/");
                }}
              >
                Sign out
              </button>
            ) : (
              <>
                <Link to="/login" className="block py-2" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
                <Link to="/register" className="block py-2 text-aqua-400" onClick={() => setOpen(false)}>
                  Create account
                </Link>
              </>
            )}
          </motion.div>
        )}
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-white/[0.06] mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Stethoscope className="h-4 w-4 text-aqua-500/60" />
            BedMitra — built for metropolitan emergency routing. Not a substitute for calling 108 / local EMS.
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" /> SYED RAZA HUSSAIN & TEAMS
            </span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
