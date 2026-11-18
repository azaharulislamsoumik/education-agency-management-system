"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type University = {
  id: string;
  university_name: string;
  province: string | null;
  intake: string[] | null;
  degree: string[] | null;
  tuition_fee_type: string[] | null;
  type: string | null;
  scholarship: string[] | null;
  requirements: string[] | null;
  restricted_account_country: string[] | null;
  apply_link: string | null;
  user_id: string | null;
  responsible_person: string | null;
  is_active: boolean | null;
  created_at: string;
};

type UniversityNote = {
  id: string;
  university_id: string;
  note: string;
  created_at: string;
};

type UniversityLog = {
  id: string;
  university_id: string;
  action: string;
  details: string | null;
  created_at: string;
};

type UniversityForm = {
  university_name: string;
  province: string;
  intake: string;
  degree: string;
  tuition_fee_type: string;
  type: string;
  scholarship: string;
  requirements: string;
  restricted_account_country: string;
  apply_link: string;
  password: string;
  user_id: string;
  responsible_person: string;
};

const emptyForm: UniversityForm = {
  university_name: "", province: "", intake: "", degree: "",
  tuition_fee_type: "", type: "", scholarship: "", requirements: "",
  restricted_account_country: "", apply_link: "", password: "",
  user_id: "", responsible_person: "",
};

const columns = [
  "S.N.", "University Name", "Province", "Intake", "Degree",
  "Tuition Fee Type", "Account Type", "Scholarship", "Requirements",
  "Restricted Country", "Apply Link", "User ID", "Responsible Person",
  "Password", "Actions",
];

function listToText(value: string[] | null | undefined) {
  return (value || []).join("\n");
}

function textToList(value: string) {
  return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
}

function displayList(value: string[] | null | undefined) {
  const items = value || [];
  if (!items.length) return <span className="text-slate-400">—</span>;
  return (
    <ul className="min-w-[100px] list-disc space-y-1 pl-4">
      {items.map((item, index) => <li key={`${item}-${index}`} className="whitespace-normal">{item}</li>)}
    </ul>
  );
}

