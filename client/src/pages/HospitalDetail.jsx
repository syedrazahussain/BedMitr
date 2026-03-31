import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  Clock,
  ExternalLink,
  History,
  MapPin,
  Phone,
  Siren,
} from "lucide-react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import Spinner from "../components/ui/Spinner.jsx";

const FAV_KEY = "bedmitr_favorites";

function loadFavs() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function HospitalDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const favs = loadFavs();
    setSaved(favs.some((f) => String(f.id) === String(id)));
  }, [id]);

  const toggleSave = () => {
    const favs = loadFavs();
    const hid = Number(id);
    const h = data?.hospital;
    if (!h) return;
    let next;
    if (saved) {
      next = favs.filter((f) => f.id !== hid);
    } else {
      next = [...favs.filter((f) => f.id !== hid), { id: hid, name: h.name }];
    }
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
    setSaved(!saved);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: d } = await api.get(`/hospitals/${id}`);
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.message || "Not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    );
  }
  if (err || !data?.hospital) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-rose-300">{err || "Hospital not found"}</p>
        <Link to="/find" className="mt-6 inline-block text-aqua-400 hover:underline">
          Back to search
        </Link>
      </div>
    );
  }

  const h = data.hospital;
  const avail = Number(h.available_icu_beds);
  const total = Number(h.total_icu_beds);
  const critical = avail === 0;
  const freeRatio = total > 0 ? avail / total : 0;
  const occupiedPct = total > 0 ? Math.round((1 - freeRatio) * 100) : 0;
  const mapsUrl =
    h.latitude != null && h.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${h.name} ${h.city}`)}`;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <Link
        to="/find"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to live map
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl glass-strong border border-white/[0.1] overflow-hidden shadow-lift"
      >
        <div className="p-8 sm:p-10 bg-gradient-to-br from-aqua-600/15 via-transparent to-blue-900/10 border-b border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <h1 className="font-display text-3xl font-bold text-white">{h.name}</h1>
              <p className="mt-3 text-slate-400 flex items-start gap-2 max-w-xl">
                <MapPin className="h-5 w-5 shrink-0 text-aqua-500/70" />
                {h.address}, {h.city}
                {h.state ? `, ${h.state}` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                    critical
                      ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  }`}
                >
                  {critical ? "Critical now" : "Open capacity"}
                </span>
                {h.updated_at && (
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] text-slate-300 uppercase tracking-wider">
                    Last update: {new Date(h.updated_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs uppercase tracking-widest text-slate-500">Available ICU beds</p>
              <p
                className={`font-display text-5xl font-black ${
                  critical ? "text-rose-400" : "text-aqua-400"
                }`}
              >
                {avail}
              </p>
              <p className="text-slate-500 text-sm">
                of {total} total ICU capacity ({Math.round(freeRatio * 100)}% free)
              </p>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Occupied</span>
                  <span>{occupiedPct}%</span>
                </div>
                <div className="h-3 rounded-full bg-ink-900 border border-white/[0.06] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      critical
                        ? "bg-rose-500"
                        : "bg-gradient-to-r from-teal-500 to-aqua-400"
                    }`}
                    style={{ width: `${occupiedPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 items-center">
            {user?.role === "user" && (
              <button
                type="button"
                onClick={toggleSave}
                className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                  saved
                    ? "border-amber-400/50 bg-amber-500/10 text-amber-200"
                    : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                <Bookmark className={`h-4 w-4 ${saved ? "fill-amber-400 text-amber-400" : ""}`} />
                {saved ? "Saved to your dashboard" : "Save to dashboard"}
              </button>
            )}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-aqua-500 to-teal-600 px-5 py-2.5 text-sm font-bold text-ink-950 shadow-glow"
            >
              <ExternalLink className="h-4 w-4" /> Open directions
            </a>
            {h.emergency_line && (
              <a
                href={`tel:${String(h.emergency_line).replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white"
              >
                <Siren className="h-4 w-4 text-amber-400" /> Emergency: {h.emergency_line}
              </a>
            )}
            {h.phone && (
              <a
                href={`tel:${h.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm text-slate-300"
              >
                <Phone className="h-4 w-4" /> {h.phone}
              </a>
            )}
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="flex items-center gap-2 text-slate-200 font-display font-semibold mb-4">
            <History className="h-5 w-5 text-aqua-400" /> Recent availability changes
          </div>
          <p className="text-sm text-slate-500 mb-6">
            Each update is logged when hospital staff or administrators save a new count — helping audit ICU
            pressure over time.
          </p>
          {data.recentUpdates?.length ? (
            <ul className="space-y-3">
              {data.recentUpdates.map((row) => (
                <li
                  key={`${row.created_at}-${row.new_available}`}
                  className="rounded-xl border border-white/[0.06] bg-ink-900/50 px-4 py-3 flex flex-wrap items-center justify-between gap-2"
                >
                  <span className="text-slate-300">
                    <span className="text-slate-500">{row.previous_available}</span>
                    <span className="mx-2 text-slate-600">→</span>
                    <span className="font-semibold text-white">{row.new_available}</span>
                    {row.note && (
                      <span className="text-slate-500 text-sm ml-2">— {row.note}</span>
                    )}
                  </span>
                  <span className="text-xs text-slate-600 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(row.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">No history yet — updates will appear here after changes.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
