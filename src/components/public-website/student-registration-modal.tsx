
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type RegistrationOption = {
  option_type: "degree" | "intake" | "major";
  option_value: string;
};

export default function StudentRegistrationModal({
  isOpen,
  onClose,
}: Props) {
  const [form, setForm] = useState({
    surname: "",
    givenName: "",
    email: "",
    phone: "",
    passportNumber: "",
    nationality: "",
    gender: "",
    dateOfBirth: "",
    degree: "",
    intake: "",
    studyCountry: "",
    major: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [registrationOptions, setRegistrationOptions] =
    useState<RegistrationOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch Degree, Intake and Major from Database
  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    async function loadRegistrationOptions() {
      setOptionsLoading(true);
      setOptionsError("");

      try {
        const { data, error } = await supabase.rpc(
          "get_public_registration_options"
        );

        if (error) throw error;

        if (active) {
          setRegistrationOptions(
            ((data || []) as RegistrationOption[]).filter(
              (item) =>
                item.option_value &&
                item.option_value.trim() !== ""
            )
          );
        }
      } catch (err) {
        console.error("Registration options error:", err);

        if (active) {
          setOptionsError(
            "Unable to load study options. Please try again."
          );
          setRegistrationOptions([]);
        }
      } finally {
        if (active) {
          setOptionsLoading(false);
        }
      }
    }

    void loadRegistrationOptions();

    return () => {
      active = false;
    };
  }, [isOpen]);

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function createStudentProfile() {
    const { error } = await supabase.rpc(
      "register_student_profile",
      {
        p_surname: form.surname,
        p_given_name: form.givenName,
        p_phone: form.phone,
        p_passport_number: form.passportNumber || null,
        p_nationality: form.nationality,
        p_gender: form.gender || null,
        p_date_of_birth: form.dateOfBirth || null,
        p_preferred_degree: form.degree,
        p_preferred_intake: form.intake,
        p_preferred_study_country: form.studyCountry,
        p_preferred_major: form.major || null,
      }
    );

    if (error) throw error;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo:
              `${window.location.origin}/auth/callback`,
            data: {
              registration_type: "student",
              surname: form.surname,
              given_name: form.givenName,
              phone: form.phone,
              passport_number: form.passportNumber,
              nationality: form.nationality,
              gender: form.gender,
              date_of_birth: form.dateOfBirth,
              preferred_degree: form.degree,
              preferred_intake: form.intake,
              preferred_study_country: form.studyCountry,
              preferred_major: form.major,
            },
          },
        });

      if (signUpError) throw signUpError;

      if (data.session) {
        await createStudentProfile();

        setSuccess(
          "Your Student Account has been created successfully."
        );
      } else {
        setSuccess(
          "Registration submitted! Please check your email and verify your account to complete registration."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const degreeOptions = registrationOptions
    .filter((item) => item.option_type === "degree")
    .map((item) => item.option_value);

  const intakeOptions = registrationOptions
    .filter((item) => item.option_type === "intake")
    .map((item) => item.option_value);

  const majorOptions = registrationOptions
    .filter((item) => item.option_type === "major")
    .map((item) => item.option_value);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="my-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl sm:p-9">

        {/* Header */}
        <div className="mb-7 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-blue-950">
              Student Registration
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Create your Edunexio Student Account.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-2xl text-slate-400 hover:bg-slate-100"
            aria-label="Close registration"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">

          {/* Personal Information */}
          <section>
            <h3 className="mb-4 border-b pb-2 font-bold text-blue-900">
              Personal Information
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Surname *"
                value={form.surname}
                onChange={(v) => updateField("surname", v)}
                required
              />

              <Field
                label="Given Name *"
                value={form.givenName}
                onChange={(v) => updateField("givenName", v)}
                required
              />

              <Field
                label="Email Address *"
                type="email"
                value={form.email}
                onChange={(v) => updateField("email", v)}
                required
              />

              <Field
                label="Phone / WhatsApp *"
                type="tel"
                value={form.phone}
                onChange={(v) => updateField("phone", v)}
                required
              />

              <Field
                label="Passport Number"
                value={form.passportNumber}
                onChange={(v) => updateField("passportNumber", v)}
              />

              <Field
                label="Nationality *"
                value={form.nationality}
                onChange={(v) => updateField("nationality", v)}
                required
              />

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Gender
                </label>

                <select
                  value={form.gender}
                  onChange={(e) =>
                    updateField("gender", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-slate-800"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <Field
                label="Date of Birth"
                type="date"
                value={form.dateOfBirth}
                onChange={(v) => updateField("dateOfBirth", v)}
              />
            </div>
          </section>

          {/* Study Information */}
          <section>
            <h3 className="mb-4 border-b pb-2 font-bold text-blue-900">
              Study Information
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">

              {optionsError && (
                <p className="sm:col-span-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {optionsError}
                </p>
              )}

              {/* Degree Dropdown */}
              <DatabaseDropdown
                label="Degree *"
                value={form.degree}
                onChange={(v) => updateField("degree", v)}
                options={degreeOptions}
                placeholder="Select Degree"
                loading={optionsLoading}
                required
              />

              {/* Intake Dropdown */}
              <DatabaseDropdown
                label="Intake *"
                value={form.intake}
                onChange={(v) => updateField("intake", v)}
                options={intakeOptions}
                placeholder="Select Intake"
                loading={optionsLoading}
                required
              />

              {/* Preferred Study Country */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Preferred Study Country *
                </label>

                <select
                  value={form.studyCountry}
                  onChange={(e) =>
                    updateField("studyCountry", e.target.value)
                  }
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Select your preferred country
                  </option>
                  <option value="China">China</option>
                  <option value="Malaysia">Malaysia</option>
                  <option value="Japan">Japan</option>
                  <option value="South Korea">South Korea</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="Russia">Russia</option>
                  <option value="Hungary">Hungary</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Preferred Major Dropdown */}
              <DatabaseDropdown
                label="Preferred Major / Subject"
                value={form.major}
                onChange={(v) => updateField("major", v)}
                options={majorOptions}
                placeholder="Select Major / Subject"
                loading={optionsLoading}
              />

            </div>
          </section>

          {/* Account Security */}
          <section>
            <h3 className="mb-4 border-b pb-2 font-bold text-blue-900">
              Account Security
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Password *"
                type="password"
                value={form.password}
                onChange={(v) => updateField("password", v)}
                required
              />

              <Field
                label="Confirm Password *"
                type="password"
                value={form.confirmPassword}
                onChange={(v) =>
                  updateField("confirmPassword", v)
                }
                required
              />
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Use at least 8 characters.
            </p>
          </section>

          {/* Error Message */}
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {/* Success Message */}
          {success && (
            <p
              role="status"
              className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
            >
              {success}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full rounded-lg bg-blue-800 py-3.5 font-bold text-white transition hover:bg-blue-900 disabled:opacity-60"
          >
            {loading
              ? "Creating Account..."
              : "Create Student Account"}
          </button>

          <p className="text-center text-xs text-slate-400">
            By registering, you agree to use Edunexio's Student Portal responsibly.
          </p>

        </form>
      </div>
    </div>
  );
}

// Database Dropdown Component
function DatabaseDropdown({
  label,
  value,
  onChange,
  options,
  placeholder,
  loading,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  loading: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={loading || options.length === 0}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
      >
        <option value="">
          {loading
            ? "Loading options..."
            : options.length === 0
              ? "No options available"
              : placeholder}
        </option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

// Reusable Input Component
function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        min={type === "date" ? "1900-01-01" : undefined}
        className="w-full rounded-lg border border-slate-300 px-3 py-3 text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}