/** Custom searchable multi-select dropdown used by the advanced filters. */
function MultiSelectDropdown({
  label, options, value, onChange, placeholder = "Select options",
  open, onToggle, onClose,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: Event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [open, onClose]);

  const filtered = options.filter((option) => option.toLowerCase().includes(query.toLowerCase()));
  return (
    <div ref={dropdownRef} className="relative min-w-0">
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</label>
      <button type="button" onClick={onToggle}
        className="flex min-h-[42px] w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100">
        <span className="min-w-0 truncate text-slate-700">
          {value.length ? `${value.length} selected: ${value.slice(0, 2).join(", ")}${value.length > 2 ? "..." : ""}` : <span className="text-slate-400">{placeholder}</span>}
        </span>
        <span className="text-slate-400">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-full min-w-[230px] rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search options..."
            className="mb-2 w-full rounded-md border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-blue-500" />
          <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
            <button type="button" onClick={() => onChange(options)} className="font-medium text-blue-600 hover:underline">Select all</button>
            <button type="button" onClick={() => onChange([])} className="font-medium text-slate-500 hover:underline">Clear</button>
            <button type="button" onClick={onClose} className="font-semibold text-slate-700 hover:underline">Done</button>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length ? filtered.map((option) => (
              <label key={option} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm hover:bg-blue-50">
                <input type="checkbox" checked={value.includes(option)}
                  onChange={(e) => onChange(e.target.checked ? [...value, option] : value.filter((item) => item !== option))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span>{option}</span>
              </label>
            )) : <p className="px-2 py-3 text-xs text-slate-400">No options found.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UniversityModule() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [intakeFilter, setIntakeFilter] = useState<string[]>([]);
  const [degreeFilter, setDegreeFilter] = useState<string[]>([]);
  const [tuitionFilter, setTuitionFilter] = useState<string[]>([]);
  const [scholarshipFilter, setScholarshipFilter] = useState<string[]>([]);
  const [requirementsFilter, setRequirementsFilter] = useState<string[]>([]);
  const [restrictedCountryFilter, setRestrictedCountryFilter] = useState("");
  const [nameSuggestionsOpen, setNameSuggestionsOpen] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<University | null>(null);
  const [form, setForm] = useState<UniversityForm>(emptyForm);

  const [noteUniversity, setNoteUniversity] = useState<University | null>(null);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<UniversityNote[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [logUniversity, setLogUniversity] = useState<University | null>(null);
  const [logs, setLogs] = useState<UniversityLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const [showFormPassword, setShowFormPassword] = useState(false);
  const [passwordCache, setPasswordCache] = useState<Record<string, string>>({});
  const [passwordVisibility, setPasswordVisibility] = useState<Record<string, boolean>>({});
  const [passwordLoadingId, setPasswordLoadingId] = useState<string | null>(null);

  const loadUniversities = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    const { data, error } = await supabase.from("universities").select(`
      id, university_name, province, intake, degree, tuition_fee_type, type,
      scholarship, requirements, restricted_account_country, apply_link,
      user_id, responsible_person, is_active, created_at
    `).order("university_name", { ascending: true });
    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }
    setUniversities((data || []) as University[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadUniversities(); }, [loadUniversities]);

  const uniqueOptions = useMemo(() => {
    const collect = (getter: (u: University) => string[]) =>
      [...new Set(universities.flatMap(getter).map((v) => v.trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return {
      provinces: [...new Set(universities.map((u) => u.province?.trim()).filter((v): v is string => Boolean(v)))].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
      intakes: collect((u) => u.intake || []),
      degrees: collect((u) => u.degree || []),
      tuition: collect((u) => u.tuition_fee_type || []),
      scholarships: collect((u) => u.scholarship || []),
      requirements: collect((u) => u.requirements || []),
      countries: collect((u) => u.restricted_account_country || []),
    };
  }, [universities]);

  const suggestions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return [];
    return universities.filter((u) => u.university_name.toLowerCase().includes(keyword))
      .slice(0, 8).map((u) => u.university_name);
  }, [universities, search]);

  const filteredUniversities = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    return universities.filter((u) => {
      const nameMatch = !keyword || u.university_name.toLowerCase().includes(keyword);
      const provinceMatch = !provinceFilter || u.province === provinceFilter;
      const intakeMatch = !intakeFilter.length || intakeFilter.some((v) => (u.intake || []).includes(v));
      const degreeMatch = !degreeFilter.length || degreeFilter.some((v) => (u.degree || []).includes(v));
      const tuitionMatch = !tuitionFilter.length || tuitionFilter.some((v) => (u.tuition_fee_type || []).includes(v));
      const scholarshipMatch = !scholarshipFilter.length || scholarshipFilter.some((v) => (u.scholarship || []).includes(v));
      const requirementsMatch = !requirementsFilter.length || requirementsFilter.some((v) => (u.requirements || []).includes(v));
      // Exclude universities whose restricted-country list contains the selected country.
      const countryExcluded = !restrictedCountryFilter || !(u.restricted_account_country || []).some((v) => v.toLowerCase() === restrictedCountryFilter.toLowerCase());
      return nameMatch && provinceMatch && intakeMatch && degreeMatch && tuitionMatch && scholarshipMatch && requirementsMatch && countryExcluded;
    });
  }, [universities, search, provinceFilter, intakeFilter, degreeFilter, tuitionFilter, scholarshipFilter, requirementsFilter, restrictedCountryFilter]);

  const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

  function resetFilters() {
    setSearch(""); setProvinceFilter(""); setIntakeFilter([]); setDegreeFilter([]);
    setTuitionFilter([]); setScholarshipFilter([]); setRequirementsFilter([]);
    setRestrictedCountryFilter(""); setNameSuggestionsOpen(false);
  }

  function startAdd() {
    setEditing(null); setShowFormPassword(false); setForm(emptyForm);
    setShowForm(true); setMessage(""); setErrorMessage("");
  }

  function startEdit(university: University) {
    setEditing(university); setShowFormPassword(false);
    setForm({
      university_name: university.university_name || "", province: university.province || "",
      intake: listToText(university.intake), degree: listToText(university.degree),
      tuition_fee_type: listToText(university.tuition_fee_type), type: university.type || "",
      scholarship: listToText(university.scholarship), requirements: listToText(university.requirements),
      restricted_account_country: listToText(university.restricted_account_country),
      apply_link: university.apply_link || "", user_id: university.user_id || "",
      responsible_person: university.responsible_person || "", password: "",
    });
    setShowForm(true); setMessage(""); setErrorMessage("");
  }

  async function writeLog(universityId: string, action: string, details: string) {
    const { error } = await supabase.from("university_activity_logs").insert({ university_id: universityId, action, details });
    if (error) console.error("Activity log error:", error.message);
  }

  async function saveUniversity() {
    if (!form.university_name.trim()) { setErrorMessage("University Name is required."); return; }
    setSaving(true); setMessage(""); setErrorMessage("");
    const payload = {
      university_name: form.university_name.trim(), province: form.province.trim() || null,
      intake: textToList(form.intake), degree: textToList(form.degree),
      tuition_fee_type: textToList(form.tuition_fee_type), type: form.type.trim() || null,
      scholarship: textToList(form.scholarship), requirements: textToList(form.requirements),
      restricted_account_country: textToList(form.restricted_account_country),
      apply_link: form.apply_link.trim() || null, user_id: form.user_id.trim() || null,
      responsible_person: form.responsible_person.trim() || null,
    };
    let universityId = editing?.id || "";
    try {
      if (editing) {
        const { error } = await supabase.from("universities").update(payload).eq("id", editing.id);
        if (error) { setErrorMessage(error.message); setSaving(false); return; }
        await writeLog(editing.id, "Updated", `University details updated: ${form.university_name}`);
      } else {
        const { data, error } = await supabase.from("universities").insert(payload).select("id").single();
        if (error || !data?.id) { setErrorMessage(error?.message || "Could not add university."); setSaving(false); return; }
        universityId = data.id;
        await writeLog(universityId, "Created", `University added: ${form.university_name}`);
      }

      if (form.password.length > 0) {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) {
          setErrorMessage("University details saved, but password could not be saved. Please sign in again.");
          await loadUniversities(); setSaving(false); return;
        }
        const response = await fetch("/api/university-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ universityId, password: form.password }),
        });
        const result = await response.json();
        if (!response.ok) {
          setErrorMessage(`University details saved, but password could not be saved: ${result.error || "Unknown error"}`);
          await loadUniversities(); setSaving(false); return;
        }
        setPasswordCache((previous) => { const updated = { ...previous }; delete updated[universityId]; return updated; });
        setPasswordVisibility((previous) => ({ ...previous, [universityId]: false }));
      }
      setMessage(editing ? "University details updated successfully." : "University added successfully.");
      setShowForm(false); setEditing(null); setForm(emptyForm); setShowFormPassword(false);
      await loadUniversities();
    } catch (error) {
      console.error("University save error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please check your connection and try again.");
    }
    setSaving(false);
  }

  async function fetchUniversityPassword(universityId: string, forceRefresh = false): Promise<string> {
    const cached = passwordCache[universityId];
    if (cached && !forceRefresh) return cached;
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) throw new Error("Please sign in again.");
    const response = await fetch(`/api/university-credentials?universityId=${encodeURIComponent(universityId)}`, {
      method: "GET", headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load password.");
    if (typeof result.password !== "string") throw new Error("Invalid password response.");
    setPasswordCache((previous) => ({ ...previous, [universityId]: result.password }));
    return result.password;
  }

  async function toggleUniversityPassword(universityId: string) {
    if (passwordVisibility[universityId]) {
      setPasswordVisibility((previous) => ({ ...previous, [universityId]: false }));
      return;
    }
    try {
      setPasswordLoadingId(universityId); setErrorMessage("");
      await fetchUniversityPassword(universityId);
      setPasswordVisibility((previous) => ({ ...previous, [universityId]: true }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not reveal password.");
    } finally { setPasswordLoadingId(null); }
  }

  async function copyUniversityPassword(universityId: string) {
    try {
      setPasswordLoadingId(universityId); setErrorMessage("");
      const password = await fetchUniversityPassword(universityId);
      await navigator.clipboard.writeText(password);
      setMessage("Password copied successfully.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not copy password.");
    } finally { setPasswordLoadingId(null); }
  }

  async function deleteUniversity(university: University) {
    const confirmed = window.confirm(`Are you sure you want to delete ${university.university_name}?`);
    if (!confirmed) return;
    setErrorMessage(""); setMessage("");
    const { error } = await supabase.from("universities").delete().eq("id", university.id);
    if (error) { setErrorMessage(error.message); return; }
    setPasswordCache((previous) => { const updated = { ...previous }; delete updated[university.id]; return updated; });
    setPasswordVisibility((previous) => { const updated = { ...previous }; delete updated[university.id]; return updated; });
    setMessage("University deleted successfully.");
    await loadUniversities();
  }

  async function openNotes(university: University) {
    setNoteUniversity(university); setNoteText(""); setShowNotes(true); setErrorMessage("");
    const { data, error } = await supabase.from("university_notes").select("*")
      .eq("university_id", university.id).order("created_at", { ascending: false });
    if (error) { setErrorMessage(error.message); return; }
    setNotes((data || []) as UniversityNote[]);
  }

  async function saveNote() {
    if (!noteUniversity || !noteText.trim()) return;
    setSaving(true); setErrorMessage("");
    const { error } = await supabase.from("university_notes").insert({ university_id: noteUniversity.id, note: noteText.trim() });
    if (error) { setErrorMessage(error.message); setSaving(false); return; }
    await writeLog(noteUniversity.id, "Note Added", noteText.trim());
    setNoteText("");
    const { data } = await supabase.from("university_notes").select("*")
      .eq("university_id", noteUniversity.id).order("created_at", { ascending: false });
    setNotes((data || []) as UniversityNote[]);
    setMessage("Note saved successfully."); setSaving(false);
  }

  async function openLogs(university: University) {
    setLogUniversity(university); setShowLogs(true); setErrorMessage("");
    const { data, error } = await supabase.from("university_activity_logs").select("*")
      .eq("university_id", university.id).order("created_at", { ascending: false });
    if (error) { setErrorMessage(error.message); return; }
    setLogs((data || []) as UniversityLog[]);
  }

  function updateForm<K extends keyof UniversityForm>(key: K, value: UniversityForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function renderField(label: string, key: Exclude<keyof UniversityForm, "password">, placeholder: string, multiline = false) {
    return (
      <div>
        <label className={labelClass}>{label}</label>
        {multiline ? <textarea value={form[key]} onChange={(e) => updateForm(key, e.target.value)} className={inputClass} rows={3} placeholder={placeholder} />
          : <input value={form[key]} onChange={(e) => updateForm(key, e.target.value)} className={inputClass} placeholder={placeholder} />}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-full space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">University Details</h1>
          <p className="mt-1 text-sm text-slate-500">Manage university information in one row per university.</p>
        </div>
        <button onClick={startAdd} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">+ Add University Details</button>
      </div>

      {message && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
      {errorMessage && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-800">University List</h2>
            <p className="text-xs text-slate-500">{filteredUniversities.length} of {universities.length} universities</p>
          </div>
          <span className="text-xs text-slate-400">Filters update results automatically</span>
        </div>

        {/* Advanced University Search */}
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Advanced University Search</h3>
              <p className="mt-0.5 text-xs text-slate-500">Combine filters to narrow down the university list.</p>
            </div>
            <button type="button" onClick={resetFilters} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">Reset Filters</button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">University Name</label>
              <input value={search} onFocus={() => setNameSuggestionsOpen(true)}
                onChange={(e) => { setSearch(e.target.value); setNameSuggestionsOpen(true); }}
                placeholder="Type university name..." className={inputClass} />
              {nameSuggestionsOpen && search.trim() && suggestions.length > 0 && (
                <div className="absolute left-0 top-full z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                  {suggestions.map((name) => (
                    <button type="button" key={name} onClick={() => { setSearch(name); setNameSuggestionsOpen(false); }}
                      className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50">{name}</button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Province (A–Z)</label>
              <select value={provinceFilter} onChange={(e) => setProvinceFilter(e.target.value)} className={inputClass}>
                <option value="">All Provinces</option>
                {uniqueOptions.provinces.map((province) => <option key={province} value={province}>{province}</option>)}
              </select>
            </div>

            <MultiSelectDropdown label="Intake (Multiple)" options={uniqueOptions.intakes} value={intakeFilter} onChange={setIntakeFilter}  open={openFilterDropdown === "intake"} onToggle={() => setOpenFilterDropdown((current) => current === "intake" ? null : "intake")} onClose={() => setOpenFilterDropdown(null)}/>
            <MultiSelectDropdown label="Degree (Multiple)" options={uniqueOptions.degrees} value={degreeFilter} onChange={setDegreeFilter}  open={openFilterDropdown === "degree"} onToggle={() => setOpenFilterDropdown((current) => current === "degree" ? null : "degree")} onClose={() => setOpenFilterDropdown(null)}/>
            <MultiSelectDropdown label="Tuition Fee Type (Multiple)" options={uniqueOptions.tuition} value={tuitionFilter} onChange={setTuitionFilter}  open={openFilterDropdown === "tuition"} onToggle={() => setOpenFilterDropdown((current) => current === "tuition" ? null : "tuition")} onClose={() => setOpenFilterDropdown(null)}/>
            <MultiSelectDropdown label="Scholarship (Multiple)" options={uniqueOptions.scholarships} value={scholarshipFilter} onChange={setScholarshipFilter}  open={openFilterDropdown === "scholarship"} onToggle={() => setOpenFilterDropdown((current) => current === "scholarship" ? null : "scholarship")} onClose={() => setOpenFilterDropdown(null)}/>
            <MultiSelectDropdown label="Requirements (Multiple)" options={uniqueOptions.requirements} value={requirementsFilter} onChange={setRequirementsFilter}  open={openFilterDropdown === "requirements"} onToggle={() => setOpenFilterDropdown((current) => current === "requirements" ? null : "requirements")} onClose={() => setOpenFilterDropdown(null)}/>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Restricted Country (Exclude)</label>
              <select value={restrictedCountryFilter} onChange={(e) => setRestrictedCountryFilter(e.target.value)} className={inputClass}>
                <option value="">No Country Exclusion</option>
                {uniqueOptions.countries.map((country) => <option key={country} value={country}>{country}</option>)}
              </select>
              <p className="mt-1 text-[11px] text-slate-500">Universities restricting the selected country will be excluded.</p>
            </div>
          </div>
        </div>

        {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading universities...</p>
          : filteredUniversities.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">No universities found.</p>
          : (
            <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[2300px] border-collapse text-left text-sm">
                <thead className="bg-slate-100"><tr>{columns.map((column) => <th key={column} className="border-b border-r border-slate-200 px-3 py-3 text-xs font-bold text-slate-700">{column}</th>)}</tr></thead>
                <tbody>
                  {filteredUniversities.map((university, index) => (
                    <tr key={university.id} className="align-top hover:bg-blue-50/40">
                      <td className="border-b border-r border-slate-100 px-3 py-3 text-slate-600">{index + 1}</td>
                      <td className="min-w-[210px] border-b border-r border-slate-100 px-3 py-3 font-semibold text-slate-800">{university.university_name}</td>
                      <td className="min-w-[130px] border-b border-r border-slate-100 px-3 py-3">{university.province || "—"}</td>
                      <td className="min-w-[150px] border-b border-r border-slate-100 px-3 py-3">{displayList(university.intake)}</td>
                      <td className="min-w-[130px] border-b border-r border-slate-100 px-3 py-3">{displayList(university.degree)}</td>
                      <td className="min-w-[160px] border-b border-r border-slate-100 px-3 py-3">{displayList(university.tuition_fee_type)}</td>
                      <td className="min-w-[130px] border-b border-r border-slate-100 px-3 py-3">{university.type || "—"}</td>
                      <td className="min-w-[150px] border-b border-r border-slate-100 px-3 py-3">{displayList(university.scholarship)}</td>
                      <td className="min-w-[180px] border-b border-r border-slate-100 px-3 py-3">{displayList(university.requirements)}</td>
                      <td className="min-w-[190px] border-b border-r border-slate-100 px-3 py-3">{displayList(university.restricted_account_country)}</td>
                      <td className="min-w-[140px] border-b border-r border-slate-100 px-3 py-3">
                        {university.apply_link ? <a href={university.apply_link} target="_blank" rel="noreferrer" className="break-all font-medium text-blue-600 hover:underline">Open Link ↗</a> : "—"}
                      </td>
                      <td className="min-w-[130px] border-b border-r border-slate-100 px-3 py-3">{university.user_id || "—"}</td>
                      <td className="min-w-[150px] border-b border-r border-slate-100 px-3 py-3">{university.responsible_person || "—"}</td>
                      <td className="min-w-[170px] border-b border-r border-slate-100 px-3 py-3">
                        <div className="space-y-2">
                          <div className="break-all font-semibold tracking-wide text-slate-700">{passwordVisibility[university.id] ? passwordCache[university.id] || "" : "••••••••"}</div>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => toggleUniversityPassword(university.id)} disabled={passwordLoadingId === university.id} className="rounded bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50">
                              {passwordLoadingId === university.id ? "Loading..." : passwordVisibility[university.id] ? "Hide" : "Show"}
                            </button>
                            <button type="button" onClick={() => copyUniversityPassword(university.id)} disabled={passwordLoadingId === university.id} className="rounded bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50">
                              {passwordLoadingId === university.id ? "Wait..." : "Copy"}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="min-w-[190px] border-b border-slate-100 px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => openNotes(university)} className="rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100">Note</button>
                          <button onClick={() => openLogs(university)} className="rounded bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100">Log</button>
                          <button onClick={() => startEdit(university)} className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100">Edit</button>
                          <button onClick={() => deleteUniversity(university)} className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        <p className="mt-2 text-xs text-slate-400">Scroll horizontally to view all columns. Multiple values appear as separate list items inside the same cell.</p>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-6 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">{editing ? "Edit University Details" : "Add University Details"}</h2>
              <button onClick={() => setShowForm(false)} className="text-2xl text-slate-400 hover:text-slate-700">×</button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {renderField("University Name *", "university_name", "University name")}
              {renderField("Province", "province", "e.g. Hefei")}
              {renderField("Intake (one item per line)", "intake", "Mar. 2025\nSep. 2025", true)}
              {renderField("Degree (one item per line)", "degree", "Bachelor\nMaster", true)}
              {renderField("Tuition Fee Type (one item per line)", "tuition_fee_type", "Partial Free\nAccommodation", true)}
              {renderField("Type", "type", "e.g. Personal")}
              {renderField("Scholarship (one item per line)", "scholarship", "Belt and Road\nUniversity Scholarship", true)}
              {renderField("Requirements (one item per line)", "requirements", "Age Limit\nHSK", true)}
              {renderField("Restricted Account Country (one item per line)", "restricted_account_country", "Afghanistan\nAlbania", true)}
              {renderField("Apply Link", "apply_link", "https://...")}
              {renderField("User ID", "user_id", "University account user ID")}
              {renderField("Responsible Person", "responsible_person", "Employee name")}
              <div>
                <label className={labelClass}>Password</label>
                <div className="flex gap-2">
                  <input type={showFormPassword ? "text" : "password"} value={form.password} onChange={(e) => updateForm("password", e.target.value)} placeholder="Enter university portal password" className={inputClass} />
                  <button type="button" onClick={() => setShowFormPassword((previous) => !previous)} className="rounded-lg border border-slate-300 px-3 text-sm">{showFormPassword ? "Hide" : "Show"}</button>
                </div>
                {editing && <p className="mt-1 text-xs text-slate-500">Leave blank to keep the existing password.</p>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button>
              <button onClick={saveUniversity} disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save University"}</button>
            </div>
          </div>
        </div>
      )}

      {showNotes && noteUniversity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 className="text-lg font-bold text-slate-800">University Notes</h2><p className="text-xs text-slate-500">{noteUniversity.university_name}</p></div>
              <button onClick={() => setShowNotes(false)} className="text-2xl text-slate-400">×</button>
            </div>
            <label className={labelClass}>Add New Note</label>
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} className={inputClass} placeholder="Write a note..." />
            <button onClick={saveNote} disabled={saving || !noteText.trim()} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save Note"}</button>
            <div className="mt-5 space-y-3">
              <h3 className="font-semibold text-slate-700">Previous Notes</h3>
              {notes.length === 0 ? <p className="text-sm text-slate-400">No notes yet.</p> : notes.map((note) => (
                <div key={note.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{note.note}</p>
                  <p className="mt-2 text-xs text-slate-400">{new Date(note.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showLogs && logUniversity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 className="text-lg font-bold text-slate-800">University Activity Log</h2><p className="text-xs text-slate-500">{logUniversity.university_name}</p></div>
              <button onClick={() => setShowLogs(false)} className="text-2xl text-slate-400">×</button>
            </div>
            {logs.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">No activity recorded yet.</p> : (
              <div className="space-y-3">{logs.map((log) => (
                <div key={log.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-semibold text-slate-800">{log.action}</p>
                  {log.details && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{log.details}</p>}
                  <p className="mt-2 text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</p>
                </div>
              ))}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
