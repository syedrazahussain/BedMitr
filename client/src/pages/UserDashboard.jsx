import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Bell, Bookmark, Clock, MapPin, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client.js";
import Spinner from "../components/ui/Spinner.jsx";

const FAV_KEY = "bedmitr_favorites";
const ALERT_THRESH_KEY = "bedmitra_alert_thresholds";
const ALERT_PREV_KEY = "bedmitra_alert_prev_avail";

function loadFavs() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadThresholds() {
  try {
    const raw = localStorage.getItem(ALERT_THRESH_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadPrevAvail() {
  try {
    const raw = localStorage.getItem(ALERT_PREV_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [snapshot, setSnapshot] = useState({ hospitals: [], cities: [] });
  const [snapshotLoaded, setSnapshotLoaded] = useState(false);
  const [alertThresholds, setAlertThresholds] = useState(() => loadThresholds());
  const [alerts, setAlerts] = useState([]);
  const [watchHistory, setWatchHistory] = useState({});
  const [watchHistoryLoading, setWatchHistoryLoading] = useState(false);

  useEffect(() => {
    setFavorites(loadFavs());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/hospitals");
        if (!cancelled) setSnapshot({ hospitals: data.hospitals || [], cities: data.cities || [] });
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setSnapshotLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!snapshotLoaded) return;
    if (!favorites.length) {
      setAlerts([]);
      return;
    }

    const prev = loadPrevAvail();
    const nextPrev = { ...prev };
    const thresholdMap = loadThresholds();

    const nextAlerts = [];
    for (const f of favorites) {
      const live = snapshot.hospitals.find((h) => h.id === f.id);
      if (!live) continue;

      const thr = Number(thresholdMap[f.id] ?? 1);
      const prevAvailable = prev[String(f.id)];
      const currentAvailable = Number(live.available_icu_beds);

      if (typeof prevAvailable === "number" && prevAvailable < thr && currentAvailable >= thr) {
        nextAlerts.push({
          hospitalId: f.id,
          hospitalName: f.name,
          previous: prevAvailable,
          current: currentAvailable,
          threshold: thr,
        });
      }

      nextPrev[String(f.id)] = currentAvailable;
    }

    localStorage.setItem(ALERT_PREV_KEY, JSON.stringify(nextPrev));
    setAlerts(nextAlerts.slice(0, 3));
  }, [snapshotLoaded, favorites, snapshot]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!favorites.length) {
        setWatchHistory({});
        setWatchHistoryLoading(false);
        return;
      }

      const ids = favorites.slice(0, 3).map((f) => f.id);
      setWatchHistoryLoading(true);
      try {
        const results = await Promise.all(ids.map((id) => api.get(`/hospitals/${id}`)));
        if (cancelled) return;

        const map = {};
        results.forEach((r, idx) => {
          map[ids[idx]] = r.data.recentUpdates || [];
        });
        setWatchHistory(map);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setWatchHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [favorites]);

  const removeFav = (id) => {
    const next = favorites.filter((f) => f.id !== id);
    setFavorites(next);
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
  };

  const setAlertThreshold = (hospitalId, value) => {
    const next = { ...alertThresholds, [hospitalId]: value };
    setAlertThresholds(next);
    localStorage.setItem(ALERT_THRESH_KEY, JSON.stringify(next));
  };

  const favDetails = favorites
    .map((f) => {
      const live = snapshot.hospitals.find((h) => h.id === f.id);
      return live ? { ...live, savedName: f.name } : null;
    })
    .filter(Boolean);

  const withBeds = snapshot.hospitals.filter((h) => h.available_icu_beds > 0).length;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-aqua-400/80">Citizen</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-white">
            Hello, {user?.fullName?.split(" ")[0] || "there"}
          </h1>
          <p className="mt-2 text-slate-400 max-w-xl">
            Your dashboard keeps watch on hospitals you care about — with live counts refreshed from the
            network whenever you open BedMitra.
          </p>
        </div>
        <Link
          to="/find"
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-aqua-500 to-teal-600 px-6 py-3 text-sm font-bold text-ink-950 shadow-glow shrink-0"
        >
          Open live ICU map
        </Link>
      </div>

      <div className="mt-10 grid sm:grid-cols-3 gap-4">
        {[
          { label: "Metros in directory", value: snapshot.cities?.length || "—" },
          { label: "Hospitals with free ICU", value: withBeds },
          { label: "Saved hospitals", value: favorites.length },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl glass border border-white/[0.08] p-5"
          >
            <p className="text-xs uppercase tracking-wider text-slate-500">{s.label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-white">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {alerts.length > 0 && (
        <div className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6">
          <div className="flex items-center gap-2 text-emerald-200 font-display font-semibold">
            <Bell className="h-4 w-4" /> Availability alerts
          </div>
          <ul className="mt-4 space-y-2">
            {alerts.map((a) => (
              <li key={a.hospitalId} className="text-sm text-emerald-100">
                {a.hospitalName}: {a.previous} → {a.current} ICU free (threshold {a.threshold})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 rounded-3xl glass-strong border border-white/[0.08] p-6 sm:p-8">
        <div className="flex items-center gap-2 text-white font-display font-semibold text-lg">
          <Activity className="h-5 w-5 text-aqua-400" /> Watchlist premium feed
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Latest bed availability changes for up to 3 of your saved hospitals.
        </p>

        {watchHistoryLoading ? (
          <div className="mt-6 flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            {favDetails.slice(0, 3).map((h) => {
              const latest = (watchHistory[h.id] || [])[0];
              const isCritical = latest && Number(latest.new_available) === 0;
              return (
                <div
                  key={h.id}
                  className="rounded-2xl border border-white/[0.08] bg-ink-900/50 px-4 py-4"
                >
                  <div className="text-white font-medium">{h.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{h.city}</div>

                  <div className="mt-3">
                    {latest ? (
                      <>
                        <div className={`font-display font-bold ${isCritical ? "text-rose-400" : "text-aqua-400"}`}>
                          {latest.previous_available} → {latest.new_available} ICU free
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(latest.created_at).toLocaleString()}
                        </div>
                        {latest.note && (
                          <div className="text-xs text-slate-500 mt-2 line-clamp-2">{latest.note}</div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-slate-500 mt-1">No updates yet.</div>
                    )}
                  </div>

                  <Link to={`/hospital/${h.id}`} className="mt-4 inline-block text-xs font-semibold text-aqua-300 hover:underline">
                    View details
                  </Link>
                </div>
              );
            })}
            {favDetails.length === 0 && (
              <div className="text-sm text-slate-500 sm:col-span-3">No saved hospitals yet.</div>
            )}
          </div>
        )}
      </div>

      <div className="mt-12 rounded-3xl glass-strong border border-white/[0.08] p-6 sm:p-8">
        <div className="flex items-center gap-2 text-white font-display font-semibold text-lg">
          <Bookmark className="h-5 w-5 text-aqua-400" /> Saved hospitals
        </div>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          Save hospitals from any detail page while signed in as a citizen. Counts refresh when you open this
          dashboard. Removing an entry updates this device only.
        </p>

        {favDetails.length === 0 ? (
          <p className="text-slate-500 text-sm py-8 text-center border border-dashed border-white/10 rounded-2xl">
            No saved hospitals yet. Visit{" "}
            <Link to="/find" className="text-aqua-400 hover:underline">
              Live ICU map
            </Link>{" "}
            and bookmark facilities you rely on.
          </p>
        ) : (
          <ul className="space-y-3">
            {favDetails.map((h) => (
              <li
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink-900/60 border border-white/[0.06] px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">{h.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" /> {h.city}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-display text-xl font-bold text-aqua-400">{h.available_icu_beds}</p>
                    <p className="text-[10px] text-slate-500 uppercase">ICU free</p>

                    {h.total_icu_beds > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] text-slate-600 uppercase tracking-wider">Alert when &gt;=</p>
                        {(() => {
                          const thr = Number(alertThresholds[h.id] ?? 1);
                          const options = Array.from(new Set([1, 2, 5, 10, Number(h.total_icu_beds)])).filter(
                            (o) => o <= Number(h.total_icu_beds) && o >= 1
                          );
                          return (
                            <select
                              value={thr}
                              onChange={(e) => setAlertThreshold(h.id, Number(e.target.value))}
                              className="mt-1 rounded-lg bg-ink-950/40 border border-white/10 px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-aqua-500/40"
                            >
                              {options.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <Link
                    to={`/hospital/${h.id}`}
                    className="text-xs font-semibold text-aqua-300 hover:underline"
                  >
                    Details
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeFav(h.id)}
                    className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-rose-300"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
