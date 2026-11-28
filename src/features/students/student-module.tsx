"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { APPLICATION_STATUSES } from "@/lib/application-statuses";

const DOCUMENT_CATEGORIES = [
  "Passports", "Visa", "Certificates", "Transcripts",
  "Medical Certificates", "Police Clearance",
  "English Proficiency", "Bank Statements",
  "Resume / Awards", "SOP", "Recommendation",
  "Videos", "Others", "Pre-admission", "Admission Letter",
];

const STUDENT_FIELDS = [
  ["surname", "Surname", "text"],
  ["given_name", "Given name", "text"],
  ["passport_number", "Passport No", "text"],
  ["passport_issue_date", "Issue Date", "date"],
  ["passport_expiry_date", "Expiry Date", "date"],
  ["visa_number", "Visa No", "text"],
  ["visa_issue_date", "Visa Issue Date", "date"],
  ["visa_expiry_date", "Visa Expiry Date", "date"],
  ["country", "Country", "text"],
  ["nationality", "Nationality", "text"],
  ["place_of_birth", "Place of birth", "text"],
  ["date_of_birth", "Date of birth", "date"],
  ["gender", "Gender", "select"],
  ["religion", "Religion", "text"],
  ["marital_status", "Marital status", "select"],
  ["health_status", "Health status", "text"],
  ["native_language", "Native language", "text"],
  ["email", "Email", "email"],
  ["phone", "Phone", "text"],
  ["occupation", "Occupation", "text"],
  ["present_address", "Present address", "text"],
  ["present_post_code", "Post code", "text"],
  ["permanent_address", "Permanent address", "text"],
  ["permanent_post_code", "Post code", "text"],
];

