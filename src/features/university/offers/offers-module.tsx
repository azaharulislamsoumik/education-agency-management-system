"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type University = {
  id: string;
  university_name: string;
  province: string | null;
};

type Offer = {
  id: string;
  university_id: string;
  province: string | null;
  intake: string | null;
  degree: string | null;
  teaching_type: string | null;
  duration: string | null;
  programs: string | null;
  tuition_fee_type: string | null;
  scholarship_type: string | null;
  tuition_fees_details: string | null;
  requirements: string | null;
  status: string | null;
  deadline: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

type OfferNote = {
  id: string;
  offer_id: string;
  note: string;
  user_name: string | null;
  created_at: string;
};

type OfferLog = {
  id: string;
  offer_id: string;
  user_name: string | null;
  action: string;
  changed_fields: Record<string, { old: unknown; new: unknown }> | null;
  created_at: string;
};

type OfferForm = {
  university_id: string;
  province: string;
  intake: string;
  degree: string;
  teaching_type: string;
  duration: string;
  programs: string;
  tuition_fee_type: string;
  scholarship_type: string;
  tuition_fees_details: string;
  requirements: string;
  status: string;
  deadline: string;
};

const EMPTY_FORM: OfferForm = {
  university_id: "",
  province: "",
  intake: "",
  degree: "",
  teaching_type: "",
  duration: "",
  programs: "",
  tuition_fee_type: "",
  scholarship_type: "",
  tuition_fees_details: "",
  requirements: "",
  status: "Open",
  deadline: "",
};

const STATUS_OPTIONS = ["Open", "Closed", "Upcoming", "Expired", "On Hold"];
const FIELD_LABELS: Record<keyof OfferForm, string> = {
  university_id: "University Name",
  province: "Province",
  intake: "Intake",
  degree: "Degree",
  teaching_type: "Teaching Type",
  duration: "Duration",
  programs: "Programs",
  tuition_fee_type: "Tuition Fee Type",
  scholarship_type: "Scholarship/Tuition Types",
  tuition_fees_details: "Tuition Fees Details",
  requirements: "Requirements",
  status: "Status",
  deadline: "Deadline",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const labelClass = "mb-1.5 block text-xs font-semibold text-slate-700";

function splitItems(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n|;/)
    .map((item) => item.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

function roman(number: number): string {
  const values: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"],
    [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"],
    [5, "V"], [4, "IV"], [1, "I"],
  ];
  let n = number;
  let result = "";
  for (const [value, symbol] of values) {
    while (n >= value) {
      result += symbol;
      n -= value;
    }
  }
  return result;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function ListCell({ title, value }: { title: string; value: string | null }) {
  const [open, setOpen] = useState(false);
  const items = splitItems(value);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!items.length}
       className="max-w-[200px] text-left disabled:cursor-default"
        title={items.length ? `View ${title}` : "No information"}
      >
        {items.length ? (
          <span className="block space-y-1">
            {items.slice(0, 2).map((item, index) => (
              <span key={`${item}-${index}`} className="flex gap-1.5 text-xs leading-5 text-slate-700">
                <span className="shrink-0 font-semibold text-blue-600">{roman(index + 1)}.</span>
                <span className="line-clamp-2 whitespace-normal">{item}</span>
              </span>
            ))}
            {items.length > 2 && (
              <span className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                +{items.length - 2} more · View all
              </span>
            )}
            {items.length <= 2 && (
              <span className="text-[10px] font-medium text-blue-600">View details</span>
            )}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </button>
      {open && (
        <Modal title={title} onClose={() => setOpen(false)} size="md">
          {items.length ? (
            <ol className="space-y-2">
              {items.map((item, index) => (
                <li key={`${item}-${index}`} className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  <span className="font-bold text-blue-600">{roman(index + 1)}.</span>
                  <span className="whitespace-pre-wrap">{item}</span>
                </li>
              ))}
            </ol>
          ) : <p className="text-sm text-slate-500">No information available.</p>}
        </Modal>
      )}
    </>
  );
}

function Modal({
  title,
  onClose,
  children,
  size = "lg",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  const sizeClass = size === "md" ? "max-w-xl" : size === "xl" ? "max-w-5xl" : "max-w-3xl";
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-3 sm:p-6" onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className={`my-auto max-h-[92vh] w-full ${sizeClass} overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function MultiFilter({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, [open]);

  const filtered = options.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
  return (
    <div ref={rootRef} className="relative min-w-0">
      <label className={labelClass}>{label}</label>
      <button type="button" onClick={() => setOpen((v) => !v)} className={`${inputClass} flex min-h-[44px] items-center justify-between gap-2 text-left`}>
        <span className="truncate">{value.length ? `${value.length} selected: ${value.slice(0, 2).join(", ")}${value.length > 2 ? "…" : ""}` : <span className="text-slate-400">All options</span>}</span>
        <span className="text-slate-400">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[230px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search options..." className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500" />
          <div className="mb-2 flex items-center justify-between border-b border-slate-100 px-1 pb-2 text-xs">
            <button type="button" onClick={() => onChange(options)} className="font-semibold text-blue-600">Select all</button>
            <button type="button" onClick={() => onChange([])} className="text-slate-500">Clear</button>
            <button type="button" onClick={() => setOpen(false)} className="font-semibold text-slate-700">Done</button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((item) => (
              <label key={item} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-700 hover:bg-blue-50">
                <input type="checkbox" checked={value.includes(item)} onChange={(e) => onChange(e.target.checked ? [...value, item] : value.filter((v) => v !== item))} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span>{item}</span>
              </label>
            ))}
            {!filtered.length && <p className="px-2 py-3 text-xs text-slate-400">No matching options.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OffersModule() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [intakeFilter, setIntakeFilter] = useState<string[]>([]);
  const [degreeFilter, setDegreeFilter] = useState<string[]>([]);
  const [teachingFilter, setTeachingFilter] = useState<string[]>([]);
  const [durationFilter, setDurationFilter] = useState<string[]>([]);
  const [programFilter, setProgramFilter] = useState<string[]>([]);
  const [scholarshipFilter, setScholarshipFilter] = useState<string[]>([]);
  const [tuitionDetailsFilter, setTuitionDetailsFilter] = useState<string[]>([]);
  const [requirementsFilter, setRequirementsFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [deadlineFrom, setDeadlineFrom] = useState("");
  const [deadlineTo, setDeadlineTo] = useState("");
  const [nameSuggestionsOpen, setNameSuggestionsOpen] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState<OfferForm>(EMPTY_FORM);

  const [noteOffer, setNoteOffer] = useState<Offer | null>(null);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<OfferNote[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [logOffer, setLogOffer] = useState<Offer | null>(null);
  const [logs, setLogs] = useState<OfferLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    const [universityResult, offerResult] = await Promise.all([
      supabase.from("universities").select("id, university_name, province").order("university_name", { ascending: true }),
      supabase.from("university_offers").select("*").order("created_at", { ascending: false }),
    ]);
    if (universityResult.error) setErrorMessage(universityResult.error.message);
    else setUniversities((universityResult.data || []) as University[]);
    if (offerResult.error) setErrorMessage(offerResult.error.message);
    else setOffers((offerResult.data || []) as Offer[]);
    setLoading(false);
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const universityById = useMemo(() => new Map(universities.map((u) => [u.id, u])), [universities]);
  const universityNames = useMemo(() => universities.map((u) => u.university_name).filter(Boolean), [universities]);
  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? universityNames.filter((name) => name.toLowerCase().includes(q)).slice(0, 8) : [];
  }, [search, universityNames]);

  const filterOptions = useMemo(() => {
    const collect = (getter: (offer: Offer) => string[]) =>
      [...new Set(offers.flatMap(getter).map((v) => v.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return {
      provinces: [...new Set(offers.map((o) => o.province || universityById.get(o.university_id)?.province || "").filter(Boolean))].sort(),
      intakes: collect((o) => o.intake ? [o.intake] : []),
      degrees: collect((o) => o.degree ? [o.degree] : []),
      teaching: collect((o) => o.teaching_type ? [o.teaching_type] : []),
      durations: collect((o) => o.duration ? [o.duration] : []),
      programs: collect((o) => splitItems(o.programs)),
      scholarships: collect((o) => splitItems(o.scholarship_type)),
      tuitionDetails: collect((o) => splitItems(o.tuition_fees_details)),
      requirements: collect((o) => splitItems(o.requirements)),
      statuses: [...new Set(offers.map((o) => o.status || "Open"))].sort(),
    };
  }, [offers, universityById]);

  const filteredOffers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return offers.filter((offer) => {
      const university = universityById.get(offer.university_id);
      const nameMatch = !q || (university?.university_name || "").toLowerCase().includes(q);
      const province = offer.province || university?.province || "";
      const provinceMatch = !provinceFilter || province === provinceFilter;
      const hasAny = (selected: string[], values: string[]) => !selected.length || selected.some((v) => values.includes(v));
      const deadlineMatch = (!deadlineFrom || (!!offer.deadline && offer.deadline >= deadlineFrom)) &&
        (!deadlineTo || (!!offer.deadline && offer.deadline <= deadlineTo));
      return nameMatch && provinceMatch &&
        hasAny(intakeFilter, offer.intake ? [offer.intake] : []) &&
        hasAny(degreeFilter, offer.degree ? [offer.degree] : []) &&
        hasAny(teachingFilter, offer.teaching_type ? [offer.teaching_type] : []) &&
        hasAny(durationFilter, offer.duration ? [offer.duration] : []) &&
        hasAny(programFilter, splitItems(offer.programs)) &&
        hasAny(scholarshipFilter, splitItems(offer.scholarship_type)) &&
        hasAny(tuitionDetailsFilter, splitItems(offer.tuition_fees_details)) &&
        hasAny(requirementsFilter, splitItems(offer.requirements)) &&
        hasAny(statusFilter, [offer.status || "Open"]) && deadlineMatch;
    });
  }, [offers, universityById, search, provinceFilter, intakeFilter, degreeFilter, teachingFilter, durationFilter, programFilter, scholarshipFilter, tuitionDetailsFilter, requirementsFilter, statusFilter, deadlineFrom, deadlineTo]);

  function resetFilters() {
    setSearch(""); setProvinceFilter(""); setIntakeFilter([]); setDegreeFilter([]);
    setTeachingFilter([]); setDurationFilter([]); setProgramFilter([]); setScholarshipFilter([]);
    setTuitionDetailsFilter([]); setRequirementsFilter([]); setStatusFilter([]);
    setDeadlineFrom(""); setDeadlineTo(""); setNameSuggestionsOpen(false);
  }

  function startAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setMessage("");
    setErrorMessage("");
  }

  function startEdit(offer: Offer) {
    setEditing(offer);
    setForm({
      university_id: offer.university_id || "",
      province: offer.province || universityById.get(offer.university_id)?.province || "",
      intake: offer.intake || "",
      degree: offer.degree || "",
      teaching_type: offer.teaching_type || "",
      duration: offer.duration || "",
      programs: offer.programs || "",
      tuition_fee_type: offer.tuition_fee_type || "",
      scholarship_type: offer.scholarship_type || "",
      tuition_fees_details: offer.tuition_fees_details || "",
      requirements: offer.requirements || "",
      status: offer.status || "Open",
      deadline: offer.deadline || "",
    });
    setShowForm(true);
    setMessage("");
    setErrorMessage("");
  }

  function updateForm<K extends keyof OfferForm>(key: K, value: OfferForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function writeLog(offerId: string, action: string, changedFields: OfferLog["changed_fields"] = null) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("university_offer_logs").insert({
      offer_id: offerId,
      user_id: user?.id || null,
      user_name: user?.email || "System User",
      action,
      changed_fields: changedFields,
    });
    if (error) console.error("Offer activity log error:", error.message);
  }

  async function saveOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.university_id) { setErrorMessage("Please select a university."); return; }
    if (!form.degree.trim()) { setErrorMessage("Degree is required."); return; }
    setSaving(true);
    setErrorMessage("");
    setMessage("");

    const selectedUniversity = universityById.get(form.university_id);
    const payload = {
      university_id: form.university_id,
      province: form.province.trim() || selectedUniversity?.province || null,
      intake: form.intake.trim() || null,
      degree: form.degree.trim() || null,
      teaching_type: form.teaching_type.trim() || null,
      duration: form.duration.trim() || null,
      programs: form.programs.trim() || null,
      tuition_fee_type: form.tuition_fee_type.trim() || null,
      scholarship_type: form.scholarship_type.trim() || null,
      tuition_fees_details: form.tuition_fees_details.trim() || null,
      requirements: form.requirements.trim() || null,
      status: form.status || "Open",
      deadline: form.deadline || null,
    };

    try {
      if (editing) {
        const changed: Record<string, { old: unknown; new: unknown }> = {};
        (Object.keys(payload) as (keyof typeof payload)[]).forEach((key) => {
          const oldValue = editing[key] ?? null;
          const newValue = payload[key] ?? null;
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changed[key] = { old: oldValue, new: newValue };
          }
        });
        const { error } = await supabase.from("university_offers").update(payload).eq("id", editing.id);
        if (error) throw new Error(error.message);
        await writeLog(editing.id, "Offer Updated", changed);
        setMessage("Offer updated successfully.");
      } else {
        const { data, error } = await supabase.from("university_offers").insert(payload).select("id").single();
        if (error) throw new Error(error.message);
        if (data?.id) await writeLog(data.id, "Offer Created", null);
        setMessage("Offer added successfully.");
      }
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not save offer.");
    } finally {
      setSaving(false);
    }
  }

  async function openNotes(offer: Offer) {
    setNoteOffer(offer);
    setNoteText("");
    setNotes([]);
    setShowNotes(true);
    const { data, error } = await supabase.from("university_offer_notes").select("*")
      .eq("offer_id", offer.id).order("created_at", { ascending: false });
    if (error) setErrorMessage(error.message);
    else setNotes((data || []) as OfferNote[]);
  }

  async function saveNote() {
    if (!noteOffer || !noteText.trim()) return;
    setSaving(true);
    setErrorMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    const userName = user?.email || "System User";
    const { data, error } = await supabase.from("university_offer_notes").insert({
      offer_id: noteOffer.id,
      note: noteText.trim(),
      user_id: user?.id || null,
      user_name: userName,
    }).select("*").single();
    if (error) setErrorMessage(error.message);
    else {
      setNotes((previous) => [data as OfferNote, ...previous]);
      setNoteText("");
      await writeLog(noteOffer.id, "Note Added", null);
    }
    setSaving(false);
  }

  async function openLogs(offer: Offer) {
    setLogOffer(offer);
    setLogs([]);
    setShowLogs(true);
    const { data, error } = await supabase.from("university_offer_logs").select("*")
      .eq("offer_id", offer.id).order("created_at", { ascending: false });
    if (error) setErrorMessage(error.message);
    else setLogs((data || []) as OfferLog[]);
  }

  async function deleteOffer(offer: Offer) {
    const universityName = universityById.get(offer.university_id)?.university_name || "this university";
    if (!window.confirm(`Delete ${universityName} — ${offer.degree || "offer"}? This cannot be undone.`)) return;
    const { error } = await supabase.from("university_offers").delete().eq("id", offer.id);
    if (error) setErrorMessage(error.message);
    else {
      setMessage("Offer deleted successfully.");
      await loadData();
    }
  }

  const activeFilterCount = [
    search, provinceFilter, ...intakeFilter, ...degreeFilter, ...teachingFilter,
    ...durationFilter, ...programFilter, ...scholarshipFilter, ...tuitionDetailsFilter,
    ...requirementsFilter, ...statusFilter, deadlineFrom, deadlineTo,
  ].filter(Boolean).length;

  return (
    <div className="mx-auto w-full max-w-full space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">University Offers</h1>
          <p className="mt-1 text-sm text-slate-500">Manage university intake, programs, tuition, requirements and deadlines.</p>
        </div>
        <button type="button" onClick={startAdd} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
          + Add New Offer
        </button>
      </div>

      {message && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
      {errorMessage && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-800">Offer List</h2>
            <p className="mt-1 text-xs text-slate-500">Showing <strong className="text-slate-700">{filteredOffers.length}</strong> of {offers.length} offers</p>
          </div>
          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">{activeFilterCount} active filters</span>
        </div>

        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Advanced Offer Search</h3>
              <p className="mt-0.5 text-xs text-slate-500">Combine filters to find matching offers. Results update automatically.</p>
            </div>
            <button type="button" onClick={resetFilters} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="relative min-w-0">
              <label className={labelClass}>University Name</label>
              <input value={search} onFocus={() => setNameSuggestionsOpen(true)} onChange={(e) => { setSearch(e.target.value); setNameSuggestionsOpen(true); }} placeholder="Type university name..." className={inputClass} />
              {nameSuggestionsOpen && search.trim() && suggestions.length > 0 && (
                <div className="absolute left-0 top-full z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                  {suggestions.map((name) => (
                    <button key={name} type="button" onClick={() => { setSearch(name); setNameSuggestionsOpen(false); }} className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50">{name}</button>
                  ))}
                </div>
              )}
            </div>
            <label className="min-w-0">
              <span className={labelClass}>Province</span>
              <select value={provinceFilter} onChange={(e) => setProvinceFilter(e.target.value)} className={inputClass}>
                <option value="">All Provinces</option>
                {filterOptions.provinces.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <MultiFilter label="Intake" options={filterOptions.intakes} value={intakeFilter} onChange={setIntakeFilter} />

            <MultiFilter label="Degree" options={filterOptions.degrees} value={degreeFilter} onChange={setDegreeFilter} />
            <MultiFilter label="Teaching Type" options={filterOptions.teaching} value={teachingFilter} onChange={setTeachingFilter} />
            <MultiFilter label="Duration" options={filterOptions.durations} value={durationFilter} onChange={setDurationFilter} />

            <MultiFilter label="Programs" options={filterOptions.programs} value={programFilter} onChange={setProgramFilter} />
            <MultiFilter label="Scholarship/Tuition Types" options={filterOptions.scholarships} value={scholarshipFilter} onChange={setScholarshipFilter} />
            <MultiFilter label="Tuition Fees Details" options={filterOptions.tuitionDetails} value={tuitionDetailsFilter} onChange={setTuitionDetailsFilter} />

            <MultiFilter label="Requirements" options={filterOptions.requirements} value={requirementsFilter} onChange={setRequirementsFilter} />
            <MultiFilter label="Status" options={filterOptions.statuses} value={statusFilter} onChange={setStatusFilter} />
            <div className="min-w-0">
              <label className={labelClass}>Deadline Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input aria-label="Deadline from" type="date" value={deadlineFrom} onChange={(e) => setDeadlineFrom(e.target.value)} className={inputClass} />
                <input aria-label="Deadline to" type="date" value={deadlineTo} onChange={(e) => setDeadlineTo(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">Loading university offers...</div>
        ) : !filteredOffers.length ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
            <p className="font-semibold text-slate-700">No offers found</p>
            <p className="mt-1 text-sm text-slate-500">Try changing the filters or add a new offer.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-full table-auto border-collapse text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  {["S.N.", "University Name", "Province", "Intake", "Degree", "TeachingType", "Duration", "Programs", "Scholarship/Tuition Types", "Tuition Fees Details", "Requirements", "Status", "Deadline", "Actions"].map((column) => (
                    <th key={column} className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-3 text-xs font-bold text-slate-700 last:border-r-0">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOffers.map((offer, index) => {
                  const university = universityById.get(offer.university_id);
                  return (
                    <tr key={offer.id} className="align-top transition hover:bg-blue-50/40">
                      <td className="border-b border-r border-slate-100 px-3 py-3 text-xs text-slate-500">{index + 1}</td>
                      <td className="w-[220px] max-w-[260px] border-b border-r border-slate-100 px-3 py-3 font-semibold text-slate-800">
  <span className="block whitespace-normal break-words">
    {university?.university_name || "University not found"}
  </span>
</td>
                      <td className="border-b border-r border-slate-100 px-3 py-3 text-sm text-slate-600">{offer.province || university?.province || "—"}</td>
                      <td className="border-b border-r border-slate-100 px-3 py-3 text-sm text-slate-600">{offer.intake || "—"}</td>
                      <td className="border-b border-r border-slate-100 px-3 py-3 text-sm font-medium text-slate-700">{offer.degree || "—"}</td>
                      <td className="border-b border-r border-slate-100 px-3 py-3 text-sm text-slate-600">{offer.teaching_type || "—"}</td>
                      <td className="border-b border-r border-slate-100 px-3 py-3 text-sm text-slate-600">{offer.duration || "—"}</td>
                      <td className="border-b border-r border-slate-100 px-3 py-3"><ListCell title="Programs" value={offer.programs} /></td>
                      <td className="border-b border-r border-slate-100 px-3 py-3"><ListCell title="Scholarship/Tuition Types" value={offer.scholarship_type} /></td>
                      <td className="border-b border-r border-slate-100 px-3 py-3"><ListCell title="Tuition Fees Details" value={offer.tuition_fees_details} /></td>
                      <td className="border-b border-r border-slate-100 px-3 py-3"><ListCell title="Requirements" value={offer.requirements} /></td>
                      <td className="border-b border-r border-slate-100 px-3 py-3">
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${offer.status === "Open" ? "bg-emerald-50 text-emerald-700" : offer.status === "Closed" || offer.status === "Expired" ? "bg-rose-50 text-rose-700" : offer.status === "Upcoming" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{offer.status || "Open"}</span>
                      </td>
                      <td className="whitespace-nowrap border-b border-r border-slate-100 px-3 py-3 text-sm text-slate-600">{formatDate(offer.deadline)}</td>
                      <td className="border-b border-slate-100 px-3 py-3">
                        <div className="flex w-max flex-nowrap items-center gap-1.5 whitespace-nowrap">
                          <button type="button" onClick={() => void openNotes(offer)} className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-100">Note</button>
                          <button type="button" onClick={() => void openLogs(offer)} className="rounded-md border border-violet-200 bg-violet-50 px-2 py-1.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-100">Log</button>
                          <button type="button" onClick={() => startEdit(offer)} className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100">Edit</button>
                          <button type="button" onClick={() => void deleteOffer(offer)} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-[11px] text-slate-400">Tip: click a list cell to view its complete details. Use Edit to change offer information.</p>
      </section>

      {showForm && (
        <Modal title={editing ? "Edit University Offer" : "Add New University Offer"} onClose={() => !saving && setShowForm(false)} size="xl">
          <form onSubmit={saveOffer} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="lg:col-span-2">
                <span className={labelClass}>University Name <span className="text-rose-500">*</span></span>
                <select required value={form.university_id} onChange={(e) => {
                  const selected = universityById.get(e.target.value);
                  setForm((prev) => ({ ...prev, university_id: e.target.value, province: prev.province || selected?.province || "" }));
                }} className={inputClass}>
                  <option value="">Select University</option>
                  {universities.map((u) => <option key={u.id} value={u.id}>{u.university_name}</option>)}
                </select>
              </label>
              <label>
                <span className={labelClass}>Province</span>
                <input value={form.province} onChange={(e) => updateForm("province", e.target.value)} placeholder="Province / City" className={inputClass} />
              </label>
              <label>
                <span className={labelClass}>Intake</span>
                <input value={form.intake} onChange={(e) => updateForm("intake", e.target.value)} placeholder="e.g. September 2027" className={inputClass} />
              </label>
              <label>
                <span className={labelClass}>Degree <span className="text-rose-500">*</span></span>
                <select required value={form.degree} onChange={(e) => updateForm("degree", e.target.value)} className={inputClass}>
                  <option value="">Select Degree</option>
                  {["Bachelor", "Master", "PhD", "Associate", "Chinese Language", "Foundation"].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label>
                <span className={labelClass}>Teaching Type</span>
                <select value={form.teaching_type} onChange={(e) => updateForm("teaching_type", e.target.value)} className={inputClass}>
                  <option value="">Select Teaching Type</option>
                  {["English", "Chinese", "Bilingual"].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label>
                <span className={labelClass}>Duration</span>
                <input value={form.duration} onChange={(e) => updateForm("duration", e.target.value)} placeholder="e.g. 4 Years" className={inputClass} />
              </label>
              <label>
                <span className={labelClass}>Status</span>
                <select value={form.status} onChange={(e) => updateForm("status", e.target.value)} className={inputClass}>
                  {STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label>
                <span className={labelClass}>Deadline</span>
                <input type="date" value={form.deadline} onChange={(e) => updateForm("deadline", e.target.value)} className={inputClass} />
              </label>
              <label>
                <span className={labelClass}>Tuition Fee Type</span>
                <input value={form.tuition_fee_type} onChange={(e) => updateForm("tuition_fee_type", e.target.value)} placeholder="e.g. Self-funded" className={inputClass} />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <label>
                <span className={labelClass}>Programs <span className="font-normal text-slate-400">(one item per line)</span></span>
                <textarea rows={4} value={form.programs} onChange={(e) => updateForm("programs", e.target.value)} placeholder={"Accounting\nAerospace Engineering"} className={inputClass} />
              </label>
              <label>
                <span className={labelClass}>Scholarship/Tuition Types <span className="font-normal text-slate-400">(one item per line)</span></span>
                <textarea rows={4} value={form.scholarship_type} onChange={(e) => updateForm("scholarship_type", e.target.value)} placeholder={"Tuition - Full Free\nStipend - Yearly"} className={inputClass} />
              </label>
              <label>
                <span className={labelClass}>Tuition Fees Details <span className="font-normal text-slate-400">(one item per line)</span></span>
                <textarea rows={4} value={form.tuition_fees_details} onChange={(e) => updateForm("tuition_fees_details", e.target.value)} placeholder={"Tuition fees: 6000 CNY/year\nAccommodation fees: 5000 CNY/year"} className={inputClass} />
              </label>
              <label>
                <span className={labelClass}>Requirements <span className="font-normal text-slate-400">(one item per line)</span></span>
                <textarea rows={4} value={form.requirements} onChange={(e) => updateForm("requirements", e.target.value)} placeholder={"Age limit: 18-25\nPassport\nAcademic certificates"} className={inputClass} />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" disabled={saving} onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving..." : editing ? "Update Offer" : "Save Offer"}</button>
            </div>
          </form>
        </Modal>
      )}

      {showNotes && noteOffer && (
        <Modal title={`Offer Notes — ${universityById.get(noteOffer.university_id)?.university_name || "University"}`} onClose={() => setShowNotes(false)} size="lg">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className={labelClass}>Add a Note</label>
              <textarea rows={3} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Write an internal note about this offer..." className={inputClass} />
              <div className="mt-2 flex justify-end">
                <button type="button" disabled={saving || !noteText.trim()} onClick={() => void saveNote()} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Add Note"}</button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-700">Previous Notes ({notes.length})</h4>
              {notes.length ? notes.map((note) => (
                <div key={note.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{note.note}</p>
                  <p className="mt-2 text-[11px] text-slate-400">{note.user_name || "System User"} · {new Date(note.created_at).toLocaleString()}</p>
                </div>
              )) : <p className="rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-400">No notes added yet.</p>}
            </div>
          </div>
        </Modal>
      )}

      {showLogs && logOffer && (
        <Modal title={`Offer Activity Log — ${universityById.get(logOffer.university_id)?.university_name || "University"}`} onClose={() => setShowLogs(false)} size="lg">
          <div className="space-y-3">
            {logs.length ? logs.map((log) => (
              <div key={log.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-bold text-slate-800">{log.action}</p>
                  <span className="text-[11px] text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">By: {log.user_name || "System User"}</p>
                {log.changed_fields && Object.keys(log.changed_fields).length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                    {Object.entries(log.changed_fields).map(([key, change]) => (
                      <div key={key} className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-[170px_1fr]">
                        <span className="font-semibold text-slate-600">{FIELD_LABELS[key as keyof OfferForm] || key}</span>
                        <span className="break-words text-slate-500"><span className="text-rose-600">Old:</span> {String(change.old ?? "—")} <span className="mx-1 text-slate-300">→</span> <span className="text-emerald-700">New:</span> {String(change.new ?? "—")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )) : <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-400">No activity recorded yet.</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
