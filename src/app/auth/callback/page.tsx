"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Verifying your email...");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function completeRegistration() {
      try {
        const { data, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        const user = data.session?.user;

        if (!user) {
          throw new Error(
            "Email verification session not found. Please try logging in."
          );
        }

        const metadata = user.user_metadata;

        if (metadata?.registration_type !== "student") {
          router.replace("/");
          return;
        }

        const { error: profileError } = await supabase.rpc(
          "register_student_profile",
          {
            p_surname: metadata.surname,
            p_given_name: metadata.given_name,
            p_phone: metadata.phone,
            p_passport_number: metadata.passport_number || null,
            p_nationality: metadata.nationality,
            p_gender: metadata.gender || null,
            p_date_of_birth: metadata.date_of_birth || null,
            p_preferred_degree: metadata.preferred_degree,
            p_preferred_intake: metadata.preferred_intake,
            p_preferred_study_country:
              metadata.preferred_study_country,
            p_preferred_major: metadata.preferred_major || null,
          }
        );

        if (profileError) throw profileError;

        if (!active) return;

        setMessage(
          "Your email has been verified and your Student Account is ready. Please log in."
        );

        await supabase.auth.signOut();

        setTimeout(() => {
          router.replace("/");
        }, 3000);
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Registration verification failed."
        );
        setMessage("");
      }
    }

    completeRegistration();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-extrabold text-blue-900">
          Edunexio
        </h1>

        {message && (
          <p className="mt-5 text-slate-600">{message}</p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {error && (
          <button
            onClick={() => router.replace("/")}
            className="mt-6 rounded-lg bg-blue-800 px-6 py-3 font-semibold text-white"
          >
            Return to Homepage
          </button>
        )}
      </div>
    </main>
  );
}
