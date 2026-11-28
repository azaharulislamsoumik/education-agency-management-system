
"use client";

import StudentModule from "@/features/students/student-module";
import { useEffect, useState } from "react";
import BoardModule from "@/features/board/board-module";
import UniversityModule from "@/features/university/university-details/university-module";
import OffersModule from "@/features/university/offers/offers-module";

const BOARD_SECTIONS = ["Pending", "Apply", "Document Review", "Submit", "Completed", "Hold"] as const;

type MenuItem = {
  label: string;
  icon: string;
  children?: string[];
};

const menuItems: MenuItem[] = [
  { label: "Dashboard", icon: "▦" },
  { label: "Students", icon: "♙" },
  {
    label: "Board",
    icon: "▤",
   children: [...BOARD_SECTIONS],
  },
  {
    label: "University",
    icon: "▥",
    children: ["University Details", "Offers", "File Assessment", "Offline Form"],
  },
  {
    label: "Employee",
    icon: "♧",
    children: ["Employee Details", "Attendance", "Leave Applications"],
  },
  {
    label: "Accounts",
    icon: "▣",
    children: ["Salary", "Inventory", "Payroll"],
  },
  {
    label: "Message",
    icon: "✉",
    children: ["Notice", "Single SMS", "Bulk SMS"],
  },
  {
    label: "Reports",
    icon: "▨",
    children: ["Employee Report", "Work Report"],
  },
];

const statusData = [
  { label: "Pending", value: 124, color: "#f59e0b", dot: "bg-amber-500" },
  { label: "Apply", value: 286, color: "#3b82f6", dot: "bg-blue-500" },
  { label: "Document Review", value: 95, color: "#8b5cf6", dot: "bg-violet-500" },
  { label: "Submit", value: 218, color: "#6366f1", dot: "bg-indigo-500" },
  { label: "Completed", value: 168, color: "#10b981", dot: "bg-emerald-500" },
  { label: "Hold", value: 84, color: "#f43f5e", dot: "bg-rose-500" },
];

const noticeItems = [
  { type: "Deadline", message: "Tongren University Application Deadline", date: "31-07-2026" },
  { type: "Deadline", message: "Beihang University Application Deadline", date: "31-07-2026" },
  { type: "Deadline", message: "Tsinghua University Application Deadline", date: "20-07-2026" },
  { type: "Deadline", message: "Harbin Institute of Technology Application Deadline", date: "19-07-2026" },
  { type: "Deadline", message: "Xi'an Jiaotong University Application Deadline", date: "19-07-2026" },
  { type: "Deadline", message: "Nanjing University Application Deadline", date: "19-07-2026" },
  { type: "Deadline", message: "Beijing Normal University Application Deadline", date: "19-07-2026" },
  { type: "Notice", message: "Nantong University Scholarship Notice" },
  { type: "Notice", message: "Zhejiang University Scholarship Notice" },
  { type: "Notice", message: "Fudan University Scholarship Notice" },
  { type: "Notice", message: "Wuhan University Scholarship Notice" },
  { type: "Notice", message: "Sichuan Scholarship Notice" },
  { type: "Notice", message: "Nanjing Institute of Technology - New Major Available" },
];

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    green: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-3 text-3xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}

