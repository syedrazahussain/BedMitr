import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  BedDouble,
  ExternalLink,
  Filter,
  MapPin,
  Phone,
  Search,
  ArrowUpDown,
} from "lucide-react";
import api from "../api/client.js";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import Spinner from "../components/ui/Spinner.jsx";

export default function FindBeds() {
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState("recommended");
  const [hospitals, setHospitals] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const params = new URLSearchParams();
        if (city) params.set("city", city);
        if (q.trim()) params.set("q", q.trim());
        if (onlyAvailable) params.set("onlyAvailable", "true");
        const { data } = await api.get(`/hospitals?${params.toString()}`);
        if (!cancelled) {
          setHospitals(data.hospitals || []);
          setCities(data.cities || []);
        }
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.message || "Could not load hospitals");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [city, q, onlyAvailable]);

  const mapsUrl = (lat, lng, name) => {
    if (lat != null && lng != null) {
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
  };

  const displayHospitals = hospitals.slice().sort((a, b) => {
    const aAvail = Number(a.available_icu_beds);
    const bAvail = Number(b.available_icu_beds);
    const aTotal = Number(a.total_icu_beds);
    const bTotal = Number(b.total_icu_beds);
    const aRatio = aTotal > 0 ? aAvail / aTotal : 0;
    const bRatio = bTotal > 0 ? bAvail / bTotal : 0;

    if (sortBy === "mostFree") return bAvail - aAvail;
    if (sortBy === "mostCritical") return aAvail - bAvail;
    if (sortBy === "bestRatio") return bRatio - aRatio;
    // recommended: non-critical first, then by available, then ratio
    const aCritical = aAvail === 0;
    const bCritical = bAvail === 0;
    if (aCritical !== bCritical) return aCritical ? 1 : -1;
    if (bAvail !== aAvail) return bAvail - aAvail;
    return bRatio - aRatio;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">Live ICU availability</h1>
        <p className="mt-3 text-slate-400 text-lg">
          Filter by metro, search by hospital name, and route only to facilities that can still admit critical
          care patients.
        </p>
      </div>

      <div className="mt-10 rounded-2xl glass-strong p-4 sm:p-6 shadow-lift border border-white/[0.08]">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
            <div className="flex-1 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> City
              </span>
              <Select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-2"
              >
                <option value="">All metros</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block sm:col-span-2 lg:col-span-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Search className="h-3.5 w-3.5" /> Search
              </span>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Hospital name or area"
                className="mt-2"
              />
            </label>
              <label className="block lg:col-span-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <ArrowUpDown className="h-3.5 w-3.5" /> Sort
                </span>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="mt-2"
                >
                  <option value="recommended">Recommended</option>
                  <option value="mostFree">Most free ICU</option>
                  <option value="mostCritical">Most critical first</option>
                  <option value="bestRatio">Best availability ratio</option>
                </Select>
              </label>
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-900/60 px-4 py-3 h-[46px] self-end">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="rounded border-white/20 bg-ink-950 text-aqua-500 focus:ring-aqua-500/40"
              />
              <span className="text-sm text-slate-300 flex items-center gap-2">
                <Filter className="h-4 w-4 text-aqua-400" /> Only show hospitals with free ICU beds
              </span>
            </label>
          </div>
        </div>
      </div>

      {err && (
        <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {err}
        </div>
      )}

      <div className="mt-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {displayHospitals.map((h) => {
                const pct =
                  h.total_icu_beds > 0
                    ? Math.round((h.available_icu_beds / h.total_icu_beds) * 100)
                    : 0;
                const critical = h.available_icu_beds === 0;
                return (
                  <motion.article
                    layout
                    key={h.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`rounded-2xl border p-6 shadow-card transition ${
                      critical
                        ? "border-rose-500/25 bg-rose-950/20"
                        : "border-white/[0.08] glass hover:border-aqua-500/25"
                    }`}
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <h2 className="font-display text-lg font-bold text-white">{h.name}</h2>
                        <p className="text-sm text-slate-500 mt-1 flex items-start gap-1">
                          <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-slate-600" />
                          {h.address}, {h.city}
                          {h.state ? `, ${h.state}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`font-display text-3xl font-extrabold ${
                            critical ? "text-rose-400" : "text-aqua-400"
                          }`}
                        >
                          {h.available_icu_beds}
                        </p>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">ICU free</p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Capacity</span>
                        <span>
                          {h.available_icu_beds} / {h.total_icu_beds} ({pct}% free)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-ink-900 overflow-hidden border border-white/[0.06]">
                        <div
                          className={`h-full rounded-full transition-all ${
                            critical ? "bg-rose-500" : "bg-gradient-to-r from-aqua-600 to-teal-400"
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>

                    {critical && (
                      <div className="mt-4 flex items-center gap-2 text-rose-300/90 text-sm">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        No ICU beds reported available — call before diverting traffic here.
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-3">
                      <a
                        href={mapsUrl(h.latitude, h.longitude, `${h.name} ${h.city}`)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 px-4 py-2 text-xs font-semibold text-white border border-white/10"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Directions
                      </a>
                      {h.phone && (
                        <a
                          href={`tel:${h.phone.replace(/\s/g, "")}`}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-slate-300"
                        >
                          <Phone className="h-3.5 w-3.5 text-aqua-400" /> {h.phone}
                        </a>
                      )}
                      <Link
                        to={`/hospital/${h.id}`}
                        className="inline-flex items-center gap-2 rounded-full border border-aqua-500/30 bg-aqua-500/10 px-4 py-2 text-xs font-semibold text-aqua-200"
                      >
                        <BedDouble className="h-3.5 w-3.5" /> Details & history
                      </Link>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {!loading && hospitals.length === 0 && !err && (
          <p className="text-center text-slate-500 py-16">No hospitals match your filters.</p>
        )}
      </div>
    </div>
  );
}
