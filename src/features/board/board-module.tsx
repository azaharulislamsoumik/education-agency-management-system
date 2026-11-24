
"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { APPLICATION_STATUSES } from "@/lib/application-statuses";

const STATUS_OPTIONS = APPLICATION_STATUSES;
const PAYMENT_OPTIONS = ["Unpaid", "Paid", "Partial"];
const PRIORITY_OPTIONS = ["Normal", "Urgent", "In-China"];

type ApplicationRow = {
  id: string;
  student_id: string;
  intake?: string | null;
  university_id?: string | null;
  degree_level?: string | null;
  program_name?: string | null;
  priority?: string | null;
  payment?: string | null;
  applied_date?: string | null;
  responsible_person?: string | null;
  application_status?: string | null;
  created_at?: string | null;
  student?: any;
  university_name?: string;
};

type Filters = {
  studentName: string;
  passport: string;
  nationality: string;
  email: string;
  intake: string;
  university: string;
  degree: string;
  program: string;
  fromDate: string;
  toDate: string;
  payment: string;
  priority: string;
  agent: string;
};

const EMPTY_FILTERS: Filters = {
  studentName: "",
  passport: "",
  nationality: "",
  email: "",
  intake: "",
  university: "",
  degree: "",
  program: "",
  fromDate: "",
  toDate: "",
  payment: "",
  priority: "",
  agent: "",
};

// Matches the Student Module filter styling
const inputClass =
  "h-10 min-w-0 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500";
const labelClass = "block shrink-0 text-xs font-medium text-slate-600";

