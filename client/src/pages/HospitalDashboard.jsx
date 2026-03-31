import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  History,
  Save,
  Stethoscope,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client.js";
import Spinner from "../components/ui/Spinner.jsx";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import Textarea from "../components/ui/Textarea.jsx";

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [hospital, setHospital] = useState(null);
  const [available, setAvailable] = useState(0);
  const [reason, setReason] = useState("admission");
  const [note, setNote] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [err, setErr] = useState("");

  const hid = user?.hospitalId;

  useEffect(() => {
    if (!hid) {
      setLoading(false);
      setErr("No hospital is linked to your account. Contact your administrator.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/hospitals/${hid}`);
        if (!cancelled && data.hospital) {
          setHospital(data.hospital);
          setAvailable(data.hospital.available_icu_beds);
          setHistory(data.recentUpdates || []);
        }
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.message || "Could not load hospital");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hid]);

  const onSave = async (e) => {
    e.preventDefault();
    if (!hid) return;
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const trimmed = note.trim();
      const reasonLabel =
        reason === "admission"
          ? "Admission"
          : reason === "transfer"
            ? "Transfer"
            : reason === "discharge"
              ? "Discharge"
              : "Other";
      const composedNote =
        reason === "other"
          ? trimmed || undefined
          : trimmed
            ? `${reasonLabel}: ${trimmed}`
            : reasonLabel;

      const { data } = await api.patch(`/hospitals/${hid}/beds`, {
        availableIcuBeds: Number(available),
        note: composedNote || undefined,
      });
      setHospital(data.hospital);
      setAvailable(data.hospital.available_icu_beds);
      setNote("");
      setMsg({ type: "ok", text: data.message || "Updated successfully" });
    } catch (ex) {
      setMsg({
        type: "err",
        text: ex.response?.data?.message || "Update failed",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    );
  }

  if (err || !hospital) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <AlertCircle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
        <p className="text-rose-200">{err || "Hospital not found"}</p>
      </div>
    );
  }

  const pct =
    hospital.total_icu_beds > 0
      ? Math.round((hospital.available_icu_beds / hospital.total_icu_beds) * 100)
      : 0;

  const chartData = history
    .slice()
    .reverse()
    .map((row) => ({
      when: new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      available: Number(row.new_available),
    }));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-400/90">Hospital ICU desk</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-aqua-400" />
            {hospital.name}
          </h1>
          <p className="text-slate-500 mt-1">{hospital.city}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Activity className="h-4 w-4 text-emerald-400" />
          Logged in as {user?.fullName}
        </div>
      </div>

      <div className="mt-10 grid lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 rounded-3xl glass-strong border border-white/[0.1] p-8 shadow-lift relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-aqua-500/10 blur-3xl rounded-full" />
          <p className="text-sm text-slate-400">Current available ICU beds</p>
          <p className="mt-4 font-display text-7xl font-black text-gradient leading-none">
            {hospital.available_icu_beds}
          </p>
          <p className="mt-2 text-slate-500 text-sm">
            of <span className="text-slate-300 font-semibold">{hospital.total_icu_beds}</span> total capacity
          </p>
          <div className="mt-8">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Utilization</span>
              <span>{100 - pct}% occupied</span>
            </div>
            <div className="h-3 rounded-full bg-ink-900 border border-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-aqua-400"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-3 rounded-3xl glass border border-white/[0.08] p-6 sm:p-8"
        >
          <h2 className="font-display font-semibold text-lg text-white">Update live availability</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            When admissions, transfers, or discharges change your ICU census, push the new count immediately
            so ambulances and families see accurate routing.
          </p>

          <form onSubmit={onSave} className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Available ICU beds
              </label>
                  <Input
                type="number"
                min={0}
                max={hospital.total_icu_beds}
                value={available}
                onChange={(e) => setAvailable(Number(e.target.value))}
                    className="mt-2 max-w-xs text-2xl font-display font-bold"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { label: "Critical", value: 0, tone: "rose" },
                  {
                    label: "Mid",
                    value: Math.floor(hospital.total_icu_beds / 2),
                    tone: "amber",
                  },
                  { label: "Max", value: hospital.total_icu_beds, tone: "aqua" },
                ].map((x) => (
                  <button
                    key={x.label}
                    type="button"
                    onClick={() => setAvailable(Number(x.value))}
                    className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold transition ${
                      x.tone === "rose"
                        ? "border-rose-500/25 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15"
                        : x.tone === "amber"
                          ? "border-amber-500/25 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15"
                          : "border-aqua-500/25 bg-aqua-500/10 text-aqua-200 hover:bg-aqua-500/15"
                    }`}
                  >
                    {x.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Update reason
                  </label>
                  <Select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-2"
                  >
                    <option value="admission">Admission</option>
                    <option value="transfer">Transfer</option>
                    <option value="discharge">Discharge</option>
                    <option value="other">Other</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Internal note (optional)
                  </label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. 3 post-ops pending step-down"
                    className="mt-2"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {msg.text && (
              <div
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
                  msg.type === "ok"
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border border-rose-500/30 bg-rose-500/10 text-rose-200"
                }`}
              >
                {msg.type === "ok" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                {msg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-aqua-500 to-teal-600 px-8 py-3 text-sm font-bold text-ink-950 shadow-glow disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Publish update"}
            </button>
          </form>
        </motion.div>
      </div>

      <div className="mt-10 rounded-3xl glass-strong border border-white/[0.08] p-6 sm:p-8">
        <div className="flex items-center gap-2 text-white font-display font-semibold text-lg">
          <History className="h-5 w-5 text-aqua-400" /> Bed update history
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Audited availability changes from your recent updates.
        </p>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/[0.08] bg-ink-900/50 p-4">
            {history.length ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Trend</span>
                  <span className="text-xs text-slate-500">
                    Max {hospital.total_icu_beds}
                  </span>
                </div>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.06)"
                      />
                      <XAxis dataKey="when" tick={{ fill: "#64748b", fontSize: 11 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#0f1729",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                        }}
                        labelStyle={{ color: "#e2e8f0" }}
                      />
                      <Line type="monotone" dataKey="available" stroke="#2dd4bf" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500 py-10 text-center">No history yet.</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-ink-900/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-aqua-400" />
              <span className="text-xs text-slate-500 uppercase tracking-wider">Latest updates</span>
            </div>

            {history.length ? (
              <ul className="space-y-3">
                {history.slice(0, 8).map((row) => (
                  <li
                    key={row.id}
                    className="rounded-xl border border-white/[0.06] bg-ink-900/60 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div
                          className={`font-display font-bold ${
                            Number(row.new_available) === 0 ? "text-rose-400" : "text-aqua-400"
                          }`}
                        >
                          {row.previous_available} → {row.new_available} ICU free
                        </div>
                        {row.note && (
                          <div className="text-xs text-slate-500 mt-1 line-clamp-2">{row.note}</div>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 whitespace-nowrap">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(row.created_at).toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 py-10 text-center">No updates yet.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