function ReportRing({
  title,
  data,
}: {
  title: string;
  data: typeof statusData;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentPercent = 0;

  const gradient = data.map((item) => {
    const start = currentPercent;
    const percent = total ? (item.value / total) * 100 : 0;
    currentPercent += percent;
    return `${item.color} ${start}% ${currentPercent}%`;
  }).join(", ");

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <span className="rounded-lg bg-slate-50 px-3 py-1 text-xs text-slate-500">
          Sample Data
        </span>
      </div>

      <div className="mt-7 flex flex-col items-center gap-7 sm:flex-row">
        <div
          className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        >
          <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
            <span className="text-3xl font-bold text-slate-800">{total}</span>
            <span className="mt-1 text-xs text-slate-400">Total</span>
          </div>
        </div>

        <div className="w-full space-y-3.5">
          {data.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.dot}`} />
                <span className="truncate text-sm text-slate-500">{item.label}</span>
              </div>
              <span className="text-sm font-semibold text-slate-700">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ApplicationStatusChart() {
  const total = statusData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-slate-800">Application Status</h3>
          <p className="mt-1 text-xs text-slate-400">Current application status distribution</p>
        </div>
        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
          All Applications
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {statusData.map((item) => {
          const percent = total ? (item.value / total) * 100 : 0;

          return (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                  <span className="text-sm font-medium text-slate-600">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{item.value}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${percent}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-sm font-medium text-slate-500">Total Applications</span>
        <span className="text-xl font-bold text-slate-800">{total}</span>
      </div>
    </div>
  );
}

function NoticeDeadlines() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(noticeItems.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleNotices = noticeItems.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section className="min-h-[580px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 text-center">
        <h3 className="inline-block border-b-2 border-purple-500 pb-2 text-lg font-bold text-purple-700 sm:text-xl">
          Notice And Deadlines
        </h3>
      </div>

      <div className="max-h-[390px] space-y-1.5 overflow-y-auto overscroll-contain pr-2 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100">
        {visibleNotices.map((item, index) => {
          const isDeadline = item.type === "Deadline";

          return (
            <div
              key={`${item.message}-${startIndex + index}`}
              className="grid min-h-[34px] grid-cols-[88px_minmax(0,1fr)] gap-2 rounded-md border border-pink-100 p-1 shadow-[0_1px_3px_rgba(236,72,153,0.08)] sm:grid-cols-[138px_minmax(0,1fr)]"
            >
              <div
                className={`flex items-center justify-center rounded px-2 py-1 text-[10px] font-bold sm:text-xs ${
                  isDeadline
                    ? "bg-red-50 text-red-600"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {item.type}
              </div>

              <div
                className={`flex min-w-0 flex-wrap items-center justify-between gap-2 rounded px-2 py-1 text-[11px] sm:text-xs ${
                  isDeadline
                    ? "bg-yellow-50 text-slate-700"
                    : "bg-slate-50 text-slate-600"
                }`}
              >
                <span className="min-w-0 flex-1">{item.message}</span>
                {item.date && (
                  <span className="shrink-0 rounded bg-white/80 px-2 py-1 font-bold text-red-600">
                    {item.date}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <p className="text-[10px] text-slate-400">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, noticeItems.length)} of {noticeItems.length} notices
        </p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              aria-current={currentPage === page ? "page" : undefined}
              className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition ${
                currentPage === page
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      <p className="mt-2 text-right text-[10px] text-slate-400">
        Dates shown as provided in the original sample
      </p>
    </section>
  );
}

export default function DashboardContent() {
  const [activeModule, setActiveModule] = useState("Dashboard");
  const [activeChild, setActiveChild] = useState("");
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [studentModuleKey, setStudentModuleKey] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Restore the selected page from the URL after refresh.
  useEffect(() => {
    function syncNavigationFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const requestedModule = params.get("module") || "Dashboard";
      const requestedChild = params.get("child") || "";

      const menu = menuItems.find(
        (item) => item.label === requestedModule
      );

      const validModule = menu ? requestedModule : "Dashboard";
      const validChild =
        menu?.children?.includes(requestedChild) ? requestedChild : "";

      setActiveModule(validModule);
      setActiveChild(validChild);
      setExpandedMenus(validChild ? [validModule] : []);
    }

    syncNavigationFromUrl();

    window.addEventListener("popstate", syncNavigationFromUrl);

    return () => {
      window.removeEventListener("popstate", syncNavigationFromUrl);
    };
  }, []);

  // Keep the browser URL synchronized with the selected page.
  function updateNavigationUrl(module: string, child = "") {
    const url = new URL(window.location.href);

    if (module === "Dashboard") {
      url.searchParams.delete("module");
      url.searchParams.delete("child");
    } else {
      url.searchParams.set("module", module);

      if (child) {
        url.searchParams.set("child", child);
      } else {
        url.searchParams.delete("child");
      }
    }

    window.history.pushState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  }

  function toggleMenu(name: string) {
    setExpandedMenus((previous) =>
      previous.includes(name) ? [] : [name]
    );
  }

function selectModule(label: string) {
  updateNavigationUrl(label);

  setActiveModule(label);
  setActiveChild("");
  setExpandedMenus([]);

  if (label === "Students") {
    setSelectedStudentId(null);
    setStudentModuleKey((key) => key + 1);
  }

  setMobileMenu(false);
}

  function openStudentFromBoard(studentId: string) {
    setSelectedStudentId(studentId);
    updateNavigationUrl("Students");
    setActiveModule("Students");
    setActiveChild("");
    setExpandedMenus([]);
    setStudentModuleKey((key) => key + 1);
    setMobileMenu(false);
  }

  function selectChild(parent: string, child: string) {
    updateNavigationUrl(parent, child);

    setActiveModule(parent);
    setActiveChild(child);
    setExpandedMenus([parent]);
    setMobileMenu(false);
  }

  const isDashboard = activeModule === "Dashboard" && !activeChild;
  const currentTitle = activeChild || activeModule;

  return (
    <div className="min-h-screen bg-[#f5f7fc] text-slate-800">
      {mobileMenu && (
        <button
          aria-label="Close sidebar"
          onClick={() => setMobileMenu(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[265px] flex-col border-r border-slate-100 bg-white transition-transform duration-300 lg:translate-x-0 ${mobileMenu ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[82px] items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-xl font-bold text-white shadow-lg shadow-blue-200">
            E
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Edunex<span className="text-blue-600">io</span>
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-[2px] text-slate-400">
              Management System
            </p>
          </div>
        </div>

        <div className="px-4 pt-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[2px] text-slate-400">
            Main Menu
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-6">
          {menuItems.map((item) => {
            const active = activeModule === item.label;
            const expanded = expandedMenus.includes(item.label);

            return (
              <div key={item.label}>
                <div className={`flex items-center rounded-xl transition ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}>
                  <button
  onClick={() =>
    item.children
      ? toggleMenu(item.label)
      : selectModule(item.label)
  }
  className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left"
>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center text-lg">{item.icon}</span>
                    <span className="truncate text-sm font-semibold">{item.label}</span>
                  </button>

                  {item.children && (
                    <button
                      onClick={() => toggleMenu(item.label)}
                      aria-label={`Toggle ${item.label} submenu`}
                      className="px-4 py-3 text-sm"
                    >
                      <span className={`inline-block transition-transform ${expanded ? "rotate-90" : ""}`}>›</span>
                    </button>
                  )}
                </div>

                {item.children && expanded && (
                  <div className="ml-6 mt-1 space-y-1 border-l-2 border-slate-100 py-1 pl-4">
                    {item.children.map((child) => {
                      const childActive = activeModule === item.label && activeChild === child;

                      return (
                        <button
                          key={child}
                          onClick={() => selectChild(item.label, child)}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] transition ${childActive ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${childActive ? "bg-blue-600" : "bg-slate-300"}`} />
                          {child}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">✦</span>
              <span className="text-xs font-bold text-blue-800">Edunexio System</span>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">
              Student Application Management Platform
            </p>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[265px]">
        <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between border-b border-slate-100 bg-white/95 px-4 backdrop-blur-md sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenu(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden"
              aria-label="Open menu"
            >
              ☰
            </button>
            <div>
              <p className="text-xs text-slate-400">Workspace / {currentTitle}</p>
              <h2 className="mt-1 text-lg font-bold text-slate-800 sm:text-xl">{currentTitle}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-700">Welcome back!</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600"
              >
                ♧
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-12 z-50 w-72 rounded-xl border border-slate-100 bg-white p-4 shadow-xl">
                  <p className="font-semibold text-slate-800">Notifications</p>
                  <p className="mt-2 text-sm text-slate-500">No new notifications.</p>
                  <button onClick={() => setShowNotifications(false)} className="mt-3 text-xs font-semibold text-blue-600">
                    Close
                  </button>
                </div>
              )}
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-sm font-bold text-white">
              A
            </div>
          </div>
        </header>

        <main className="w-full min-w-0 max-w-none p-3 sm:p-4 lg:p-5">
          {isDashboard ? (
            <div className="space-y-7">


              <section>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Overview</h3>
                    <p className="mt-1 text-xs text-slate-400">Example figures for dashboard preview</p>
                  </div>
                  <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">Demo Data</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard title="Total Students" value="1,248" subtitle="Sample dashboard figure" icon="♙" color="blue" />
                  <StatCard title="Active Applications" value="856" subtitle="Sample dashboard figure" icon="▤" color="purple" />
                  <StatCard title="Pending Review" value="124" subtitle="Sample dashboard figure" icon="◷" color="orange" />
                  <StatCard title="Completed Files" value="368" subtitle="Sample dashboard figure" icon="✓" color="green" />
                </div>
              </section>

              <section>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Daily & Monthly Reports</h3>
                  <p className="mt-1 text-xs text-slate-400">Both charts show all six application statuses</p>
                </div>
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <ReportRing title="Daily Report" data={statusData} />
                  <ReportRing title="Monthly Report" data={statusData} />
                </div>
              </section>

              <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
                <div className="xl:col-span-3">
                  <ApplicationStatusChart />
                </div>
                <div className="xl:col-span-2">
                  <NoticeDeadlines />
                </div>
              </section>
            </div>
          ) : activeModule === "Board" && ["Pending", "Apply", "Document Review", "Submit", "Completed", "Hold"].includes(activeChild) ? (
            <BoardModule statusFilter={activeChild} onViewStudent={openStudentFromBoard} />
          ) : activeModule === "Students" && !activeChild ? (
  <StudentModule key={studentModuleKey} openStudentId={selectedStudentId} />
) : activeModule === "University" && activeChild === "University Details" ? (
  <UniversityModule />
) : activeModule === "University" && activeChild === "Offers" ? (
  <OffersModule />
) : (
            <section className="rounded-2xl border-2 border-[#22c55e] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Dashboard</span><span>›</span><span>{activeModule}</span>
                    {activeChild && <><span>›</span><span>{activeChild}</span></>}
                  </div>
                  <h2 className="mt-3 text-2xl font-bold text-slate-800">{currentTitle}</h2>
                  <p className="mt-2 text-sm text-slate-500">{currentTitle} management workspace</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
                  {menuItems.find((item) => item.label === activeModule)?.icon || "▦"}
                </div>
              </div>
              <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl text-blue-600 shadow-sm">✦</div>
                <h3 className="mt-4 text-lg font-bold text-slate-700">{currentTitle}</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  This workspace is ready for the {currentTitle.toLowerCase()} management features. The next development step will connect this module with the database and its working functions.
                </p>
                <span className="mt-5 inline-flex rounded-lg bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
                  Module selected successfully
                </span>
              </div>
            </section>
          )}

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} Edunexio. All rights reserved.</p>
            <p>Student Application Management System</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
