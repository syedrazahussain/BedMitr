import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Hospital, Lock, Mail, Shield, User } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [preferredRole, setPreferredRole] = useState(null);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectFor = (role) => {
    if (from) return from;
    if (role === "admin") return "/admin";
    if (role === "hospital") return "/hospital-panel";
    return "/dashboard";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (preferredRole && user.role !== preferredRole) {
        // Avoid landing user in the wrong dashboard based on a wrong portal selection.
        logout();
        setErr(
          `This account is for ${user.role} users. Please sign in via the ${user.role} portal.`
        );
        return;
      }
      navigate(redirectFor(user.role), { replace: true });
    } catch (ex) {
      setErr(ex.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl glass-strong border border-white/[0.1] p-8 shadow-lift"
      >
        <h1 className="font-display text-2xl font-bold text-white text-center">Welcome back</h1>
        <p className="text-sm text-slate-500 text-center mt-2">
          Hospital coordinators, admins, and citizens — sign in with your BedMitra account.
        </p>

        <div className="mt-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Sign in as
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "user", label: "Citizen", Icon: User, hint: "Watch availability + save favorites." },
              {
                id: "hospital",
                label: "Hospital",
                Icon: Hospital,
                hint: "Update your ICU bed count + audit history.",
              },
              {
                id: "admin",
                label: "Admin",
                Icon: Shield,
                hint: "Manage hospitals, users, and analytics.",
              },
            ].map(({ id, label, Icon, hint }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPreferredRole(id)}
                className={`rounded-2xl border px-3 py-3 text-left transition ${
                  preferredRole === id
                    ? "border-aqua-500/40 bg-aqua-500/10"
                    : "border-white/[0.10] bg-white/[0.03] hover:bg-white/5"
                }`}
                aria-pressed={preferredRole === id}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-aqua-400" />
                  <span className="text-sm font-semibold text-white">{label}</span>
                </div>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">{hint}</p>
              </button>
            ))}
          </div>

          {preferredRole === "hospital" && (
            <div className="mt-4 rounded-xl border border-aqua-500/20 bg-aqua-500/5 px-4 py-3 text-sm text-slate-200">
              Use your hospital staff email. If you can’t access the hospital panel, ask your administrator
              to link your account to a facility.
            </div>
          )}
        </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</label>
            <div className="mt-2 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
            <div className="mt-2 relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-14"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {err && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {err}
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full" variant="primary">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{" "}
          <Link to="/register" className="text-aqua-400 font-medium hover:underline">
            Create a citizen account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
