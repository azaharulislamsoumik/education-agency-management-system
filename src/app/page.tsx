
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import StudentRegistrationModal from "@/components/public-website/student-registration-modal";

export default function Home() {
  const router = useRouter();

  const [loginOpen, setLoginOpen] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setLoginOpen(false);
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  function openLogin() {
    setError("");
    setSuccess("");
    setLoginOpen(true);
    setMobileMenuOpen(false);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

     const { data: studentProfile, error: studentProfileError } =
  await supabase.rpc("get_student_portal_profile");

if (studentProfileError) throw studentProfileError;

const hasStudentProfile = Array.isArray(studentProfile)
  ? studentProfile.length > 0
  : Boolean(studentProfile);

if (hasStudentProfile) {
  setSuccess("Student login successful. Opening your portal...");
  setLoginOpen(false);
  router.replace("/student-portal");
  router.refresh();
  return;
}

const { data: authData, error: authUserError } =
  await supabase.auth.getUser();

if (authUserError || !authData.user) {
  throw new Error("Unable to verify your account. Please sign in again.");
}

const { data: employee, error: employeeError } = await supabase
  .from("employees")
  .select("id, role, is_active")
  .eq("auth_user_id", authData.user.id)
  .maybeSingle();

if (employeeError) throw employeeError;

const allowedStaffRoles = [
  "super_admin",
  "admin",
  "manager",
  "account",
  "agent",
  "employee",
];

if (
  !employee ||
  !employee.is_active ||
  !allowedStaffRoles.includes(employee.role)
) {
  await supabase.auth.signOut();
  throw new Error(
    "No active Student or Staff profile was found for this account. Please contact Edunexio support."
  );
}

setSuccess("Login successful. Redirecting...");
setLoginOpen(false);
router.replace("/dashboard");
router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const services = [
    {
      icon: "🎓",
      title: "University Admission",
      description:
        "Explore suitable universities and academic opportunities abroad.",
    },
    {
      icon: "📝",
      title: "Application Assistance",
      description:
        "Get support throughout your university application process.",
    },
    {
      icon: "📂",
      title: "Document Preparation",
      description:
        "Organize and prepare your academic application documents.",
    },
    {
      icon: "🌍",
      title: "Student Guidance",
      description:
        "Make informed decisions about your international education journey.",
    },
  ];

  return (
    <main className="min-h-screen bg-white text-slate-800">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="#home" className="text-2xl font-extrabold tracking-tight">
            <span className="text-blue-800">Edunex</span>
            <span className="text-amber-500">io</span>
            <span className="ml-2 block text-[9px] font-semibold uppercase tracking-[3px] text-slate-400">
              Global Education Platform
            </span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 lg:flex">
            <a href="#home" className="hover:text-blue-700">Home</a>
            <a href="#about" className="hover:text-blue-700">About Us</a>
            <a href="#services" className="hover:text-blue-700">Our Services</a>
            <a href="#contact" className="hover:text-blue-700">Contact</a>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              onClick={openLogin}
              className="rounded-lg border border-blue-800 px-5 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-50"
            >
              Login
            </button>
            <button
             onClick={() => {
  setRegistrationOpen(true);
  setMobileMenuOpen(false);
}}
              className="rounded-lg bg-blue-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-900"
            >
              Create Student Account
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xl lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            ☰
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white px-5 py-4 lg:hidden">
            <nav className="flex flex-col gap-4 text-sm font-semibold">
              <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)}>About Us</a>
              <a href="#services" onClick={() => setMobileMenuOpen(false)}>Our Services</a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a>

              <button
                onClick={openLogin}
                className="rounded-lg border border-blue-800 px-5 py-3 text-blue-800"
              >
                Login
              </button>

              <button
                onClick={() => {
  setRegistrationOpen(true);
  setMobileMenuOpen(false);
}}
                className="rounded-lg bg-blue-800 px-5 py-3 text-white"
              >
                Create Student Account
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* HERO */}
      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700"
      >
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 md:py-32 lg:grid-cols-2 lg:px-8">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-blue-100">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              YOUR GLOBAL EDUCATION PARTNER
            </div>

            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your Gateway to
              <span className="block text-amber-400">
                Global Education
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-blue-100 sm:text-lg">
              Your international education journey starts here.
              Explore opportunities, get guidance and take the next
              step towards your academic future.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#services"
                className="rounded-lg bg-amber-400 px-7 py-4 text-sm font-bold text-blue-950 transition hover:bg-amber-300"
              >
                Explore Our Services →
              </a>
              <a
                href="#about"
                className="rounded-lg border border-white/40 px-7 py-4 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Discover Edunexio
              </a>
            </div>
          </div>

          <div className="hidden justify-center lg:flex">
            <div className="relative flex h-96 w-96 items-center justify-center rounded-full border border-white/20 bg-white/5">
              <div className="absolute h-72 w-72 rounded-full border border-white/20" />
              <div className="absolute h-52 w-52 rounded-full border border-white/20" />

              <div className="flex h-40 w-40 items-center justify-center rounded-3xl bg-white shadow-2xl">
                <div className="text-center">
                  <div className="text-5xl">🌍</div>
                  <div className="mt-3 text-xl font-extrabold text-blue-900">
                    Edunexio
                  </div>
                  <div className="text-xs text-slate-500">
                    Study Beyond Borders
                  </div>
                </div>
              </div>

              <div className="absolute right-3 top-12 rounded-xl bg-white px-4 py-3 text-sm font-bold text-blue-900 shadow-xl">
                🎓 Your Future
              </div>
              <div className="absolute bottom-12 left-0 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-blue-950 shadow-xl">
                ✈ New Opportunities
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="px-5 py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[3px] text-amber-600">
              About Edunexio
            </p>

            <h2 className="mt-4 text-3xl font-extrabold leading-tight text-blue-950 sm:text-4xl">
              Helping Students Move Towards a Brighter Future
            </h2>

            <p className="mt-6 leading-8 text-slate-600">
              Edunexio is dedicated to supporting students who aspire
              to pursue international education. We aim to make the
              admission journey easier through guidance, application
              assistance and student-focused support.
            </p>

            <p className="mt-4 leading-8 text-slate-600">
              Our goal is to help students understand their opportunities
              and prepare for the next chapter of their academic journey.
            </p>

            <a
              href="#services"
              className="mt-8 inline-flex rounded-lg bg-blue-800 px-6 py-3 font-bold text-white transition hover:bg-blue-900"
            >
              Learn More →
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-blue-50 p-8">
              <div className="text-4xl">🎯</div>
              <h3 className="mt-5 text-xl font-bold text-blue-950">Our Mission</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                To support students with accessible and reliable education guidance.
              </p>
            </div>

            <div className="mt-10 rounded-2xl bg-amber-50 p-8">
              <div className="text-4xl">🚀</div>
              <h3 className="mt-5 text-xl font-bold text-blue-950">Our Vision</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                To help students explore opportunities beyond borders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="bg-slate-50 px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[3px] text-amber-600">
              What We Do
            </p>
            <h2 className="mt-4 text-3xl font-extrabold text-blue-950 sm:text-4xl">
              Our Services
            </h2>
            <p className="mt-5 leading-7 text-slate-600">
              Support and guidance for different stages of your international education journey.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => (
              <div
                key={service.title}
                className="group rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl">{service.icon}</span>
                  <span className="text-sm font-bold text-slate-300">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="mt-7 text-lg font-bold text-blue-950">
                  {service.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-500">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section id="contact" className="bg-white px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-blue-950 px-7 py-14 text-center sm:px-14">
          <p className="text-sm font-bold uppercase tracking-[3px] text-amber-400">
            Start Your Journey
          </p>

          <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
            Ready to Explore Your Opportunities?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-blue-100">
            Connect with Edunexio and take your next step towards international education.
          </p>

          <button
            onClick={openLogin}
            className="mt-8 rounded-lg bg-amber-400 px-8 py-4 font-bold text-blue-950 transition hover:bg-amber-300"
          >
            Login to Your Account →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 px-5 py-10 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="text-2xl font-extrabold">
              Edunex<span className="text-amber-400">io</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Your Gateway to Global Education
            </p>
          </div>

          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Edunexio. All rights reserved.
          </p>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      {loginOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setLoginOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
            className="relative my-auto w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl sm:p-9"
          >
            <button
              onClick={() => setLoginOpen(false)}
              aria-label="Close login"
              className="absolute right-5 top-5 rounded-full px-3 py-1 text-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-800"
            >
              ×
            </button>

            <div className="mb-8">
              <div className="text-2xl font-extrabold">
                <span className="text-blue-800">Edunex</span>
                <span className="text-amber-500">io</span>
              </div>

              <h2 id="login-title" className="mt-7 text-2xl font-extrabold text-slate-900">
                Welcome Back!
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Sign in to access your account.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setError("Please contact your administrator to reset your password.")
                  }
                  className="text-sm font-semibold text-blue-700 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              {error && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              {success && (
                <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-800 py-3.5 font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <p className="mt-7 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} Edunexio. All rights reserved.
            </p>
          </div>
        </div>
      )}
      <StudentRegistrationModal
  isOpen={registrationOpen}
  onClose={() => setRegistrationOpen(false)}
/>
    </main>
  );
}