const FAMILY_FIELDS = [
  ["name", "Name"],
  ["country", "Country"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["date_of_birth", "Date of birth"],
  ["occupation", "Occupation"],
  ["current_employer", "Current employer"],
  ["address", "Address"],
];

const EMPTY_STUDENT: any = {
  surname: "",
  given_name: "",
  full_name: "",
  passport_number: "",
  passport_issue_date: "",
  passport_expiry_date: "",
  visa_number: "",
  visa_issue_date: "",
  visa_expiry_date: "",
  country: "",
  nationality: "",
  place_of_birth: "",
  date_of_birth: "",
  gender: "",
  religion: "",
  marital_status: "",
  health_status: "",
  native_language: "",
  email: "",
  phone: "",
  occupation: "",
  present_address: "",
  present_post_code: "",
  permanent_address: "",
  permanent_post_code: "",
  receiving_date: "",
  agent_employee_id: null,
  agent_name: "",
  student_notes: "",
  father_information: {},
  mother_information: {},
  education_history: [],
  language_proficiency: {},
  employment_information: {},
};

const EMPTY_EDUCATION = {
  degree_type: "",
  institution_name: "",
  learning_start: "",
  learning_end: "",
  country: "",
  major: "",
  score: "",
  grade_percentage: "",
  issue_date: "",
};

type FilterState = {
  studentName: string;
  passport: string;
  nationality: string;
  email: string;
  gender: string;
  phone: string;
  intake: string;
  degree: string;
  fromDate: string;
  toDate: string;
  currentStatus: string;
  agent: string;
};

const EMPTY_FILTERS: FilterState = {
  studentName: "",
  passport: "",
  nationality: "",
  email: "",
  gender: "",
  phone: "",
  intake: "",
  degree: "",
  fromDate: "",
  toDate: "",
  currentStatus: "",
  agent: "",
};

export default function StudentModule({
  openStudentId = null,
}: {
  openStudentId?: string | null;
}) {
  const [students, setStudents] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [employee, setEmployee] = useState<any>(null);
  const [filterAgents, setFilterAgents] = useState<any[]>([]);
  const [nationalityOptions, setNationalityOptions] = useState<string[]>([]);
  const [intakeOptions, setIntakeOptions] = useState<string[]>([]);
  const [degreeOptions, setDegreeOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [saving, setSaving] = useState(false);

  const [screen, setScreen] = useState<"list" | "form" | "view">("list");
  const [student, setStudent] = useState<any>(EMPTY_STUDENT);
  const [selected, setSelected] = useState<any>(null);

  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({ ...EMPTY_FILTERS });
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const listRequestId = useRef(0);

  const [documents, setDocuments] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [editingApplicationId, setEditingApplicationId] = useState<string | null>(null);
const [applicationDraft, setApplicationDraft] = useState<{
  payment: string;
  application_status: string;
}>({
  payment: "",
  application_status: "",
});
const [savingApplication, setSavingApplication] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const [message, setMessage] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [documentFiles, setDocumentFiles] = useState<Record<string, File[]>>({});
  const passportScanInputRef = useRef<HTMLInputElement | null>(null);

  const [photoUrl, setPhotoUrl] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");

  const [noteText, setNoteText] = useState("");
  const [activePopup, setActivePopup] = useState<"notes" | "log" | null>(null);
  const [popupStudent, setPopupStudent] = useState<any>(null);
  const [popupNotes, setPopupNotes] = useState<any[]>([]);
  const [popupLogs, setPopupLogs] = useState<any[]>([]);
  const [newPopupNote, setNewPopupNote] = useState("");

  const [educationRows, setEducationRows] = useState<any[]>([
    { ...EMPTY_EDUCATION },
  ]);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!loading && openStudentId) {
      void openStudent({ id: openStudentId });
    }
  }, [loading, openStudentId]);

  useEffect(() => {
    if (!loading && screen === "list") {
      void loadStudents();
    }
  }, [loading, screen, appliedFilters, page]);

  
  async function initialize() {
    setLoading(true);

    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error("Authentication loading error:", authError.message);
        setLoading(false);
        return;
      }

      if (!auth.user) {
        setEmployee(null);
        setLoading(false);
        return;
      }

      const { data: emp, error: employeeError } = await supabase
        .from("employees")
        .select("id, full_name, role, is_active")
        .eq("auth_user_id", auth.user.id)
        .maybeSingle();

      if (employeeError) {
        console.error("Employee loading error:", employeeError.message);
      }

      setEmployee(emp || null);

      // Show the Student List without waiting for dropdown options.
      setLoading(false);

      // Load dropdown options in the background.
      void (async () => {
        const nationalityTask = (async () => {
          const nationalitySet = new Set<string>();

          for (let from = 0; ; from += 1000) {
            const { data, error } = await supabase
              .from("students")
              .select("nationality")
              .not("nationality", "is", null)
              .range(from, from + 999);

            if (error) {
              console.error("Nationality loading error:", error.message);
              break;
            }

            (data || []).forEach((row: any) => {
              const value = row.nationality?.trim();
              if (value) nationalitySet.add(value);
            });

            if (!data || data.length < 1000) break;
          }

          setNationalityOptions([...nationalitySet].sort());
        })();

        const applicationOptionsTask = (async () => {
          const intakeSet = new Set<string>();
          const degreeSet = new Set<string>();

          for (let from = 0; ; from += 1000) {
            const { data, error } = await supabase
              .from("applications")
              .select("intake, degree_level")
              .range(from, from + 999);

            if (error) {
              console.error("Application options loading error:", error.message);
              break;
            }

            (data || []).forEach((row: any) => {
              const intake = row.intake?.trim();
              const degree = row.degree_level?.trim();

              if (intake) intakeSet.add(intake);
              if (degree) degreeSet.add(degree);
            });

            if (!data || data.length < 1000) break;
          }

          setIntakeOptions([...intakeSet].sort());
          setDegreeOptions([...degreeSet].sort());
        })();

        const filterAgentsTask = (async () => {
          const { data, error } = await supabase
            .from("employees")
            .select("id, full_name, is_active")
            .eq("role", "agent")
            .order("full_name");

          if (error) {
            console.error("Filter Agent loading error:", error.message);
            setFilterAgents([]);
          } else {
            setFilterAgents(data || []);
          }
        })();

        const assignableAgentsTask = (async () => {
          if (!emp || !["super_admin", "admin", "agent"].includes(emp.role)) {
            setAgents([]);
            return;
          }

          let agentQuery = supabase
            .from("employees")
            .select("id, full_name")
            .eq("role", "agent")
            .eq("is_active", true)
            .order("full_name");

          // Agents can only see/select themselves.
          if (emp.role === "agent") {
            agentQuery = agentQuery.eq("id", emp.id);
          }

          const { data, error } = await agentQuery;

          if (error) {
            console.error("Agent loading error:", error.message);
            setAgents([]);
          } else {
            setAgents(data || []);
          }
        })();

        await Promise.all([
          nationalityTask,
          applicationOptionsTask,
          filterAgentsTask,
          assignableAgentsTask,
        ]);
      })();

    } catch (error: any) {
      console.error("Student module initialization error:", error);
      setEmployee(null);
      setLoading(false);
    }
  }


  async function loadStudents() {
    const requestId = ++listRequestId.current;
    setListLoading(true);
    setMessage("");

    try {
      const f = appliedFilters;
      let matchingStudentIds: string[] | null = null;

      // Intake, Degree and Current Status belong to the applications table.
      if (f.intake || f.degree || f.currentStatus) {
        let applicationQuery = supabase
          .from("applications")
          .select("student_id")
          .not("student_id", "is", null);

        if (f.intake) {
          applicationQuery = applicationQuery.eq("intake", f.intake);
        }
        if (f.degree) {
          applicationQuery = applicationQuery.eq("degree_level", f.degree);
        }
        if (f.currentStatus) {
          applicationQuery = applicationQuery.eq("application_status", f.currentStatus);
        }

        const { data: applicationRows, error: applicationError } = await applicationQuery.limit(10000);
        if (requestId !== listRequestId.current) return;
        if (applicationError) throw applicationError;

        matchingStudentIds = [...new Set((applicationRows || []).map((row: any) => row.student_id).filter(Boolean))];
        if (matchingStudentIds.length === 0) {
          setStudents([]);
          setTotalStudents(0);
          setListLoading(false);
          return;
        }
      }

      let query = supabase
        .from("students")
        .select(
          "id, full_name, passport_number, nationality, gender, email, phone, receiving_date, agent_name",
          { count: "exact" }
        )
        .order("created_at", { ascending: false });
        // Agent can only view their own assigned students
if (employee?.role === "agent") {
  query = query.eq("agent_name", employee.full_name);
}

      if (matchingStudentIds) query = query.in("id", matchingStudentIds);
      if (f.studentName.trim()) query = query.ilike("full_name", `%${f.studentName.trim()}%`);
      if (f.passport.trim()) query = query.ilike("passport_number", `%${f.passport.trim()}%`);
      if (f.nationality) query = query.eq("nationality", f.nationality);
      if (f.email.trim()) query = query.ilike("email", `%${f.email.trim()}%`);
      if (f.gender) query = query.eq("gender", f.gender);
      if (f.phone.trim()) query = query.ilike("phone", `%${f.phone.trim()}%`);
      if (f.agent) query = query.eq("agent_name", f.agent);
      if (f.fromDate) query = query.gte("receiving_date", f.fromDate);
      if (f.toDate) query = query.lte("receiving_date", f.toDate);

      const { data, error, count } = await query.range(
        (page - 1) * pageSize,
        page * pageSize - 1
      );

      if (requestId !== listRequestId.current) return;
      if (error) throw error;

      // Load application details for the students on the current page.
      const studentRows = data || [];
      const studentIds = studentRows.map((item: any) => item.id).filter(Boolean);
      let applicationMap: Record<string, { intake: string; degree: string; status: string }> = {};

      if (studentIds.length > 0) {
        const { data: applicationDetails, error: applicationDetailsError } = await supabase
          .from("applications")
          .select("student_id, intake, degree_level, application_status, created_at")
          .in("student_id", studentIds)
          .order("created_at", { ascending: true });

        if (applicationDetailsError) throw applicationDetailsError;

        (applicationDetails || []).forEach((application: any) => {
          const studentId = application.student_id;
          if (!studentId) return;

          if (!applicationMap[studentId]) {
            applicationMap[studentId] = { intake: "", degree: "", status: "" };
          }

          const current = applicationMap[studentId];
          const addUnique = (existing: string, value: string) => {
            if (!value) return existing;
            const values = existing ? existing.split(", ") : [];
            return values.includes(value) ? existing : [...values, value].join(", ");
          };

          current.intake = addUnique(current.intake, application.intake || "");
          current.degree = addUnique(current.degree, application.degree_level || "");
          current.status = addUnique(current.status, application.application_status || "");
        });
      }

      setStudents(
        studentRows.map((item: any) => ({
          ...item,
          intake: applicationMap[item.id]?.intake || "",
          degree: applicationMap[item.id]?.degree || "",
          current_status: applicationMap[item.id]?.status || "",
        }))
      );
      setTotalStudents(count || 0);
    } catch (error: any) {
      if (requestId !== listRequestId.current) return;
      setMessage(error.message || "Unable to load students.");
      setStudents([]);
      setTotalStudents(0);
    } finally {
      if (requestId === listRequestId.current) setListLoading(false);
    }
  }

  async function loadStudentApplications(studentId: string) {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: true });

    if (error) {
      setMessage(error.message);
      setApplications([]);
      return;
    }

    const rows = data || [];

    const universityIds = [
      ...new Set(rows.map((a: any) => a.university_id).filter(Boolean)),
    ];

    let universityMap: Record<string, string> = {};

    if (universityIds.length > 0) {
      const { data: universityData } = await supabase
        .from("universities")
        .select("id, university_name")
        .in("id", universityIds);

      (universityData || []).forEach((u: any) => {
        universityMap[u.id] = u.university_name;
      });
    }

    setApplications(
      rows.map((a: any) => ({
        ...a,
        university_name: universityMap[a.university_id] || "—",
      }))
    );
  }

  const totalPages = Math.max(
    1,
    Math.ceil(totalStudents / pageSize)
  );

  const visibleStudents = students;

  function updateField(key: string, value: any) {
    setStudent((old: any) => ({ ...old, [key]: value }));
  }

  function scanPassport(file?: File) {
    if (!file) {
      passportScanInputRef.current?.click();
      return;
    }

    // Selection only: queue the passport for the existing document upload flow.
    // OCR/API/cloud processing is intentionally disabled for now.
    setDocumentFiles((old) => {
      const current = old.Passports || [];
      const alreadyQueued = current.some(
        (item) =>
          item.name === file.name &&
          item.size === file.size &&
          item.lastModified === file.lastModified
      );

      return alreadyQueued
        ? old
        : { ...old, Passports: [...current, file] };
    });

    setMessage("Passport file selected. Save the student form to upload it.");
  }

  function openNewStudent() {
    setSelected(null);
    setStudent({
      ...EMPTY_STUDENT,
      ...(employee?.role === "agent"
        ? {
            agent_employee_id: employee.id,
            agent_name: employee.full_name || "",
          }
        : {}),
    });
    setApplications([]);
    setEditingApplicationId(null);
    setApplicationDraft({ payment: "", application_status: "" });
    setDocuments([]);
    setLogs([]);
    setPhotoFile(null);
    setSignatureFile(null);
    setDocumentFiles({});
    setPhotoUrl("");
    setSignatureUrl("");
    setEducationRows([{ ...EMPTY_EDUCATION }]);
    setScreen("form");
    setMessage("");
  }

  async function fetchStudentDetails(studentId: string) {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .single();

    if (error) {
      setMessage(error.message);
      return null;
    }

    return data;
  }

  async function openEditStudent(s: any) {
    const fullStudent = await fetchStudentDetails(s.id);
    if (!fullStudent) return;

    setSelected(fullStudent);
    setEditingApplicationId(null);
    setApplicationDraft({ payment: "", application_status: "" });
    setStudent({ ...EMPTY_STUDENT, ...fullStudent });
    setPhotoFile(null);
    setSignatureFile(null);
    setDocumentFiles({});

    const education = Array.isArray(fullStudent.education_history)
      ? fullStudent.education_history
      : [];

    setEducationRows(
      education.length > 0 ? education : [{ ...EMPTY_EDUCATION }]
    );

    await Promise.all([
      loadStudentApplications(fullStudent.id),
      loadDocuments(fullStudent.id),
      loadProfileImages(fullStudent),
    ]);

    setScreen("form");
    setMessage("");
  }

  async function openStudent(s: any) {
    const fullStudent = await fetchStudentDetails(s.id);
    if (!fullStudent) return;

    setSelected(fullStudent);
    setEditingApplicationId(null);
    setApplicationDraft({ payment: "", application_status: "" });
    setStudent({ ...EMPTY_STUDENT, ...fullStudent });
    setNoteText(fullStudent.student_notes || "");

    await Promise.all([
      loadStudentApplications(fullStudent.id),
      loadDocuments(fullStudent.id),
      loadActivityLogs(fullStudent.id),
      loadProfileImages(fullStudent),
    ]);

    setScreen("view");
    setMessage("");
  }

  async function loadDocuments(studentId: string) {
    const { data, error } = await supabase
      .from("student_documents")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setDocuments(data || []);
  }

  async function loadActivityLogs(studentId: string) {
    const { data, error } = await supabase
      .from("student_activity_logs")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setLogs(data || []);
  }

  async function loadProfileImages(s: any) {
    setPhotoUrl("");
    setSignatureUrl("");

    const [photoResult, signatureResult] = await Promise.all([
      s.photo_path
        ? supabase.storage
            .from("student-documents")
            .createSignedUrl(s.photo_path, 3600)
        : Promise.resolve({ data: null, error: null }),
      s.signature_path
        ? supabase.storage
            .from("student-documents")
            .createSignedUrl(s.signature_path, 3600)
        : Promise.resolve({ data: null, error: null }),
    ]);

    setPhotoUrl(photoResult.data?.signedUrl || "");
    setSignatureUrl(signatureResult.data?.signedUrl || "");
  }

  async function addLog(
    studentId: string,
    action: string,
    description: string
  ) {
    if (!employee?.id) return;

    await supabase.from("student_activity_logs").insert({
      student_id: studentId,
      employee_id: employee.id,
      action,
      description,
    });
  }

  async function openNotesPopup(s: any) {
    setPopupStudent(s);
    setNewPopupNote("");
    setActivePopup("notes");

    const { data, error } = await supabase
      .from("student_notes")
      .select("id, note, created_at, employee_id, employees(full_name)")
      .eq("student_id", s.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setPopupNotes(data || []);
  }

  async function openLogPopup(s: any) {
    setPopupStudent(s);
    setActivePopup("log");

    const { data, error } = await supabase
      .from("student_activity_logs")
      .select("*, employees(full_name)")
      .eq("student_id", s.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setPopupLogs(data || []);
  }

  async function addPopupNote() {
    if (!popupStudent?.id || !employee?.id || !newPopupNote.trim()) {
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("student_notes").insert({
      student_id: popupStudent.id,
      employee_id: employee.id,
      note: newPopupNote.trim(),
    });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    await addLog(
      popupStudent.id,
      "Note Added",
      newPopupNote.trim()
    );

    setNewPopupNote("");
    await openNotesPopup(popupStudent);
    setSaving(false);
  }

  function updateFamily(
    parent: "father_information" | "mother_information",
    key: string,
    value: string
  ) {
    setStudent((old: any) => ({
      ...old,
      [parent]: {
        ...(old[parent] || {}),
        [key]: value,
      },
    }));
  }

  function updateEducation(index: number, key: string, value: string) {
    setEducationRows((old) =>
      old.map((row, i) =>
        i === index ? { ...row, [key]: value } : row
      )
    );
  }

  function updateLanguage(key: string, value: string) {
    setStudent((old: any) => ({
      ...old,
      language_proficiency: {
        ...(old.language_proficiency || {}),
        [key]: value,
      },
    }));
  }

  function updateEmployment(key: string, value: string) {
    setStudent((old: any) => ({
      ...old,
      employment_information: {
        ...(old.employment_information || {}),
        [key]: value,
      },
    }));
  }

  async function uploadProfileFile(
    studentId: string,
    file: File,
    folder: string,
    column: string
  ) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${studentId}/${folder}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("student-documents")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { error } = await supabase
      .from("students")
      .update({ [column]: path })
      .eq("id", studentId);

    if (error) throw new Error(error.message);

    return path;
  }

  async function uploadFormDocuments(studentId: string) {
    for (const category of DOCUMENT_CATEGORIES) {
      const files = documentFiles[category] || [];

      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${studentId}/${category}/${Date.now()}_${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("student-documents")
          .upload(path, file, { upsert: false });

        if (uploadError) throw new Error(uploadError.message);

        const { error } = await supabase.from("student_documents").insert({
          student_id: studentId,
          document_name: file.name,
          file_path: path,
          uploaded_by: employee.id,
          document_category: category,
          file_size: file.size,
          mime_type: file.type,
        });

        if (error) throw new Error(error.message);
      }
    }
  }

  async function saveStudent(e: FormEvent) {
    e.preventDefault();

    if (screen === "view") return;

    setSaving(true);
    setMessage("");

    const fullName =
      `${student.given_name || ""} ${student.surname || ""}`.trim();

    if (!fullName) {
      setMessage("Please enter the student's Given Name or Surname.");
      setSaving(false);
      return;
    }
    const canAssignAgent = ["super_admin", "admin", "agent"].includes(
      employee?.role
    );
    const assignedAgentId =
      employee?.role === "agent"
        ? employee.id
        : student.agent_employee_id || null;

    if (employee?.role === "agent" && !employee?.id) {
      setMessage("Unable to verify your Agent account. Please sign in again.");
      setSaving(false);
      return;
    }

    if (
      canAssignAgent &&
      assignedAgentId &&
      !agents.some((a) => a.id === assignedAgentId)
    ) {
      setMessage("Please select a valid active Agent.");
      setSaving(false);
      return;
    }

    if (employee?.role === "agent" && !assignedAgentId) {
      setMessage("Your student record must be assigned to your Agent account.");
      setSaving(false);
      return;
    }

    const selectedAgent = agents.find((a) => a.id === assignedAgentId);

    const payload: any = {
      ...student,
      ...(canAssignAgent
        ? {
            agent_employee_id: assignedAgentId,
            agent_name:
              selectedAgent?.full_name ||
              (employee?.role === "agent" ? employee.full_name : "") ||
              null,
          }
        : {}),
      full_name: fullName,
      date_of_birth: student.date_of_birth || null,
      passport_issue_date: student.passport_issue_date || null,
      passport_expiry_date: student.passport_expiry_date || null,
      visa_issue_date: student.visa_issue_date || null,
      visa_expiry_date: student.visa_expiry_date || null,
      receiving_date: student.receiving_date || null,
      father_information: student.father_information || {},
      mother_information: student.mother_information || {},
      education_history: educationRows.filter((r) =>
        Object.values(r).some((v) => String(v || "").trim() !== "")
      ),
      language_proficiency: student.language_proficiency || {},
      employment_information: student.employment_information || {},
    };

    delete payload.id;
    delete payload.created_at;

    let result: any;

    if (selected?.id) {
      result = await supabase
        .from("students")
        .update(payload)
        .eq("id", selected.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("students")
        .insert({
          ...payload,
          created_by: employee?.id,
        })
        .select()
        .single();
    }

    if (result.error) {
      setMessage(result.error.message);
      setSaving(false);
      return;
    }

    const savedStudent = result.data;

    try {
      let updatedStudent = { ...savedStudent };

      if (photoFile) {
        const path = await uploadProfileFile(
          savedStudent.id,
          photoFile,
          "Profile",
          "photo_path"
        );
        updatedStudent.photo_path = path;
      }

      if (signatureFile) {
        const path = await uploadProfileFile(
          savedStudent.id,
          signatureFile,
          "Signature",
          "signature_path"
        );
        updatedStudent.signature_path = path;
      }

      await uploadFormDocuments(savedStudent.id);

      await addLog(
        savedStudent.id,
        selected ? "Student Updated" : "Student Created",
        selected
          ? "Student information updated"
          : "New student added"
      );

      setSelected(updatedStudent);
      setStudent(updatedStudent);

      await loadStudents();
      await openStudent(updatedStudent);

      setMessage(
        selected
          ? "Student information updated successfully."
          : "Student information saved successfully."
      );
    } catch (error: any) {
      setMessage(error.message || "An upload error occurred.");
    }

    setSaving(false);
  }

  async function uploadDocumentFromView(
    category: string,
    file: File
  ) {
    if (!selected?.id || !employee?.id) return;

    setSaving(true);

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${selected.id}/${category}/${Date.now()}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("student-documents")
        .upload(path, file, { upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      const { error } = await supabase.from("student_documents").insert({
        student_id: selected.id,
        document_name: file.name,
        file_path: path,
        uploaded_by: employee.id,
        document_category: category,
        file_size: file.size,
        mime_type: file.type,
      });

      if (error) throw new Error(error.message);

      await addLog(selected.id, "Document Uploaded", file.name);
      await loadDocuments(selected.id);
      setMessage("Document uploaded successfully.");
    } catch (error: any) {
      setMessage(error.message);
    }

    setSaving(false);
  }

  async function deleteDocument(doc: any) {
    if (!selected?.id || saving) return;

    const confirmed = window.confirm(
      `Delete "${doc.document_name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setSaving(true);
    setMessage("");

    try {
      const { error: storageError } = await supabase.storage
        .from("student-documents")
        .remove([doc.file_path]);

      if (storageError) throw new Error(storageError.message);

      const { error: deleteError } = await supabase
        .from("student_documents")
        .delete()
        .eq("id", doc.id)
        .eq("student_id", selected.id);

      if (deleteError) throw new Error(deleteError.message);

      await addLog(selected.id, "Document Deleted", doc.document_name);
      await loadDocuments(selected.id);
      setMessage("Document deleted successfully.");
    } catch (error: any) {
      setMessage(error.message || "Unable to delete this document.");
    } finally {
      setSaving(false);
    }
  }

  async function viewDocument(path: string) {
    const { data, error } = await supabase.storage
      .from("student-documents")
      .createSignedUrl(path, 3600);

    if (error) {
      setMessage(error.message);
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  async function saveNotes() {
    if (!selected?.id) return;

    const { error } = await supabase
      .from("students")
      .update({ student_notes: noteText })
      .eq("id", selected.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await addLog(
      selected.id,
      "Notes Updated",
      "Student notes updated"
    );

    setMessage("Notes saved successfully.");
    await loadStudents();
  }

  function renderInput(
    field: string,
    label: string,
    type = "text",
    readOnly = false
  ) {
    const value = student[field] || "";

    return (
      <label key={field} className="block min-w-0">
        <span className="mb-1 block text-[11px] font-medium text-blue-700">
          {label}
        </span>

        {type === "select" ? (
          <select
            disabled={readOnly}
            value={value}
            onChange={(e) => updateField(field, e.target.value)}
            className="h-8 w-full rounded-sm border border-slate-300 bg-white px-2 text-xs disabled:bg-white disabled:text-slate-800"
          >
            <option value="">Select</option>
            {(
              field === "gender"
                ? ["Male", "Female", "Other"]
                : ["Single", "Married", "Divorced", "Widowed"]
            ).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            readOnly={readOnly}
            disabled={readOnly}
            value={value}
            onChange={(e) => updateField(field, e.target.value)}
            className="h-8 w-full min-w-0 rounded-sm border border-slate-300 bg-white px-2 text-xs outline-none focus:border-blue-500 read-only:bg-white read-only:text-slate-800"
          />
        )}
      </label>
    );
  }

  function renderFamily(
    parent: "father_information" | "mother_information",
    title: string,
    readOnly: boolean
  ) {
    return (
      <section className="border border-slate-300 bg-[#f1f5f9] p-2">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4">
          {FAMILY_FIELDS.map(([key, label]) => (
            <label key={key} className="block min-w-0">
              <span className="mb-1 block text-[11px] text-blue-700">
                {title === "Father Information" && key === "name"
                  ? "Father name"
                  : title === "Mother Information" && key === "name"
                  ? "Mother name"
                  : label}
              </span>
              <input
                type={key === "date_of_birth" ? "date" : "text"}
                readOnly={readOnly}
                disabled={readOnly}
                value={(student[parent] || {})[key] || ""}
                onChange={(e) =>
                  updateFamily(parent, key, e.target.value)
                }
                className="h-8 w-full rounded-sm border border-slate-300 bg-white px-2 text-xs"
              />
            </label>
          ))}
        </div>
      </section>
    );
  }
function startApplicationEdit(a: any) {
  setEditingApplicationId(a.id);
  setApplicationDraft({
    payment: a.payment || "",
    application_status: a.application_status || "",
  });
  setMessage("");
}

function cancelApplicationEdit() {
  setEditingApplicationId(null);
  setApplicationDraft({
    payment: "",
    application_status: "",
  });
}

async function saveApplicationEdit(a: any) {
  if (!a?.id || savingApplication) return;

  if (!applicationDraft.application_status.trim()) {
    setMessage("Please select an application status.");
    return;
  }

  setSavingApplication(true);
  setMessage("");

  try {
    const { data, error } = await supabase
      .from("applications")
      .update({
        payment: applicationDraft.payment || null,
        application_status: applicationDraft.application_status,
      })
      .eq("id", a.id)
      .select("id")
      .single();

    if (error) throw error;
    if (!data?.id) throw new Error("Application was not updated. Please check your access permissions.");

    setApplications((old) =>
      old.map((item) =>
        item.id === a.id
          ? {
              ...item,
              payment: applicationDraft.payment,
              application_status: applicationDraft.application_status,
            }
          : item
      )
    );

    if (selected?.id) {
      await addLog(
        selected.id,
        "Application Updated",
        `Application payment: ${a.payment || "—"} → ${applicationDraft.payment || "—"}; Status: ${a.application_status || "—"} → ${applicationDraft.application_status}`
      );
    }

    setEditingApplicationId(null);
    setMessage("Application updated successfully.");
  } catch (error: any) {
    setMessage(error.message || "Unable to update this application.");
  } finally {
    setSavingApplication(false);
  }
}
  function renderApplicationTable() {
    return (
      <section className="overflow-hidden border border-slate-300 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-center text-[10px]">
            <thead className="bg-[#fce8e8]">
              <tr>
                {[
                  "S.N.",
                  "Intake",
                  "University",
                  "Major",
                  "Priority",
                  "Payment",
                  "Applied Date",
                  "Responsible Person",
                  "Current Status",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} className="border border-slate-400 px-1 py-1 font-bold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {applications.map((a, i) => {
                const isEditing = editingApplicationId === a.id;
                return (
                  <tr key={a.id} className="h-7">
                    <td className="border border-slate-300 px-1">{String(i + 1).padStart(2, "0")}</td>
                    <td className="border border-slate-300 px-1">{a.intake || "—"}</td>
                    <td className="border border-slate-300 px-1">{a.university_name || "—"}</td>
                    <td className="border border-slate-300 px-1">{a.program_name || "—"}</td>
                    <td className="border border-slate-300 px-1">{a.priority || "—"}</td>

                    <td className="border border-slate-300 px-1">
                      {isEditing ? (
                        <select
                          value={applicationDraft.payment}
                          disabled={savingApplication}
                          onChange={(e) => setApplicationDraft((old) => ({ ...old, payment: e.target.value }))}
                          className="w-full rounded border border-slate-300 bg-white px-1 py-1 text-[10px]"
                        >
                          <option value="">Select</option>
                          {["Paid", "Unpaid", "Partial"].map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        a.payment || "—"
                      )}
                    </td>

                    <td className="border border-slate-300 px-1">{a.applied_date || "—"}</td>
                    <td className="border border-slate-300 px-1">{a.responsible_person || "—"}</td>

                    <td className="border border-slate-300 px-1">
                      {isEditing ? (
                        <select
                          value={applicationDraft.application_status}
                          disabled={savingApplication}
                          onChange={(e) => setApplicationDraft((old) => ({ ...old, application_status: e.target.value }))}
                          className="w-full rounded border border-slate-300 bg-white px-1 py-1 text-[10px]"
                        >
                          {a.application_status && !APPLICATION_STATUSES.includes(a.application_status as (typeof APPLICATION_STATUSES)[number]) && (
                            <option value={a.application_status}>{a.application_status}</option>
                          )}
                          {APPLICATION_STATUSES.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      ) : (
                        a.application_status || "—"
                      )}
                    </td>

                    <td className="border border-slate-300 px-1">
                      <div className="flex justify-center gap-1 whitespace-nowrap">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              disabled={savingApplication}
                              onClick={() => void saveApplicationEdit(a)}
                              className="text-emerald-700 underline disabled:opacity-50"
                            >
                              {savingApplication ? "Saving..." : "Save"}
                            </button>
                            <span>.</span>
                            <button
                              type="button"
                              disabled={savingApplication}
                              onClick={cancelApplicationEdit}
                              className="text-slate-600 underline disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => openNotesPopup(selected)}
                              className="text-blue-700 underline"
                            >
                              Note
                            </button>
                            <span>.</span>
                            <button
                              type="button"
                              onClick={() => openLogPopup(selected)}
                              className="text-blue-700 underline"
                            >
                              Log
                            </button>
                            <span>.</span>
                            <button
                              type="button"
                              onClick={() => startApplicationEdit(a)}
                              className="text-blue-700 underline"
                            >
                              Edit
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {applications.length === 0 && (
                <tr>
                  <td colSpan={10} className="h-12 border border-slate-300 text-center text-slate-400">
                    No university applications found for this student.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderProfileUpload(readOnly: boolean) {
    return (
      <div className="flex w-full flex-col gap-2 md:w-[125px]">
        <div className="flex h-[125px] items-center justify-center overflow-hidden border border-slate-300 bg-white">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Student"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-center text-[10px] text-slate-400">
              Student Photo
            </span>
          )}
        </div>

        {!readOnly && (
          <label className="cursor-pointer border border-slate-300 bg-white px-2 py-1 text-center text-[10px] text-blue-700">
            Upload Photo
            <input
              type="file"
              accept="image/*,.pdf,application/pdf"
              className="hidden"
              onChange={(e) =>
                setPhotoFile(e.target.files?.[0] || null)
              }
            />
          </label>
        )}

        {photoFile && (
          <span className="truncate text-[10px] text-slate-500">
            {photoFile.name}
          </span>
        )}

        <div className="border border-slate-300 bg-white p-2 text-center">
          {signatureUrl ? (
            <img
              src={signatureUrl}
              alt="Student Signature"
              className="h-7 w-full object-contain"
            />) : (
            <span className="text-[11px] italic text-slate-400">
              Signature
            </span>
          )}
        </div>

        {!readOnly && (
          <label className="cursor-pointer border border-slate-300 bg-white px-2 py-1 text-center text-[10px] text-blue-700">
            Upload Signature
            <input
              type="file"
              accept="image/*,.pdf,application/pdf"
              className="hidden"
              onChange={(e) =>
                setSignatureFile(e.target.files?.[0] || null)
              }
            />
          </label>
        )}

        {signatureFile && (
          <span className="truncate text-[10px] text-slate-500">
            {signatureFile.name}
          </span>
        )}
      </div>
    );
  }

  function renderDocuments(readOnly: boolean) {
    return (
      <section className="border border-slate-300 bg-[#e6f9fd] p-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {DOCUMENT_CATEGORIES.map((category) => {
            const categoryDocs = documents.filter(
              (d) => d.document_category === category
            );

            return (
              <div
                key={category}
                className="min-w-0 border border-slate-300 bg-white p-1"
              >
                <h4 className="mb-1 min-h-5 text-center text-[10px] font-semibold text-blue-700">
                  {category}
                </h4>

                {categoryDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="mb-1 flex min-w-0 items-center gap-1"
                  >
                    <button
                      type="button"
                      onClick={() => viewDocument(doc.file_path)}
                      className="min-w-0 flex-1 truncate border border-slate-200 bg-slate-50 px-1 py-1 text-left text-[9px] text-blue-700 hover:underline"
                      title={doc.document_name}
                    >
                      {doc.document_name}
                    </button>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => deleteDocument(doc)}
                        disabled={saving}
                        aria-label={`Delete ${doc.document_name}`}
                        title="Delete document"
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-sm font-bold leading-none text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                {!readOnly && (
                  <label className="block cursor-pointer border border-slate-300 bg-slate-100 px-1 py-1 text-center text-[9px] text-slate-700">
                    Choose Files
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setDocumentFiles((old) => ({
                          ...old,
                          [category]: [
                            ...(old[category] || []),
                            ...files,
                          ],
                        }));
                      }}
                    />
                  </label>
                )}

                {!readOnly && category === "Passports" && (
                  <>
                    <input
                      ref={passportScanInputRef}
                      type="file"
                      accept="image/*,.pdf,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void scanPassport(file);
                        e.currentTarget.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => scanPassport()}
                      className="mt-1 w-full rounded-sm border border-blue-300 bg-blue-50 px-1 py-1.5 text-[9px] font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-wait disabled:opacity-60"
                    >
                      {"Scan Passport"}
                    </button>
                  </>
                )}

                {(documentFiles[category] || []).map((file, i) => (
                  <p
                    key={`${file.name}-${i}`}
                    className="mt-1 truncate text-[9px] text-emerald-700"
                    title={file.name}
                  >
                    {file.name}
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-sm text-slate-500">
        Loading students...
      </div>
    );
  }

  const readOnly = screen === "view";

  return (
    <div className="student-module-theme min-h-screen space-y-5 rounded-xl border-2 border-[#0ea5e9] bg-blue-100 p-3 sm:p-5 shadow-sm">
      {message && (
        <div className="border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
          {message}
        </div>
      )}

      {screen === "list" && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Student List
              </h2>
              <p className="text-sm text-slate-500">
                {totalStudents} students found
              </p>
            </div>

            <button
              onClick={openNewStudent}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Add New Student
            </button>
          </div>

          <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Student Filters</h3>
              <span className="text-xs text-slate-400">Use one or more fields to filter students</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {([
                ["studentName", "Student Name", "text"],
                ["passport", "Passport", "text"],
                ["nationality", "Nationality", "nationality"],
                ["email", "Email", "email"],
                ["gender", "Gender", "select"],
                ["phone", "Phone", "text"],
                ["intake", "Intake", "intake"],
                ["degree", "Degree", "degree"],
                ["fromDate", "From Date", "date"],
                ["toDate", "To Date", "date"],
                ["currentStatus", "Current Status", "status"],
                ["agent", "Agent", "agent"],
              ] as const).map(([key, label, type]) => (
                <label key={key} className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
                  {type === "select" ? (
                    <select
                      value={filters[key]}
                      onChange={(e) => setFilters((old) => ({ ...old, [key]: e.target.value }))}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">All Genders</option>
                      {["Male", "Female", "Other"].map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ) : type === "status" ? (
                    <select
                      value={filters[key]}
                      onChange={(e) => setFilters((old) => ({ ...old, [key]: e.target.value }))}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">All Statuses</option>
                      {APPLICATION_STATUSES.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ) : type === "nationality" ? (
                    <select
                      value={filters[key]}
                      onChange={(e) => setFilters((old) => ({ ...old, [key]: e.target.value }))}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">All Nationalities</option>
                      {nationalityOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ) : type === "intake" ? (
                    <select
                      value={filters[key]}
                      onChange={(e) => setFilters((old) => ({ ...old, [key]: e.target.value }))}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">All Intakes</option>
                      {intakeOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ) : type === "degree" ? (
                    <select
                      value={filters[key]}
                      onChange={(e) => setFilters((old) => ({ ...old, [key]: e.target.value }))}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">All Degrees</option>
                      {degreeOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ) : type === "agent" ? (
                    <select
                      value={filters[key]}
                      onChange={(e) => setFilters((old) => ({ ...old, [key]: e.target.value }))}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">All Agents</option>
                      {filterAgents.map((a) => (
                        <option key={a.id} value={a.full_name}>
                          {a.full_name}{a.is_active ? "" : " (Inactive)"}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={type}
                      value={filters[key]}
                      onChange={(e) => setFilters((old) => ({ ...old, [key]: e.target.value }))}
                      placeholder={label}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setFilters({ ...EMPTY_FILTERS });
                  setAppliedFilters({ ...EMPTY_FILTERS });
                  setPage(1);
                }}
                className="rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setAppliedFilters({ ...filters });
                }}
                className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-max min-w-full table-auto border-collapse text-left text-sm">
              <thead className="whitespace-nowrap px-3 py-3 font-semibold">
                <tr>
                  {[
                    "S.N.", "Student Name", "Passport", "Nationality",
                    "Gender", "Email", "Phone", "Intake", "Degree",
                    "Current Status", "Receiving Date", "Agent", "Action",
                  ].map((h) => (
                    <th key={h} className="px-3 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {listLoading && (
                  <tr>
                    <td colSpan={13} className="px-3 py-6 text-center text-slate-400">
                      Loading students...
                    </td>
                  </tr>
                )}
                {!listLoading && visibleStudents.map((s, index) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="max-w-[280px] px-3 py-3 font-medium">
  <span className="block break-words">
    {s.full_name}
  </span>
</td>
                    <td className="px-3 py-3">
                      {s.passport_number || "—"}
                    </td>
                    <td className="px-3 py-3">
                      {s.nationality || "—"}
                    </td>
                    <td className="px-3 py-3">
                      {s.gender || "—"}
                    </td>
                    <td className="px-3 py-3">{s.email || "—"}</td>
                    <td className="px-3 py-3">{s.phone || "—"}</td>
                    <td className="max-w-[180px] whitespace-normal break-words px-3 py-3">
  {s.intake || "—"}
</td>
                  <td className="max-w-[180px] whitespace-normal break-words px-3 py-3">
  {s.degree || "—"}
</td>
                   <td className="max-w-[180px] whitespace-normal break-words px-3 py-3">
  {s.current_status || "—"}
</td>
                    <td className="px-3 py-3">{s.receiving_date || "—"}</td>
                    <td className="px-3 py-3">{s.agent_name || "—"}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-3 whitespace-nowrap">
                        <button
                          onClick={() => openNotesPopup(s)}
                          className="font-medium text-purple-600 hover:underline"
                        >
                          Note
                        </button>
                        <button
                          onClick={() => openStudent(s)}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openLogPopup(s)}
                          className="font-medium text-slate-600 hover:underline"
                        >
                          Log
                        </button>
                        <button
                          onClick={() => openEditStudent(s)}
                          className="font-medium text-emerald-600 hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!listLoading && visibleStudents.length === 0 && (
                  <tr>
                    <td
                      colSpan={13}
                      className="px-3 py-10 text-center text-slate-400"
                    >
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}

      {(screen === "form" || screen === "view") && (
        <form onSubmit={saveStudent} className="space-y-3">
          {/* University Application Table and Profile */}
          <div className="grid grid-cols-1 gap-2 border-2 border-[#22c55e] rounded-xl md:grid-cols-[minmax(0,1fr)_130px]">
            <div>{renderApplicationTable()}</div>
            {renderProfileUpload(readOnly)}
          </div>

          {/* Student Information */}
          <section className="border border-slate-300 bg-[#e6f9fd] p-2">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-1 text-[11px] font-bold text-blue-800">
                Agent:
                {["super_admin", "admin", "agent"].includes(employee?.role) ? (
                  <select
                    value={student.agent_employee_id || ""}
                    disabled={readOnly || employee?.role === "agent"}
                    onChange={(e) => {
                      const selectedAgent = agents.find(
                        (agent) => agent.id === e.target.value
                      );
                      updateField("agent_employee_id", selectedAgent?.id || null);
                      updateField("agent_name", selectedAgent?.full_name || "");
                    }}
                    className="h-7 w-36 rounded-full border border-slate-300 bg-white px-2 text-[10px] disabled:bg-slate-100"
                  >
                    <option value="">
                      {agents.length === 0 ? "No active agents" : "Select Agent"}
                    </option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.full_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="inline-flex h-7 min-w-32 items-center rounded-full border border-slate-300 bg-slate-100 px-3 text-[10px] font-medium text-slate-700">
                    {student.agent_name || "Not assigned"}
                  </span>
                )}
              </label>

              <h2 className="bg-[#c9ffc1] px-10 py-1 text-center text-[11px] font-bold tracking-widest text-slate-800">
                STUDENT INFO
              </h2>

              <div>
                {readOnly ? (
                  <button
                    type="button"
                    onClick={() => openEditStudent(selected)}
                    className="rounded-full bg-violet-500 px-5 py-1 text-xs font-semibold text-white"
                  >
                    Edit
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full bg-violet-500 px-5 py-1 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4 lg:grid-cols-8">
              {STUDENT_FIELDS.map(([key, label, type]) =>
                renderInput(
                  key as string,
                  label as string,
                  type as string,
                  readOnly
                )
              )}

              {renderInput(
                "receiving_date",
                "Receiving Date",
                "date",
                readOnly
              )}
            </div>
          </section>

          {/* Family Information */}
          {renderFamily("father_information", "Father Information", readOnly)}
          {renderFamily("mother_information", "Mother Information", readOnly)}

          {/* Education */}
          <section className="border border-slate-300 bg-[#e6f9fd] p-2">
            <h3 className="mb-2 text-[11px] font-bold text-blue-800">
              EDUCATION INFORMATION
            </h3>

            {educationRows.map((row, index) => (
              <div
                key={index}
                className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8"
              >
                {[
                  ["degree_type", "Degree type"],
                  ["institution_name", "Institution name"],
                  ["learning_start", "Learning start"],
                  ["learning_end", "Learning end"],
                  ["country", "Country"],
                  ["major", "Major"],
                  ["score", "Score"],
                  ["grade_percentage", "Grade percentage"],
                  ["issue_date", "Issue date"],
                ].map(([key, label]) => (
                  <label key={key} className="block min-w-0">
                    <span className="mb-1 block text-[11px] text-blue-700">
                      {label}
                    </span>
                    <input
                      type={
                        key === "learning_start" ||
                        key === "learning_end" ||
                        key === "issue_date"
                          ? "date"
                          : "text"
                      }
                      readOnly={readOnly}
                      disabled={readOnly}
                      value={row[key] || ""}
                      onChange={(e) =>
                        updateEducation(index, key, e.target.value)
                      }
                      className="h-8 w-full rounded-sm border border-slate-300 bg-white px-2 text-xs"
                    />
                  </label>
                ))}
                {!readOnly && educationRows.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setEducationRows((old) =>
                        old.filter((_, i) => i !== index)
                      )
                    }
                    className="self-end text-left text-[10px] text-red-600"
                  >
                    Remove row
                  </button>
                )}
              </div>
            ))}

            {!readOnly && (
              <button
                type="button"
                onClick={() =>
                  setEducationRows((old) => [
                    ...old,
                    { ...EMPTY_EDUCATION },
                  ])
                }
                className="mt-1 rounded border border-blue-300 bg-white px-3 py-1 text-[10px] text-blue-700"
              >
                + Add Education
              </button>
            )}
          </section>

          {/* Language Proficiency */}
          <section className="border border-slate-300 bg-[#e6f9fd] p-2">
            <h3 className="mb-2 text-[11px] font-bold text-blue-800">
              LANGUAGE PROFICIENCY
            </h3>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {[
                ["english_level", "English Level"],
                ["ielts", "IELTS / Scale"],
                ["toefl", "TOEFL / Scale"],
                ["hsk_level", "HSK level"],
                ["hsk_marks", "HSK Marks"],
                ["hsk_scale", "HSK Scale"],
                ["duolingo", "Duolingo / Scale"],
                ["ef_set", "EF SET / Scale"],
                ["pte", "PTE / Scale"],
                ["gsca", "GSCA / Scale"],
              ].map(([key, label]) => (
                <label key={key} className="block min-w-0">
                  <span className="mb-1 block text-[11px] text-blue-700">
                    {label}
                  </span>
                  <input
                    readOnly={readOnly}
                    value={
                      (student.language_proficiency || {})[key] || ""
                    }
                    onChange={(e) =>
                      updateLanguage(key, e.target.value)
                    }
                    className="h-8 w-full rounded-sm border border-slate-300 bg-white px-2 text-xs"
                  />
                </label>
              ))}
            </div>
          </section>

          {/* Employment */}
          <section className="border border-slate-300 bg-[#e6f9fd] p-2">
            <h3 className="mb-2 text-[11px] font-bold text-blue-800">
              EMPLOYMENT INFORMATION
            </h3>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {[
                ["designation", "Designation"],
                ["company_name", "Company name"],
                ["employment_duration", "Employment duration"],
                ["company_type", "Company type"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["contact_person", "Contact person"],
                ["address", "Address"],
              ].map(([key, label]) => (
                <label key={key} className="block min-w-0">
                  <span className="mb-1 block text-[11px] text-blue-700">
                    {label}
                  </span>
                  <input
                    readOnly={readOnly}
                    disabled={readOnly}
                    value={
                      (student.employment_information || {})[key] || ""
                    }
                    onChange={(e) =>
                      updateEmployment(key, e.target.value)
                    }
                    className="h-8 w-full rounded-sm border border-slate-300 bg-white px-2 text-xs"
                  />
                </label>
              ))}
            </div>
          </section>

          {/* Documents */}
          <div>
            <h3 className="mb-1 text-[11px] font-bold text-blue-800">
              STUDENT DOCUMENTS
            </h3>
            {renderDocuments(readOnly)}
          </div>

          {/* Student Notes */}
          <section className="border border-slate-300 bg-[#e6f9fd] p-3">
            <h3 className="mb-2 text-[11px] font-bold text-blue-800">
              STUDENT NOTES
            </h3>
            <textarea
              rows={3}
              readOnly={readOnly}
              disabled={readOnly}
              value={student.student_notes || ""}
              onChange={(e) =>
                updateField("student_notes", e.target.value)
              }
              className="w-full border border-slate-300 bg-white p-2 text-xs"
            />
          </section>

          {!readOnly && (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  selected
                    ? openStudent(selected)
                    : setScreen("list")
                }
                className="border border-slate-300 bg-white px-5 py-2 text-xs text-slate-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-violet-500 px-7 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </form>
      )}

      {/* Notes and Log Popup */}
      {activePopup && popupStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="flex h-[78vh] max-h-[750px] w-full max-w-2xl flex-col border border-slate-300 bg-white p-5 shadow-2xl sm:p-6">
            <div className="relative mb-4 flex items-center justify-center">
              <h2 className="text-xl font-bold text-slate-800 underline underline-offset-4">
                {activePopup === "notes" ? "Notes" : "Log"}
              </h2>

              <button
                type="button"
                onClick={() => setActivePopup(null)}
                className="absolute right-0 flex h-8 w-8 items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto border border-slate-200 p-4">
              {activePopup === "notes" ? (
                <div className="space-y-3">
                  {popupNotes.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">
                      No notes available for this student.
                    </p>
                  ) : (
                    popupNotes.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-md border border-rose-200 bg-rose-50/50 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-slate-800">
                            {item.employees?.full_name || "Employee"}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500">
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                          {item.note}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {popupLogs.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">
                      No activity history available.
                    </p>
                  ) : (
                    popupLogs.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-md border border-rose-200 bg-rose-50/50 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-slate-800">
                            {item.employees?.full_name || "Employee"}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500">
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-700">
                          {item.description || item.action}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {activePopup === "notes" && (
              <div className="mt-3">
                <textarea
                  value={newPopupNote}
                  onChange={(e) => setNewPopupNote(e.target.value)}
                  placeholder="Write a new note..."
                  rows={4}
                  className="w-full resize-none border border-slate-300 bg-cyan-50/70 p-3 text-sm"
                />
                <div className="mt-2 flex justify-center">
                  <button
                    type="button"
                    disabled={saving || !newPopupNote.trim()}
                    onClick={addPopupNote}
                    className="rounded-full bg-violet-500 px-6 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Add Note"}
                  </button>
                </div>
              </div>
            )}

            {activePopup === "log" && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => setActivePopup(null)}
                  className="rounded-lg border border-slate-300 px-5 py-2 text-sm text-slate-600"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
