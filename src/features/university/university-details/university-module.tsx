// Replace the existing displayList helper with:
function displayList(value: string[] | null | undefined) {
  const items = value || [];

  if (!items.length) return <span className="text-slate-400">—</span>;

  return (
    <ul className="list-disc space-y-1 pl-4">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="whitespace-normal break-words">
          {item}
        </li>
      ))}
    </ul>
  );
}

// Replace the existing University table block with:
<div className="w-full overflow-x-auto rounded-lg border border-slate-200">
  <table className="w-max min-w-full table-auto border-collapse text-left text-sm">
    <thead className="bg-slate-100">
      <tr>
        {columns.map((column) => (
          <th
            key={column}
            className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-3 text-xs font-bold text-slate-700"
          >
            {column}
          </th>
        ))}
      </tr>
    </thead>

    <tbody>
      {filteredUniversities.map((university, index) => (
        <tr
          key={university.id}
          className="align-top hover:bg-blue-50/40"
        >
          <td className="whitespace-nowrap border-b border-r border-slate-100 px-3 py-3 text-slate-600">
            {index + 1}
          </td>

          <td className="max-w-[280px] break-words border-b border-r border-slate-100 px-3 py-3 font-semibold text-slate-800">
            <span className="block break-words">
              {university.university_name}
            </span>
          </td>

          <td className="max-w-[180px] whitespace-normal break-words border-b border-r border-slate-100 px-3 py-3">
            {university.province || "—"}
          </td>

          <td className="max-w-[180px] whitespace-normal break-words border-b border-r border-slate-100 px-3 py-3">
            {displayList(university.intake)}
          </td>

          <td className="max-w-[180px] whitespace-normal break-words border-b border-r border-slate-100 px-3 py-3">
            {displayList(university.degree)}
          </td>

          <td className="max-w-[200px] whitespace-normal break-words border-b border-r border-slate-100 px-3 py-3">
            {displayList(university.tuition_fee_type)}
          </td>

          <td className="max-w-[180px] whitespace-normal break-words border-b border-r border-slate-100 px-3 py-3">
            {university.type || "—"}
          </td>

          <td className="max-w-[200px] whitespace-normal break-words border-b border-r border-slate-100 px-3 py-3">
            {displayList(university.scholarship)}
          </td>

          <td className="max-w-[220px] whitespace-normal break-words border-b border-r border-slate-100 px-3 py-3">
            {displayList(university.requirements)}
          </td>

          <td className="max-w-[220px] whitespace-normal break-words border-b border-r border-slate-100 px-3 py-3">
            {displayList(university.restricted_account_country)}
          </td>

          <td className="max-w-[220px] whitespace-normal break-words border-b border-r border-slate-100 px-3 py-3">
            {university.apply_link ? (
              <a
                href={university.apply_link}
                target="_blank"
                rel="noreferrer"
                className="break-all font-medium text-blue-600 hover:underline"
              >
                Open Link ↗
              </a>
            ) : (
              "—"
            )}
          </td>

          <td className="max-w-[220px] whitespace-normal break-words border-b border-r border-slate-100 px-3 py-3">
            {university.user_id || "—"}
          </td>

          <td className="max-w-[200px] whitespace-normal break-words border-b border-r border-slate-100 px-3 py-3">
            {university.responsible_person || "—"}
          </td>

          <td className="whitespace-nowrap border-b border-r border-slate-100 px-3 py-3">
            <div className="space-y-2">
              <div className="max-w-[180px] break-all font-semibold tracking-wide text-slate-700">
                {passwordVisibility[university.id]
                  ? passwordCache[university.id] || ""
                  : "••••••••"}
              </div>

              <div className="flex flex-nowrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleUniversityPassword(university.id)}
                  disabled={passwordLoadingId === university.id}
                  className="rounded bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  {passwordLoadingId === university.id
                    ? "Loading..."
                    : passwordVisibility[university.id]
                    ? "Hide"
                    : "Show"}
                </button>

                <button
                  type="button"
                  onClick={() => copyUniversityPassword(university.id)}
                  disabled={passwordLoadingId === university.id}
                  className="rounded bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
                >
                  {passwordLoadingId === university.id ? "Wait..." : "Copy"}
                </button>
              </div>
            </div>
          </td>

          <td className="whitespace-nowrap border-b border-slate-100 px-3 py-3">
            <div className="flex flex-nowrap items-center gap-2">
              <button
                onClick={() => openNotes(university)}
                className="rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
              >
                Note
              </button>

              <button
                onClick={() => openLogs(university)}
                className="rounded bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100"
              >
                Log
              </button>

              <button
                onClick={() => startEdit(university)}
                className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                Edit
              </button>

              <button
                onClick={() => deleteUniversity(university)}
                className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
