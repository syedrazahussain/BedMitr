import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Clock,
  HeartPulse,
  Route,
  ShieldCheck,
  Zap,
} from "lucide-react";
import api from "../api/client.js";
import Spinner from "../components/ui/Spinner.jsx";

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

export default function Home() {
  const [snapshot, setSnapshot] = useState([]);
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshotSyncAt, setSnapshotSyncAt] = useState(null);
  const [snapshotErr, setSnapshotErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    let intervalId;

    const load = async () => {
      setSnapshotLoading(true);
      setSnapshotErr("");
      try {
        const { data } = await api.get("/hospitals");
        if (cancelled) return;

        const list = data?.hospitals || [];
        const sorted = list
          .slice()
          .sort((a, b) => Number(b.available_icu_beds) - Number(a.available_icu_beds));

        const pickCrit = sorted.find((h) => Number(h.available_icu_beds) === 0);
        const top = [];
        if (sorted[0]) top.push(sorted[0]);
        if (sorted[1]) top.push(sorted[1]);
        if (pickCrit) top.push(pickCrit);

        const uniq = [];
        const seen = new Set();
        for (const h of top) {
          if (h && !seen.has(h.id)) {
            uniq.push(h);
            seen.add(h.id);
          }
        }
        for (const h of sorted) {
          if (uniq.length >= 3) break;
          if (!seen.has(h.id)) {
            uniq.push(h);
            seen.add(h.id);
          }
        }

        setSnapshot(uniq.slice(0, 3));

        const latestUpdatedAt = list.reduce((acc, h) => {
          const t = h.updated_at ? new Date(h.updated_at).getTime() : 0;
          return Math.max(acc, t);
        }, 0);

        setSnapshotSyncAt(latestUpdatedAt ? new Date(latestUpdatedAt).toISOString() : null);
      } catch (e) {
        if (!cancelled) setSnapshotErr(e.response?.data?.message || "Failed to load snapshot");
      } finally {
        if (!cancelled) setSnapshotLoading(false);
      }
    };

    load();
    intervalId = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-aqua-500/10 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32 relative">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-8 items-center">
            <div>
              <motion.p
                custom={0}
                initial="hidden"
                animate="show"
                variants={fade}
                className="inline-flex items-center gap-2 rounded-full border border-aqua-500/20 bg-aqua-500/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-aqua-300/90"
              >
                <Zap className="h-3.5 w-3.5" /> Live ICU intelligence
              </motion.p>
              <motion.h1
                custom={1}
                initial="hidden"
                animate="show"
                variants={fade}
                className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight"
              >
                Know <span className="text-gradient">before</span> you drive through{" "}
                <span className="text-slate-100">two hours of traffic.</span>
              </motion.h1>
              <motion.p
                custom={2}
                initial="hidden"
                animate="show"
                variants={fade}
                className="mt-6 text-lg text-slate-400 max-w-xl leading-relaxed"
              >
                Metropolitan emergencies lose minutes at the wrong hospital door. BedMitra surfaces{" "}
                <strong className="text-slate-200">real ICU availability</strong> — updated by hospital
                teams — so ambulances, families, and first responders route to a facility that can actually
                admit.
              </motion.p>
              <motion.div
                custom={3}
                initial="hidden"
                animate="show"
                variants={fade}
                className="mt-10 flex flex-wrap gap-4"
              >
                <Link
                  to="/find"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-aqua-500 to-teal-600 px-7 py-3.5 text-sm font-bold text-ink-950 shadow-glow hover:scale-[1.02] transition"
                >
                  Find ICU beds now <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-slate-200 hover:bg-white/10 transition"
                >
                  Create citizen account
                </Link>
              </motion.div>

              <motion.dl
                custom={4}
                initial="hidden"
                animate="show"
                variants={fade}
                className="mt-14 grid grid-cols-3 gap-6 border-t border-white/[0.08] pt-10"
              >
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-500">Cities</dt>
                  <dd className="mt-1 font-display text-2xl font-bold text-white">Hyderabad</dd>
                  <dd className="text-slate-500 text-sm">Bangalore & more</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-500">Updates</dt>
                  <dd className="mt-1 font-display text-2xl font-bold text-aqua-400">Live</dd>
                  <dd className="text-slate-500 text-sm">Staff-verified</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-500">Access</dt>
                  <dd className="mt-1 font-display text-2xl font-bold text-white">24/7</dd>
                  <dd className="text-slate-500 text-sm">Web dashboard</dd>
                </div>
              </motion.dl>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-aqua-500/20 via-transparent to-blue-600/10 blur-2xl" />
              <div className="relative rounded-3xl glass-strong p-6 sm:p-8 shadow-card border border-white/[0.1]">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-semibold text-slate-300">Live availability snapshot</span>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400/90">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    {snapshotLoading
                      ? "Syncing…"
                      : snapshotSyncAt
                        ? `Updated ${new Date(snapshotSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                        : "Synced"}
                  </span>
                </div>
                <div className="space-y-4">
                  {snapshotLoading ? (
                    <div className="py-6">
                      <div className="flex items-center gap-3 justify-center text-slate-400 text-sm">
                        <Spinner className="h-7 w-7" />
                        Loading live ICU signals…
                      </div>
                    </div>
                  ) : snapshotErr ? (
                    <div className="py-4 text-center text-rose-200 text-sm">{snapshotErr}</div>
                  ) : (
                    snapshot.map((row) => {
                      const avail = Number(row.available_icu_beds);
                      const total = Number(row.total_icu_beds);
                      const pctFree = total > 0 ? avail / total : 0;
                      const tone = avail === 0 ? "crit" : pctFree >= 0.25 ? "good" : "ok";
                      return (
                        <div
                          key={row.id}
                          className="flex items-center justify-between rounded-2xl bg-ink-900/80 border border-white/[0.06] px-4 py-3"
                        >
                          <div>
                            <p className="font-medium text-slate-100 text-sm">{row.name}</p>
                            <p className="text-xs text-slate-500">{row.city}</p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-display text-lg font-bold ${
                                tone === "crit"
                                  ? "text-rose-400"
                                  : tone === "good"
                                    ? "text-emerald-400"
                                    : "text-amber-300"
                              }`}
                            >
                              {avail}
                              <span className="text-slate-500 text-sm font-normal"> / {total}</span>
                            </p>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">ICU free</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="mt-6 text-xs text-slate-500 leading-relaxed">
                  Live snapshot from staff-updated hospital dashboards. Always confirm before routing.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-ink-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
              Why seconds matter on ring roads
            </h2>
            <p className="mt-4 text-slate-400">
              Heavy traffic turns a wrong hospital choice into a multi-hour detour. BedMitra aligns{" "}
              <strong className="text-slate-200">dispatch decisions</strong> with{" "}
              <strong className="text-slate-200">bed reality</strong> — not yesterday&apos;s spreadsheet.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: HeartPulse,
                title: "Admission-aware routing",
                desc: "Filter by city, search by name, and prioritize hospitals that still have ICU capacity.",
              },
              {
                icon: Clock,
                title: "Staff-driven updates",
                desc: "Hospital accounts push live counts when patients are admitted or transferred — auditable history.",
              },
              {
                icon: Route,
                title: "Maps-ready coordinates",
                desc: "Open precise directions in Google Maps from each hospital card — minimize guesswork at the wheel.",
              },
              {
                icon: ShieldCheck,
                title: "Role-based control",
                desc: "JWT auth: citizens browse, hospital staff update their facility, admins govern users and orgs.",
              },
              {
                icon: Activity,
                title: "Operational transparency",
                desc: "Recent change log per hospital so teams can reconcile ICU load with your command center.",
              },
              {
                icon: Zap,
                title: "Built to scale",
                desc: "Express + MySQL core designed for more metros, more hospitals, and more beds — same UX.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl glass p-6 hover:border-aqua-500/20 transition-colors"
              >
                <item.icon className="h-9 w-9 text-aqua-400/90 mb-4" />
                <h3 className="font-display font-semibold text-lg text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-br from-aqua-600/20 via-ink-850 to-blue-900/20 p-10 sm:p-14 text-center relative">
          <div className="absolute inset-0 bg-grid-fade bg-[length:32px_32px] opacity-40" />
          <div className="relative">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Hospitals: put your ICU truth on the map
            </h2>
            <p className="mt-4 text-slate-300 max-w-2xl mx-auto">
              Administrators onboard your facility, issue staff logins, and your control desk updates beds as
              cases evolve — no more silent full wards.
            </p>
            <Link
              to="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white text-ink-950 px-8 py-3.5 text-sm font-bold hover:bg-slate-100 transition"
            >
              Staff & admin sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
