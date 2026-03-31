import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Building2,
  Clock,
  Download,
  Plus,
  Shield,
  Search,
  UserPlus,
  Users,
  X,
  Pencil,
  Power,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/client.js";
import Spinner from "../components/ui/Spinner.jsx";

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [byCity, setByCity] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [users, setUsers] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [hospitalOptions, setHospitalOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [editHospital, setEditHospital] = useState(null);
  const [hForm, setHForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    emailContact: "",
    emergencyLine: "",
    totalIcuBeds: 50,
    availableIcuBeds: 10,
    latitude: "",
    longitude: "",
    isActive: true,
  });

  const [showUserModal, setShowUserModal] = useState(false);
  const [uForm, setUForm] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "user",
    hospitalId: "",
  });
  const [formErr, setFormErr] = useState("");

  // Premium table controls (search + active filters)
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [hospitalActiveOnly, setHospitalActiveOnly] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [userActiveOnly, setUserActiveOnly] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, hList, uList, hOpt, activity, citiesRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/hospitals"),
        api.get("/admin/users"),
        api.get("/admin/hospitals-list"),
        api.get("/admin/recent-updates?limit=25"),
        api.get("/hospitals/cities"),
      ]);
      setStats(s.data.stats);
      setByCity(s.data.byCity || []);
      setHospitals(hList.data.hospitals || []);
      setUsers(uList.data.users || []);
      setHospitalOptions(hOpt.data.hospitals || []);
      setRecentUpdates(activity.data.updates || []);
      setCityOptions(citiesRes.data.cities || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const chartData = byCity.map((r) => ({
    city: r.city,
    available: Number(r.available),
    total: Number(r.total),
  }));

  const downloadCsv = (filename, rows, headers) => {
    // Minimal, safe CSV (UTF-8) export for admin convenience.
    const escape = (v) => {
      const s = v == null ? "" : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const headerLine = headers.map((h) => escape(h.label)).join(",");
    const bodyLines = rows.map((r) => headers.map((h) => escape(h.value(r))).join(","));
    const csv = [headerLine, ...bodyLines].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredHospitals = hospitals.filter((h) => {
    const hs = hospitalSearch.trim().toLowerCase();
    const matchesSearch =
      !hs ||
      String(h.name).toLowerCase().includes(hs) ||
      String(h.city).toLowerCase().includes(hs);
    const matchesActive = hospitalActiveOnly ? Boolean(h.is_active) : true;
    return matchesSearch && matchesActive;
  });

  const filteredUsers = users.filter((u) => {
    const us = userSearch.trim().toLowerCase();
    const matchesSearch =
      !us ||
      String(u.full_name).toLowerCase().includes(us) ||
      String(u.email).toLowerCase().includes(us) ||
      String(u.role).toLowerCase().includes(us) ||
      String(u.hospital_name || "").toLowerCase().includes(us);
    const matchesActive = userActiveOnly ? Boolean(u.is_active) : true;
    return matchesSearch && matchesActive;
  });

  const openNewHospital = () => {
    setEditHospital(null);
    setHForm({
      name: "",
      address: "",
      city: "",
      state: "",
      phone: "",
      emailContact: "",
      emergencyLine: "",
      totalIcuBeds: 50,
      availableIcuBeds: 10,
      latitude: "",
      longitude: "",
      isActive: true,
    });
    setFormErr("");
    setShowHospitalModal(true);
  };

  const openEditHospital = (h) => {
    setEditHospital(h);
    setHForm({
      name: h.name,
      address: h.address,
      city: h.city,
      state: h.state || "",
      phone: h.phone,
      emailContact: h.email_contact || "",
      emergencyLine: h.emergency_line || "",
      totalIcuBeds: h.total_icu_beds,
      availableIcuBeds: h.available_icu_beds,
      latitude: h.latitude ?? "",
      longitude: h.longitude ?? "",
      isActive: Boolean(h.is_active),
    });
    setFormErr("");
    setShowHospitalModal(true);
  };

  const submitHospital = async (e) => {
    e.preventDefault();
    setFormErr("");
    const body = {
      name: hForm.name,
      address: hForm.address,
      city: hForm.city,
      state: hForm.state || undefined,
      phone: hForm.phone,
      emailContact: hForm.emailContact || undefined,
      emergencyLine: hForm.emergencyLine || undefined,
      totalIcuBeds: Number(hForm.totalIcuBeds),
      availableIcuBeds: Number(hForm.availableIcuBeds),
      latitude: hForm.latitude === "" ? undefined : Number(hForm.latitude),
      longitude: hForm.longitude === "" ? undefined : Number(hForm.longitude),
    };
    if (editHospital) {
      body.isActive = hForm.isActive;
    }
    try {
      if (editHospital) {
        await api.put(`/hospitals/${editHospital.id}`, body);
      } else {
        await api.post("/hospitals", body);
      }
      setShowHospitalModal(false);
      loadAll();
    } catch (ex) {
      setFormErr(ex.response?.data?.message || "Save failed");
    }
  };

  const submitUser = async (e) => {
    e.preventDefault();
    setFormErr("");
    try {
      await api.post("/admin/users", {
        email: uForm.email,
        password: uForm.password,
        fullName: uForm.fullName,
        role: uForm.role,
        hospitalId:
          uForm.role === "hospital" && uForm.hospitalId ? Number(uForm.hospitalId) : undefined,
      });
      setShowUserModal(false);
      setUForm({ email: "", password: "", fullName: "", role: "user", hospitalId: "" });
      loadAll();
    } catch (ex) {
      setFormErr(ex.response?.data?.message || ex.response?.data?.errors?.[0]?.msg || "Failed");
    }
  };

  const toggleUser = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      loadAll();
    } catch {
      /* ignore */
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-400/90 flex items-center gap-2">
            <Shield className="h-4 w-4" /> Administrator
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white">Command center</h1>
          <p className="text-slate-500 mt-1">Govern hospitals, users, and live ICU telemetry.</p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-2 border-b border-white/[0.08] pb-4">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "hospitals", label: "Hospitals", icon: Building2 },
          { id: "users", label: "Users & roles", icon: Users },
          { id: "activity", label: "Activity", icon: Clock },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-white/10 text-white border border-white/15"
                : "text-slate-500 hover:text-slate-200"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && stats && (
        <div className="mt-8 space-y-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Active hospitals", value: stats.hospitals, accent: "text-aqua-400" },
              { label: "Total ICU capacity", value: stats.totalIcuBeds, accent: "text-white" },
              { label: "Available ICU beds", value: stats.availableIcuBeds, accent: "text-emerald-400" },
              { label: "Registered users", value: stats.users, accent: "text-violet-300" },
            ].map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl glass border border-white/[0.08] p-5"
              >
                <p className="text-xs uppercase tracking-wider text-slate-500">{s.label}</p>
                <p className={`mt-2 font-display text-3xl font-bold ${s.accent}`}>{s.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="rounded-3xl glass-strong border border-white/[0.08] p-6 h-[360px]">
            <h3 className="font-display font-semibold text-white mb-4">ICU beds by city</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="city" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#0f1729",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Bar dataKey="available" name="Available" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" name="Total capacity" fill="#334155" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "hospitals" && (
        <div className="mt-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="w-full sm:w-72">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Search className="h-4 w-4 text-aqua-400" /> Search
                </label>
                <input
                  value={hospitalSearch}
                  onChange={(e) => setHospitalSearch(e.target.value)}
                  placeholder="name or city"
                  className="mt-2 w-full rounded-xl bg-ink-900/90 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-aqua-500/40"
                />
              </div>
              <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900/60 px-4 py-3 h-[46px] self-end sm:self-auto">
                <input
                  type="checkbox"
                  checked={hospitalActiveOnly}
                  onChange={(e) => setHospitalActiveOnly(e.target.checked)}
                  className="rounded border-white/20 bg-ink-950 text-aqua-500 focus:ring-aqua-500/40"
                />
                <span className="text-sm text-slate-300">Active only</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3 items-center justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition"
                onClick={() =>
                  downloadCsv(
                    "bedmitra-hospitals.csv",
                    filteredHospitals,
                    [
                      { label: "Name", value: (r) => r.name },
                      { label: "City", value: (r) => r.city },
                      { label: "ICU free", value: (r) => r.available_icu_beds },
                      { label: "Total", value: (r) => r.total_icu_beds },
                      { label: "Status", value: (r) => (r.is_active ? "Active" : "Inactive") },
                    ]
                  )
                }
              >
                <Download className="h-4 w-4 text-aqua-400" /> Export CSV
              </button>

              <button
                type="button"
                onClick={openNewHospital}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg"
              >
                <Plus className="h-4 w-4" /> Add hospital
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.08] overflow-hidden glass">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-left text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">ICU free</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHospitals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                        No hospitals match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredHospitals.map((h) => (
                    <tr key={h.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium text-white">{h.name}</td>
                      <td className="px-4 py-3 text-slate-400">{h.city}</td>
                      <td className="px-4 py-3 font-display font-bold text-aqua-400">
                        {h.available_icu_beds}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{h.total_icu_beds}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            h.is_active ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-600/30 text-slate-400"
                          }`}
                        >
                          {h.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openEditHospital(h)}
                          className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="mt-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="w-full sm:w-72">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Search className="h-4 w-4 text-aqua-400" /> Search
                </label>
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="name, email, role"
                  className="mt-2 w-full rounded-xl bg-ink-900/90 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-aqua-500/40"
                />
              </div>
              <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900/60 px-4 py-3 h-[46px] self-end sm:self-auto">
                <input
                  type="checkbox"
                  checked={userActiveOnly}
                  onChange={(e) => setUserActiveOnly(e.target.checked)}
                  className="rounded border-white/20 bg-ink-950 text-aqua-500 focus:ring-aqua-500/40"
                />
                <span className="text-sm text-slate-300">Active only</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3 items-center justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition"
                onClick={() =>
                  downloadCsv(
                    "bedmitra-users.csv",
                    filteredUsers,
                    [
                      { label: "Name", value: (r) => r.full_name },
                      { label: "Email", value: (r) => r.email },
                      { label: "Role", value: (r) => r.role },
                      { label: "Hospital", value: (r) => r.hospital_name || "" },
                      { label: "Active", value: (r) => (r.is_active ? "Yes" : "No") },
                    ]
                  )
                }
              >
                <Download className="h-4 w-4 text-aqua-400" /> Export CSV
              </button>

              <button
                type="button"
                onClick={() => {
                  setUForm({
                    email: "",
                    password: "",
                    fullName: "",
                    role: "hospital",
                    hospitalId: "",
                  });
                  setFormErr("");
                  setShowUserModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-aqua-500 to-teal-600 px-5 py-2.5 text-sm font-bold text-ink-950"
              >
                <UserPlus className="h-4 w-4" /> Invite user
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.08] overflow-hidden glass">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-left text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Hospital</th>
                    <th className="px-4 py-3">Active</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                        No users match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-white">{u.full_name}</td>
                        <td className="px-4 py-3 text-slate-400">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-slate-300">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{u.hospital_name || "—"}</td>
                        <td className="px-4 py-3">
                          {u.is_active ? (
                            <span className="text-emerald-400 text-xs">Yes</span>
                          ) : (
                            <span className="text-slate-500 text-xs">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleUser(u.id)}
                            className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-amber-300"
                            title="Toggle active"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "activity" && (
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display font-semibold text-white text-xl">Recent bed updates</h2>
              <p className="text-sm text-slate-500 mt-1">Audit-friendly feed across hospitals.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] overflow-hidden glass">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-left text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">Hospital</th>
                    <th className="px-4 py-3">Beds</th>
                    <th className="px-4 py-3">Updated by</th>
                    <th className="px-4 py-3">When</th>
                    <th className="px-4 py-3">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUpdates.map((r) => (
                    <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{r.hospital_name}</div>
                        <div className="text-xs text-slate-500">{r.city}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className={`font-display font-bold ${
                            Number(r.new_available) === 0 ? "text-rose-400" : "text-aqua-400"
                          }`}
                        >
                          {r.previous_available} → {r.new_available}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {r.updated_by || "—"}
                        <div className="text-[10px] text-slate-600 uppercase tracking-wider mt-0.5">
                          {r.updated_by_role || ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {r.note ? r.note : <span className="text-slate-600">—</span>}
                      </td>
                    </tr>
                  ))}
                  {recentUpdates.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        No recent activity yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showHospitalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowHospitalModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl glass-strong border border-white/[0.12] p-6 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-display text-xl font-bold text-white">
                  {editHospital ? "Edit hospital" : "New hospital"}
                </h3>
                <button type="button" onClick={() => setShowHospitalModal(false)} className="text-slate-500">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={submitHospital} className="space-y-4">
                {[
                  ["name", "Name"],
                  ["address", "Address"],
                  ["city", "City"],
                  ["state", "State"],
                  ["phone", "Phone"],
                  ["emailContact", "Contact email"],
                  ["emergencyLine", "Emergency line"],
                ].map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="text-xs text-slate-500">{label}</span>
                    <input
                      value={hForm[key]}
                      onChange={(e) => setHForm({ ...hForm, [key]: e.target.value })}
                      list={key === "city" ? "hospital-city-options" : undefined}
                      className="mt-1 w-full rounded-xl bg-ink-900/90 border border-white/10 px-3 py-2 text-sm text-white"
                      required={["name", "address", "city", "phone"].includes(key)}
                    />
                  </label>
                ))}
                <datalist id="hospital-city-options">
                  {cityOptions.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs text-slate-500">Total ICU beds</span>
                    <input
                      type="number"
                      min={1}
                      value={hForm.totalIcuBeds}
                      onChange={(e) => setHForm({ ...hForm, totalIcuBeds: e.target.value })}
                      className="mt-1 w-full rounded-xl bg-ink-900/90 border border-white/10 px-3 py-2 text-sm text-white"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-500">Available ICU</span>
                    <input
                      type="number"
                      min={0}
                      value={hForm.availableIcuBeds}
                      onChange={(e) => setHForm({ ...hForm, availableIcuBeds: e.target.value })}
                      className="mt-1 w-full rounded-xl bg-ink-900/90 border border-white/10 px-3 py-2 text-sm text-white"
                      required
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs text-slate-500">Latitude</span>
                    <input
                      value={hForm.latitude}
                      onChange={(e) => setHForm({ ...hForm, latitude: e.target.value })}
                      className="mt-1 w-full rounded-xl bg-ink-900/90 border border-white/10 px-3 py-2 text-sm text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-500">Longitude</span>
                    <input
                      value={hForm.longitude}
                      onChange={(e) => setHForm({ ...hForm, longitude: e.target.value })}
                      className="mt-1 w-full rounded-xl bg-ink-900/90 border border-white/10 px-3 py-2 text-sm text-white"
                    />
                  </label>
                </div>
                {editHospital && (
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={hForm.isActive}
                      onChange={(e) => setHForm({ ...hForm, isActive: e.target.checked })}
                      className="rounded border-white/20"
                    />
                    Active (visible to public)
                  </label>
                )}
                {formErr && (
                  <p className="text-sm text-rose-300">{formErr}</p>
                )}
                <button
                  type="submit"
                  className="w-full rounded-full bg-gradient-to-r from-aqua-500 to-teal-600 py-3 text-sm font-bold text-ink-950"
                >
                  {editHospital ? "Save changes" : "Create hospital"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl glass-strong border border-white/[0.12] p-6 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-display text-xl font-bold text-white">Invite user</h3>
                <button type="button" onClick={() => setShowUserModal(false)} className="text-slate-500">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={submitUser} className="space-y-4">
                <label className="block">
                  <span className="text-xs text-slate-500">Full name</span>
                  <input
                    required
                    value={uForm.fullName}
                    onChange={(e) => setUForm({ ...uForm, fullName: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-ink-900/90 border border-white/10 px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500">Email</span>
                  <input
                    type="email"
                    required
                    value={uForm.email}
                    onChange={(e) => setUForm({ ...uForm, email: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-ink-900/90 border border-white/10 px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500">Temporary password</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={uForm.password}
                    onChange={(e) => setUForm({ ...uForm, password: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-ink-900/90 border border-white/10 px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500">Role</span>
                  <select
                    value={uForm.role}
                    onChange={(e) => setUForm({ ...uForm, role: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-ink-900/90 border border-white/10 px-3 py-2 text-sm text-white"
                  >
                    <option value="user">Citizen</option>
                    <option value="hospital">Hospital staff</option>
                    <option value="admin">Administrator</option>
                  </select>
                </label>
                {uForm.role === "hospital" && (
                  <label className="block">
                    <span className="text-xs text-slate-500">Hospital</span>
                    <select
                      required
                      value={uForm.hospitalId}
                      onChange={(e) => setUForm({ ...uForm, hospitalId: e.target.value })}
                      className="mt-1 w-full rounded-xl bg-ink-900/90 border border-white/10 px-3 py-2 text-sm text-white"
                    >
                      <option value="">Select hospital</option>
                      {hospitalOptions.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} — {h.city}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {formErr && <p className="text-sm text-rose-300">{formErr}</p>}
                <button
                  type="submit"
                  className="w-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-bold text-white"
                >
                  Create account
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