export default function BoardModule({
  statusFilter = "",
}: {
  statusFilter?: string;
}) {
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
  });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [employee, setEmployee] = useState<any>(null);
  const [showApply, setShowApply] = useState(false);
  const [duplicatePopup, setDuplicatePopup] = useState(false);
  const [activePopup, setActivePopup] = useState<"notes" | "log" | null>(null);
  const [popupRow, setPopupRow] = useState<ApplicationRow | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");

  const [form, setForm] = useState({
    passport: "",
    full_name: "",
    nationality: "",
    email: "",
    agent: "",
    intake: "",
    university_id: "",
    degree_level: "",
    program_name: "",
    payment: "Unpaid",
    priority: "Medium",
  });

  const [studentMatches, setStudentMatches] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);

  const loadEmployee = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) return;

    const { data } = await supabase
      .from("employees")
      .select("id, full_name, role, is_active")
      .eq("auth_user_id", auth.user.id)
      .maybeSingle();

    setEmployee(data || null);
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const f = appliedFilters;

      let query = supabase
        .from("applications")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      const activeStatus = statusFilter || "";

      if (activeStatus === "Completed") {
        query = query.in("application_status", [
          "Completed",
          "Admitted",
          "Admission Letter",
          "Admission Letter & JW",
          "Cancel",
          "Pre-Admission",
          "Rejected",
          "Interview",
          "Pay application fee",
        ]);
      } else if (activeStatus === "Submit") {
        query = query.in("application_status", ["Submit", "Revoke"]);
      } else if (activeStatus) {
        query = query.eq("application_status", activeStatus.trim());
      }

      if (f.intake.trim()) {
        query = query.ilike("intake", `%${f.intake.trim()}%`);
      }

      if (f.degree.trim()) {
        query = query.ilike("degree_level", `%${f.degree.trim()}%`);
      }

      if (f.program.trim()) {
        query = query.ilike("program_name", `%${f.program.trim()}%`);
      }

      if (f.payment) {
        query = query.eq("payment", f.payment);
      }

      if (f.priority) {
        query = query.eq("priority", f.priority);
      }

      if (f.fromDate) {
        query = query.gte("applied_date", f.fromDate);
      }

      if (f.toDate) {
        query = query.lte("applied_date", f.toDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const applications = data || [];

      const studentIds = [
        ...new Set(
          applications.map((a: any) => a.student_id).filter(Boolean)
        ),
      ];

      const universityIds = [
        ...new Set(
          applications.map((a: any) => a.university_id).filter(Boolean)
        ),
      ];

      let studentMap: Record<string, any> = {};
      let universityMap: Record<string, string> = {};

      if (studentIds.length) {
        const { data: students, error: studentError } = await supabase
          .from("students")
          .select(
            "id, full_name, passport_number, nationality, email, agent_name"
          )
          .in("id", studentIds);

        if (studentError) throw studentError;

        (students || []).forEach((s: any) => {
          studentMap[s.id] = s;
        });
      }

      if (universityIds.length) {
        const { data: unis } = await supabase
          .from("universities")
          .select("id, university_name")
          .in("id", universityIds);

        (unis || []).forEach((u: any) => {
          universityMap[u.id] = u.university_name;
        });
      }

      let merged = applications.map((a: any) => ({
        ...a,
        student: studentMap[a.student_id] || {},
        university_name: universityMap[a.university_id] || "",
      }));

      // Restrict Agent to their own assigned students
      if (employee?.role === "agent") {
        merged = merged.filter(
          (a: any) => a.student?.agent_name === employee.full_name
        );
      }

      if (f.studentName.trim()) {
        merged = merged.filter((a) =>
          (a.student?.full_name || "")
            .toLowerCase()
            .includes(f.studentName.toLowerCase())
        );
      }

      if (f.passport.trim()) {
        merged = merged.filter((a) =>
          (a.student?.passport_number || "")
            .toLowerCase()
            .includes(f.passport.toLowerCase())
        );
      }

      if (f.nationality.trim()) {
        merged = merged.filter((a) =>
          (a.student?.nationality || "")
            .toLowerCase()
            .includes(f.nationality.toLowerCase())
        );
      }

      if (f.email.trim()) {
        merged = merged.filter((a) =>
          (a.student?.email || "")
            .toLowerCase()
            .includes(f.email.toLowerCase())
        );
      }

      if (f.agent.trim()) {
        merged = merged.filter((a) =>
          (a.student?.agent_name || "")
            .toLowerCase()
            .includes(f.agent.toLowerCase())
        );
      }

      if (f.university.trim()) {
        merged = merged.filter((a) =>
          (a.university_name || "")
            .toLowerCase()
            .includes(f.university.toLowerCase())
        );
      }

      setRows(merged);
      setPage(1);
    } catch (e: any) {
      setMessage(e.message || "Unable to load applications.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, statusFilter, employee]);

  useEffect(() => {
    void loadEmployee();
  }, [loadEmployee]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  useEffect(() => {
    void supabase
      .from("universities")
      .select("id, university_name")
      .order("university_name")
      .then(({ data }) => setUniversities(data || []));
  }, []);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  const visibleRows = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page]
  );

  function changeFilter(key: keyof Filters, value: string) {
    setFilters((old) => ({ ...old, [key]: value }));
  }

  async function updateApplication(
    id: string,
    field: string,
    value: string
  ) {
    const { error } = await supabase
      .from("applications")
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (field === "application_status") {
      await loadRows();
    } else {
      setRows((old) =>
        old.map((row) =>
          row.id === id ? { ...row, [field]: value } : row
        )
      );
    }

    setMessage(
      `${field === "application_status" ? "Status" : "Payment"} updated.`
    );
  }

  async function handleDone(row: ApplicationRow) {
    const actualStatus =
      row.application_status || statusFilter || "Pending";

    const groupedSpecialStatuses = [
      "Admitted",
      "Admission Letter",
      "Admission Letter & JW",
      "Cancel",
      "Pre-Admission",
      "Rejected",
      "Interview",
      "Pay application fee",
      "Revoke",
    ];

    // These statuses are displayed inside Completed/Submit by grouping only.
    // Keep their actual database status unchanged when the Done button is clicked.
    if (groupedSpecialStatuses.includes(actualStatus)) {
      setMessage(
        `This application keeps its actual status: ${actualStatus}.`
      );
      return;
    }

    const previousStatus = actualStatus;
    const nextStatus =
      statusFilter === "Document Review" ? "Submit" : "Completed";

    const studentName = row.student?.full_name || "Student";
    const passportNumber = row.student?.passport_number || "N/A";

    setSaving(true);
    setMessage("");

    try {
      const { error: updateError } = await supabase
        .from("applications")
        .update({ application_status: nextStatus })
        .eq("id", row.id);

      if (updateError) throw updateError;

      if (statusFilter === "Document Review") {
        const { error: logError } = await supabase
          .from("student_activity_logs")
          .insert({
            student_id: row.student_id,
            employee_id: employee?.id || null,
            action: "Document Review Completed",
            description: `Student: ${studentName}; Passport: ${passportNumber}; Application ID: ${row.id}; Status changed from ${previousStatus} to ${nextStatus} by Done button.`,
          });

        if (logError) {
          setMessage(
            `Status moved to Submit, but the automatic log could not be saved: ${logError.message}`
          );

          await loadRows();
          return;
        }

        setMessage(
          `${studentName}'s application moved to Submit and the activity log was saved.`
        );
      } else {
        setMessage(
          `${studentName}'s application marked as Completed.`
        );
      }

      await loadRows();
    } catch (error: any) {
      setMessage(
        error?.message || "Unable to complete this application."
      );
    } finally {
      setSaving(false);
    }
  }

  async function findStudent() {
    if (!form.passport.trim()) {
      setMessage("Enter passport number first.");
      return;
    }

    const { data, error } = await supabase
      .from("students")
      .select(
        "id, full_name, passport_number, nationality, email, agent_name"
      )
      .ilike("passport_number", `%${form.passport.trim()}%`)
      .limit(10);

    if (error) {
      setMessage(error.message);
      return;
    }

    setStudentMatches(data || []);

    if (data?.length === 1) {
      const s = data[0];

      setForm((old) => ({
        ...old,
        full_name: s.full_name || "",
        nationality: s.nationality || "",
        email: s.email || "",
        agent: s.agent_name || "",
      }));
    }

    if (!data?.length) {
      setMessage(
        "No student found with this passport. Add the student from Student Module first."
      );
    }
  }

  async function submitApplication(e: FormEvent) {
    e.preventDefault();
    setMessage("");

    const matched = studentMatches.find(
      (s) =>
        s.passport_number?.toLowerCase() ===
        form.passport.trim().toLowerCase()
    );

    if (!matched) {
      setMessage(
        "Please search and select an existing student by passport number."
      );
      return;
    }

    if (
      !form.intake ||
      !form.university_id ||
      !form.degree_level ||
      !form.program_name
    ) {
      setMessage(
        "Please complete Intake, University, Degree and Program."
      );
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("applications")
        .insert({
          student_id: matched.id,
          intake: form.intake,
          university_id: form.university_id,
          degree_level: form.degree_level,
          program_name: form.program_name,
          payment: form.payment,
          priority: form.priority,
          application_status: "Pending",
          applied_date: new Date().toISOString().slice(0, 10),
          responsible_person: employee?.full_name || null,
        });

      if (error) {
        if (
          error.code === "23505" ||
          error.message?.includes(
            "applications_prevent_duplicates"
          )
        ) {
          setDuplicatePopup(true);
          setMessage("");
        } else {
          setMessage(error.message);
        }
      } else {
        setShowApply(false);

        setForm({
          passport: "",
          full_name: "",
          nationality: "",
          email: "",
          agent: "",
          intake: "",
          university_id: "",
          degree_level: "",
          program_name: "",
          payment: "Unpaid",
          priority: "Medium",
        });

        setStudentMatches([]);
        setMessage("Application added successfully.");

        await loadRows();
      }
    } finally {
      setSaving(false);
    }
  }

  async function openNotes(row: ApplicationRow) {
    setPopupRow(row);
    setActivePopup("notes");
    setNewNote("");
    setNotes([]);

    const { data, error } = await supabase
      .from("student_notes")
      .select("id, note, created_at, employee_id, employees(full_name)")
      .eq("student_id", row.student_id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setNotes(data || []);
    }
  }

  async function openLogs(row: ApplicationRow) {
    setPopupRow(row);
    setActivePopup("log");
    setLogs([]);

    const { data, error } = await supabase
      .from("student_activity_logs")
      .select(
        "id, action, description, created_at, employee_id, employees(full_name)"
      )
      .eq("student_id", row.student_id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setLogs(data || []);
    }
  }

  async function addNote() {
    if (!popupRow?.student_id || !employee?.id || !newNote.trim()) {
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("student_notes")
      .insert({
        student_id: popupRow.student_id,
        employee_id: employee.id,
        note: newNote.trim(),
      });

    if (error) {
      setMessage(error.message);
    } else {
      setNewNote("");
      await openNotes(popupRow);
      setMessage("Note saved.");
    }

    setSaving(false);
  }

  const statusHeading = statusFilter || "All Applications";

  return (
    <div className="min-h-full space-y-3 rounded-xl bg-slate-100 p-2 sm:p-3">
      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-800">
              {statusHeading}
            </h2>
            <p className="text-[11px] text-slate-500">
              Search and manage student applications
            </p>
          </div>

          <button
            onClick={() => {
              setShowApply(true);
              setMessage("");
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-[11px] font-bold text-white shadow-md shadow-indigo-100 transition hover:bg-indigo-700"
          >
            Add new apply
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {(
            [
              ["studentName", "Student Name", "text"],
              ["passport", "Passport", "text"],
              ["nationality", "Nationality", "text"],
              ["email", "Email", "text"],
              ["intake", "Intake", "text"],
              ["university", "University", "text"],
              ["degree", "Degree", "text"],
              ["program", "Program", "text"],
              ["fromDate", "From Date", "date"],
              ["toDate", "To Date", "date"],
            ] as [keyof Filters, string, string][]
          ).map(([key, title, type]) => (
            <label
              key={key}
              className="grid min-w-0 grid-cols-[78px_minmax(0,1fr)] items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1"
            >
              <span className={labelClass}>{title}</span>
              <input
                type={type}
                value={filters[key]}
                onChange={(e) => changeFilter(key, e.target.value)}
                className={inputClass}
              />
            </label>
          ))}

          <label className="grid min-w-0 grid-cols-[78px_minmax(0,1fr)] items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
            <span className={labelClass}>Payment Status</span>
            <select
              value={filters.payment}
              onChange={(e) => changeFilter("payment", e.target.value)}
              className={inputClass}
            >
              <option value="">All</option>
              {PAYMENT_OPTIONS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>

          <label className="grid min-w-0 grid-cols-[78px_minmax(0,1fr)] items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
            <span className={labelClass}>Priority</span>
            <select
              value={filters.priority}
              onChange={(e) => changeFilter("priority", e.target.value)}
              className={inputClass}
            >
              <option value="">All</option>
              {PRIORITY_OPTIONS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>

          <label className="grid min-w-0 grid-cols-[78px_minmax(0,1fr)] items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
            <span className={labelClass}>Agent</span>
            <input
              value={filters.agent}
              onChange={(e) => changeFilter("agent", e.target.value)}
              className={inputClass}
            />
          </label>

          <div className="flex items-end gap-2 sm:col-span-2 sm:col-span-2 xl:col-span-2 xl:justify-end">
            <button
              onClick={() => setAppliedFilters({ ...filters })}
              className="min-w-28 rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Search
            </button>

            <button
              onClick={() => {
                setFilters({ ...EMPTY_FILTERS });
                setAppliedFilters({ ...EMPTY_FILTERS });
              }}
              className="min-w-28 rounded-lg bg-rose-500 px-6 py-2 text-[14px] font-bold tracking-wide text-white shadow-sm transition hover:bg-rose-600"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {message && (
        <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          {message}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-max min-w-full table-auto border-collapse text-center text-sm text-slate-700">
            <thead className="bg-indigo-50 text-slate-800">
              <tr>
                {[
                  "S.N.",
                  "Student Name",
                  "Passport",
                  "Nationality",
                  "Email",
                  "Intake",
                  "University",
                  "Degree",
                  "Program",
                  "Payment",
                  "Agent",
                  "Responsible Person",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap border border-slate-200 px-2 py-2.5 font-bold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={13} className="py-8 text-slate-400">
                    Loading applications...
                  </td>
                </tr>
              )}

              {!loading &&
                visibleRows.map((a, i) => (
                  <tr
                    key={a.id}
                    className={`h-9 transition-colors hover:bg-indigo-50 ${
                      a.priority === "High"
                        ? "bg-rose-50 text-rose-700"
                        : a.priority === "Medium"
                          ? "bg-amber-50/50"
                          : "odd:bg-white even:bg-slate-50"
                    }`}
                  >
                    <td className="border border-slate-200 px-1.5 py-1">
                      {(page - 1) * pageSize + i + 1}
                    </td>

                    <td className="max-w-[240px] break-words border border-slate-200 px-1.5 py-1 font-semibold">
                      <span className="block break-words">
                        {a.student?.full_name || "—"}
                      </span>
                    </td>

                    <td className="border border-slate-200 px-1.5 py-1">
                      {a.student?.passport_number || "—"}
                    </td>

                    <td className="border border-slate-200 px-1.5 py-1">
                      {a.student?.nationality || "—"}
                    </td>

                    <td className="max-w-[220px] whitespace-normal break-words border border-slate-200 px-1.5 py-1">
                      {a.student?.email || "—"}
                    </td>

                    <td className="border border-slate-200 px-1.5 py-1">
                      {a.intake || "—"}
                    </td>

                    <td className="max-w-[220px] whitespace-normal break-words border border-slate-200 px-1.5 py-1">
                      {a.university_name || "—"}
                    </td>

                    <td className="border border-slate-200 px-1.5 py-1">
                      {a.degree_level || "—"}
                    </td>

                    <td className="max-w-[200px] whitespace-normal break-words border border-slate-200 px-1.5 py-1">
                      {a.program_name || "—"}
                    </td>

                    <td className="border border-slate-200 px-1.5 py-1">
                      <select
                        value={a.payment || ""}
                        onChange={(e) =>
                          void updateApplication(
                            a.id,
                            "payment",
                            e.target.value
                          )
                        }
                        className="w-full bg-transparent"
                      >
                        <option value="">—</option>
                        {PAYMENT_OPTIONS.map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </td>

                    <td className="border border-slate-200 px-1.5 py-1">
                      {a.student?.agent_name || "—"}
                    </td>

                    <td className="border border-slate-200 px-1.5 py-1">
                      {a.responsible_person || "—"}
                    </td>

                    <td className="border border-slate-200 px-1.5 py-1">
                      <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                        <button
                          onClick={() => void openNotes(a)}
                          className="font-semibold text-indigo-700 hover:underline"
                        >
                          Note
                        </button>

                        <button
                          onClick={() => void openLogs(a)}
                          className="font-semibold text-violet-700 hover:underline"
                        >
                          Log
                        </button>

                        <select
                          aria-label="Application status"
                          value={a.application_status || "Pending"}
                          onChange={(e) =>
                            void updateApplication(
                              a.id,
                              "application_status",
                              e.target.value
                            )
                          }
                          className="max-w-[105px] rounded border border-slate-200 bg-white px-1 py-0.5 text-indigo-700"
                        >
                          <option value="">Status</option>
                          {STATUS_OPTIONS.map((x) => (
                            <option key={x}>{x}</option>
                          ))}
                        </select>

                        <button
                          disabled={saving}
                          onClick={() => void handleDone(a)}
                          className="font-semibold text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Done
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && visibleRows.length === 0 && (
                <tr>
                  <td colSpan={13} className="py-10 text-slate-400">
                    No applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
          <span>
            Showing{" "}
            {rows.length ? (page - 1) * pageSize + 1 : 0}-
            {Math.min(page * pageSize, rows.length)} of {rows.length}
          </span>

          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(1)}
              className="rounded border px-2 py-1 disabled:opacity-40"
            >
              «
            </button>

            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border px-2 py-1 disabled:opacity-40"
            >
              ‹
            </button>

            <span className="rounded-md bg-indigo-600 px-3 py-1 font-bold text-white shadow-sm">
              {page}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border px-2 py-1 disabled:opacity-40"
            >
              ›
            </button>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              className="rounded border px-2 py-1 disabled:opacity-40"
            >
              »
            </button>
          </div>
        </div>
      </section>

      {showApply && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 p-3 backdrop-blur-[2px]">
          <form
            onSubmit={submitApplication}
            className="max-h-[92vh] w-full max-w-md overflow-y-auto border border-slate-300 bg-white p-5 shadow-2xl"
          >
            <h3 className="mb-4 text-center text-sm font-bold text-slate-800">
              Add New Apply
            </h3>

            <div className="space-y-2">
              <label>
                <span className={labelClass}>Priority *</span>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm((o) => ({ ...o, priority: e.target.value }))
                  }
                  className={inputClass}
                >
                  {PRIORITY_OPTIONS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>

              <label>
                <span className={labelClass}>Passport *</span>
                <div className="flex gap-2">
                  <input
                    required
                    value={form.passport}
                    onChange={(e) =>
                      setForm((o) => ({
                        ...o,
                        passport: e.target.value,
                      }))
                    }
                    className={inputClass}
                  />

                  <button
                    type="button"
                    onClick={() => void findStudent()}
                    className="shrink-0 rounded bg-blue-600 px-3 text-[10px] font-bold text-white"
                  >
                    Find
                  </button>
                </div>
              </label>

              {studentMatches.length > 1 && (
                <label>
                  <span className={labelClass}>Select Student *</span>
                  <select
                    className={inputClass}
                    onChange={(e) => {
                      const s = studentMatches.find(
                        (x) => x.id === e.target.value
                      );

                      if (s) {
                        setForm((o) => ({
                          ...o,
                          passport: s.passport_number || "",
                          full_name: s.full_name || "",
                          nationality: s.nationality || "",
                          email: s.email || "",
                          agent: s.agent_name || "",
                        }));
                      }
                    }}
                  >
                    <option value="">Select student</option>
                    {studentMatches.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} — {s.passport_number}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                <span className={labelClass}>Full Name *</span>
                <input
                  readOnly
                  value={form.full_name}
                  className={inputClass}
                />
              </label>

              <label>
                <span className={labelClass}>Nationality *</span>
                <input
                  readOnly
                  value={form.nationality}
                  className={inputClass}
                />
              </label>

              <label>
                <span className={labelClass}>Email *</span>
                <input
                  readOnly
                  value={form.email}
                  className={inputClass}
                />
              </label>

              <label>
                <span className={labelClass}>Agent</span>
                <input
                  readOnly
                  value={form.agent}
                  className={inputClass}
                />
              </label>

              <label>
                <span className={labelClass}>Intake *</span>
                <input
                  required
                  value={form.intake}
                  onChange={(e) =>
                    setForm((o) => ({ ...o, intake: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="e.g. September 2027"
                />
              </label>

              <label>
                <span className={labelClass}>University *</span>
                <select
                  required
                  value={form.university_id}
                  onChange={(e) =>
                    setForm((o) => ({
                      ...o,
                      university_id: e.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">Select University</option>
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.university_name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className={labelClass}>Degree *</span>
                <input
                  required
                  value={form.degree_level}
                  onChange={(e) =>
                    setForm((o) => ({
                      ...o,
                      degree_level: e.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="Bachelor / Master / PhD"
                />
              </label>

              <label>
                <span className={labelClass}>Program *</span>
                <input
                  required
                  value={form.program_name}
                  onChange={(e) =>
                    setForm((o) => ({
                      ...o,
                      program_name: e.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>

              <label>
                <span className={labelClass}>Payment *</span>
                <select
                  value={form.payment}
                  onChange={(e) =>
                    setForm((o) => ({ ...o, payment: e.target.value }))
                  }
                  className={inputClass}
                >
                  {PAYMENT_OPTIONS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowApply(false);
                  setStudentMatches([]);
                }}
                className="rounded-full bg-rose-500 px-5 py-1.5 text-[11px] font-bold text-white"
              >
                Clear / Close
              </button>

              <button
                disabled={saving}
                className="rounded-full bg-violet-600 px-5 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      )}

      {duplicatePopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <span className="text-3xl">⚠️</span>
            </div>

            <h2 className="mb-2 text-lg font-bold text-amber-700">
              Duplicate Application
            </h2>

            <p className="mb-5 text-sm leading-6 text-slate-600">
              This student has already applied to this university
              for the same intake, program, and degree.
              Duplicate applications are not allowed.
            </p>

            <button
              type="button"
              onClick={() => setDuplicatePopup(false)}
              className="rounded-lg bg-amber-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {activePopup && popupRow && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/25 p-3 backdrop-blur-[2px]">
          <section className="flex max-h-[88vh] w-full max-w-xl flex-col border border-blue-400 bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="w-full text-center text-sm font-bold underline">
                {activePopup === "notes" ? "Notes" : "Log"}
              </h3>

              <button
                onClick={() => setActivePopup(null)}
                className="ml-3 text-lg text-slate-500"
              >
                ×
              </button>
            </div>

            <p className="mb-2 text-center text-[10px] text-slate-500">
              {popupRow.student?.full_name || "Student"} —{" "}
              {popupRow.student?.passport_number || ""}
            </p>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto border border-rose-100 p-2">
              {activePopup === "notes"
                ? notes.map((n) => (
                    <article
                      key={n.id}
                      className="border border-rose-200 bg-rose-50/40 p-2 text-[11px]"
                    >
                      <b>{n.employees?.full_name || "Employee"}</b>

                      <span className="ml-2 text-[9px] text-slate-400">
                        {n.created_at
                          ? new Date(n.created_at).toLocaleString()
                          : ""}
                      </span>

                      <p className="mt-1 whitespace-pre-wrap">
                        {n.note}
                      </p>
                    </article>
                  ))
                : logs.map((l) => (
                    <article
                      key={l.id}
                      className="border border-rose-200 bg-rose-50/40 p-2 text-[11px]"
                    >
                      <b>{l.employees?.full_name || "Employee"}</b>

                      <span className="ml-2 text-[9px] text-slate-400">
                        {l.created_at
                          ? new Date(l.created_at).toLocaleString()
                          : ""}
                      </span>

                      <p className="mt-1">
                        {l.action}: {l.description || ""}
                      </p>
                    </article>
                  ))}

              {activePopup === "notes" && notes.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">
                  No notes yet.
                </p>
              )}

              {activePopup === "log" && logs.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">
                  No activity logs found.
                </p>
              )}
            </div>

            {activePopup === "notes" && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  placeholder="Write a note..."
                  className="w-full resize-y border border-slate-300 bg-[#e8fbff] p-2 text-xs outline-none focus:border-blue-400"
                />

                <div className="text-center">
                  <button
                    disabled={saving || !newNote.trim()}
                    onClick={() => void addNote()}
                    className="rounded-full bg-violet-600 px-5 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Add Note"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
