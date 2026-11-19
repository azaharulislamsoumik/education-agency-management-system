
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type TestResult = {
  name: string;
  count: number | null;
  status: "success" | "error";
  message: string;
};

export default function SecurityTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [employeeRole, setEmployeeRole] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function runSecurityTest() {
    setLoading(true);
    setResults([]);
    setErrorMessage("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("No authenticated user found.");
      }

      setUserEmail(authData.user.email || "");

      const { data: employee, error: employeeError } =
        await supabase
          .from("employees")
          .select("id, full_name, role, is_active")
          .eq("auth_user_id", authData.user.id)
          .maybeSingle();

      if (employeeError) {
        throw new Error(employeeError.message);
      }

      if (!employee) {
        throw new Error(
          "No employee profile found for this login account."
        );
      }

      setEmployeeRole(employee.role || "Unknown");

      const tables = [
        "employees",
        "students",
        "applications",
        "universities",
        "student_documents",
      ];

      const testResults: TestResult[] = [];

      for (const table of tables) {
        const { count, error } = await supabase
          .from(table)
          .select("id", { count: "exact", head: true });

        testResults.push({
          name: table,
          count: error ? null : count,
          status: error ? "error" : "success",
          message: error
            ? error.message
            : "Database access successful",
        });
      }

      setResults(testResults);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">
            Database Security Test
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Check authenticated user access to Edunexio database tables.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Login Information
          </h2>

          <p className="mb-2 text-sm text-slate-600">
            <strong>Email:</strong> {userEmail || "Not checked"}
          </p>

          <p className="text-sm text-slate-600">
            <strong>Role:</strong> {employeeRole || "Not checked"}
          </p>

          <button
            onClick={runSecurityTest}
            disabled={loading}
            className="mt-5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Testing..." : "Run Security Test"}
          </button>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <strong>Test Error:</strong> {errorMessage}
          </div>
        )}

        {results.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-slate-800">
              Table Access Results
            </h2>

            <div className="space-y-3">
              {results.map((result) => (
                <div
                  key={result.name}
                  className="flex flex-col gap-2 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {result.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {result.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-600">
                      {result.count === null
                        ? "Unavailable"
                        : `Visible rows: ${result.count}`}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        result.status === "success"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {result.status === "success" ? "PASS" : "FAILED"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-5 text-xs text-slate-500">
              Note: This test checks login and SELECT access only.
              It does not modify or delete any database records.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
