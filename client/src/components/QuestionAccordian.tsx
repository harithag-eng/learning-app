import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchQuestions,
  updateQuestion,
  deleteQuestion, // ✅ add this in your questionsSlice
  submitPracticeAnswer,
  fetchPracticeHistory,
} from "../features/questions/questionsSlice";
import { setDifficulty, setPage, setSearchTerm } from "../features/ui/uiSlice";
import Swal from "sweetalert2";

type Difficulty = "" | "basic" | "intermediate" | "advanced";

export default function QuestionAccordion() {
  const dispatch = useAppDispatch();

  const items = useAppSelector((s) => s.questions.items);
  const total = useAppSelector((s) => s.questions.total);
  const totalPages = useAppSelector((s) => s.questions.totalPages);
  const loading = useAppSelector((s) => s.questions.loading);
  const saving = useAppSelector((s) => s.questions.saving);
  const saveError = useAppSelector((s) => s.questions.saveError);

  const page = useAppSelector((s) => s.ui.page);
  const limit = useAppSelector((s) => s.ui.limit);
  const searchTerm = useAppSelector((s) => s.ui.searchTerm);
  const difficulty = useAppSelector((s) => s.ui.difficulty);

  const [openId, setOpenId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState(searchTerm);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== searchTerm) dispatch(setSearchTerm(searchInput));
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput, searchTerm, dispatch]);

  useEffect(() => {
    dispatch(fetchQuestions());
  }, [dispatch, page, searchTerm, difficulty]);

  const rangeText = useMemo(() => {
    const start = total === 0 ? 0 : (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    return `${start}–${end} of ${total}`;
  }, [page, limit, total]);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);

    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);

    const nums: number[] = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [page, totalPages]);

  const handleEdit = async (q: any) => {
    const result = await Swal.fire({
      title: "Edit Question",
      html: `
        <div style="text-align:left; display:flex; flex-direction:column; gap:10px;">
          <label style="font-size:12px; color:#6b7280;">Question</label>
          <input id="swal-question" class="swal2-input" value="${escapeHtml(
            q.question ?? "",
          )}" />
          
          <label style="font-size:12px; color:#6b7280;">Answer</label>
          <textarea id="swal-answer" class="swal2-textarea" style="min-height:110px;">${escapeHtml(
            q.answer ?? "",
          )}</textarea>

          <label style="font-size:12px; color:#6b7280;">Difficulty</label>
          <select id="swal-difficulty" class="swal2-select">
            ${["basic", "intermediate", "advanced"]
              .map(
                (d) =>
                  `<option value="${d}" ${
                    d === q.difficulty ? "selected" : ""
                  }>${capitalize(d)}</option>`,
              )
              .join("")}
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      preConfirm: () => {
        const question = (
          document.getElementById("swal-question") as HTMLInputElement
        )?.value?.trim();
        const answer = (
          document.getElementById("swal-answer") as HTMLTextAreaElement
        )?.value?.trim();
        const difficulty = (
          document.getElementById("swal-difficulty") as HTMLSelectElement
        )?.value as Difficulty;

        if (!question) {
          Swal.showValidationMessage("Question is required");
          return;
        }
        if (!answer) {
          Swal.showValidationMessage("Answer is required");
          return;
        }
        if (!["basic", "intermediate", "advanced"].includes(difficulty)) {
          Swal.showValidationMessage(
            "Difficulty must be basic/intermediate/advanced",
          );
          return;
        }

        return { question, answer, difficulty };
      },
    });

    if (!result.isConfirmed || !result.value) return;

    try {
      await dispatch(
        updateQuestion({
          id: q.id,
          question: result.value.question,
          answer: result.value.answer,
          difficulty: result.value.difficulty,
        } as any),
      ).unwrap?.();

      await Swal.fire({
        icon: "success",
        title: "Updated",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Update failed",
        text: err?.message || "Please try again.",
      });
    }
  };

  const handleDelete = async (q: any) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete this question?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });

    if (!confirm.isConfirmed) return;

    try {
      await dispatch(deleteQuestion({ id: q.id } as any)).unwrap?.();

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        timer: 1100,
        showConfirmButton: false,
      });

      // optional: close accordion if the deleted one is open
      setOpenId((prev) => (prev === q.id ? null : prev));
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: err?.message || "Please try again.",
      });
    }
  };

  const handleTryYourAnswer = async (q: any) => {
    const result = await Swal.fire({
      title: "Try Your Answer",
      input: "textarea",
      inputLabel: "Write your answer below",
      inputPlaceholder: "Type your answer here...",
      inputAttributes: { "aria-label": "Your answer" },
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (!value || !value.trim()) return "Answer is required";
        return null;
      },
    });

    if (!result.isConfirmed || !result.value) return;

    try {
      const resp = await dispatch(
        submitPracticeAnswer({
          questionId: q.id,
          submitted_answer: String(result.value).trim(),
        }),
      ).unwrap();
      await Swal.fire({
        icon: resp.is_correct ? "success" : "warning",
        title: resp.is_correct ? "Correct ✅" : "Submitted ❌",
        text: resp.is_correct
          ? "Great! Your answer matches the official answer."
          : "Saved, but it doesn’t match the official answer yet.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Submit failed",
        text: err?.message || "Please try again.",
      });
    }
  };
  const handleHistory = async (q: any) => {
    try {
      const rows = await dispatch(
        fetchPracticeHistory({ questionId: q.id, limit: 20 }),
      ).unwrap();

      if (!rows || rows.length === 0) {
        await Swal.fire({
          icon: "info",
          title: "No Answer yet",
          text: "Try submitting an answer first.",
        });
        return;
      }

      const html = `
      <div style="text-align:left; display:flex; flex-direction:column; gap:12px; max-height:360px; overflow:auto;">
        ${rows
          .map((r: any, idx: number) => {
            const date = new Date(r.created_at);
            const dateText = isNaN(date.getTime())
              ? r.created_at
              : date.toLocaleString();

            return `
              <div style="border:1px solid #e5e7eb; border-radius:10px; padding:10px;">
                <div style="display:flex; justify-content:space-between; gap:10px; font-size:12px; color:#6b7280; margin-bottom:6px;">
                  <div>#${rows.length - idx} • ${escapeHtml(dateText)}</div>
                  <div>${escapeHtml(status)}</div>
                </div>
                <div style="font-size:12px; color:#374151; margin-bottom:6px;">
                  ${escapeHtml(r.name || "")}
                </div>
                <div style="white-space:pre-wrap; font-size:13px; color:#111827;">
                  ${escapeHtml(r.submitted_answer)}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;

      await Swal.fire({
        title: "Answer",
        html,
        confirmButtonText: "Close",
        width: 700,
      });
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Failed to load Answer",
        text: err?.message || "Please try again.",
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Top controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full">
          <div className="w-full sm:w-80">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search questions..."
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
            <div className="text-xs text-gray-500 mt-1">
              Searching after you stop typing...
            </div>
          </div>

          <select
            value={difficulty}
            onChange={(e) =>
              dispatch(setDifficulty(e.target.value as Difficulty))
            }
            className="border rounded-md px-3 py-2 text-sm bg-white w-full sm:w-56"
          >
            <option value="">All Levels</option>
            <option value="basic">Basic</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <div className="text-sm text-gray-500">
            Page size: <span className="font-medium">{limit}</span>
          </div>
        </div>

        <div className="text-sm text-gray-500">{rangeText}</div>
      </div>

      {saveError && <div className="text-red-500">Save Error: {saveError}</div>}

      {loading ? (
        <div className="text-gray-500">Loading questions...</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">No questions found.</div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((q) => {
              const open = openId === q.id;

              return (
                <div
                  key={q.id}
                  className="bg-white border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setOpenId(open ? null : q.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-2 text-left">
                      <span className="text-blue-500 mt-1">✳</span>

                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">
                          {q.question}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {q.difficulty}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-500">
                      {/* ✅ EDIT (SweetAlert) */}
                      <button
                        type="button"
                        disabled={saving}
                        className="hover:text-gray-800 disabled:opacity-60"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(q);
                        }}
                        title="Edit"
                      >
                        ✏
                      </button>

                      {/* ✅ DELETE (SweetAlert confirm) */}
                      <button
                        type="button"
                        disabled={saving}
                        className="hover:text-red-600 disabled:opacity-60"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(q);
                        }}
                        title="Delete"
                      >
                        🗑
                      </button>

                      <span className="text-xl">{open ? "▾" : "▸"}</span>
                    </div>
                  </button>

                  {/* {open && (
                    <div className="p-4 border-t text-gray-700">{q.answer}</div>
                  )} */}
                  {open && (
                    <div className="p-4 border-t">
                      <div className="text-gray-700 whitespace-pre-wrap">
                        {q.answer}
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        {/* Try Your Answer */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTryYourAnswer(q);
                          }}
                          className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-3 py-2 text-sm text-white hover:bg-teal-500"
                        >
                          {/* <span className="font-mono text-xs">{`</>`}</span> */}
                          <span className="font-mono text-xs"></span>
                          Try Your Answer
                        </button>

                        {/* History */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHistory(q);
                          }}
                          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          🕒 Practice Log
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              disabled={page <= 1}
              onClick={() => dispatch(setPage(page - 1))}
              className="border rounded-md px-3 py-2 text-sm disabled:opacity-50"
            >
              Previous
            </button>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              {pageNumbers.map((p) => (
                <button
                  key={p}
                  onClick={() => dispatch(setPage(p))}
                  className={`border rounded-md px-3 py-2 text-sm ${
                    p === page ? "bg-gray-900 text-white" : "bg-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              disabled={page >= totalPages}
              onClick={() => dispatch(setPage(page + 1))}
              className="border rounded-md px-3 py-2 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** helpers */
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Prevent breaking SweetAlert HTML by escaping user text.
 * (Good enough for this use-case.)
 */
function escapeHtml(str: string) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
