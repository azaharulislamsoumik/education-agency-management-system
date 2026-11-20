
"use client";

import BoardModule from "@/features/board/board-module";

export default function PendingPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-3">
      <BoardModule statusFilter="Pending" />
    </main>
  );
}
