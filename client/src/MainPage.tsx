// src/MainPage.tsx
import { useEffect } from "react";
import Sidebar from "./components/Sidebar";
import QuestionAccordion from "./components/QuestionAccordian";

import { useAppDispatch, useAppSelector } from "./store/hooks";
import { fetchCategories } from "./features/categories/categoriesSlice";
import {
  addQuestion,
  fetchQuestions,
} from "./features/questions/questionsSlice";
import ProfileMenu from "./components/ProfileMenu";
import Swal from "sweetalert2";
export default function MainPage() {
  const dispatch = useAppDispatch();
  const ui = useAppSelector((s) => s.ui);

  const saving = useAppSelector((s) => s.questions.saving);
  const saveError = useAppSelector((s) => s.questions.saveError);
  const categories = useAppSelector((s) => s.categories.items);
  const selectedSlug = useAppSelector((s) => s.ui.selectedCategorySlug);
  const selectedCategory = categories.find((cat) => cat.slug === selectedSlug);
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchQuestions());
  }, [dispatch, ui.selectedCategorySlug, ui.searchTerm, ui.page, ui.limit]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <aside className="w-72 shrink-0 border-r bg-white">
          <Sidebar />
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between px-8 py-5 bg-white border-b">
            <div className="flex items-center gap-3">
              {/* <span className="text-2xl">⚛️</span> */}
              <h1 className="text-xl font-semibold text-gray-800">
                {selectedCategory?.name || "All"} Interview Questions
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <ProfileMenu />

              <button
                type="button"
                disabled={saving}
                className="px-4 py-2 rounded-md bg-teal-700 text-white disabled:opacity-60"
                onClick={async () => {
                  const { value: formValues } = await Swal.fire({
                    title: "Add Question",
                    html: `
      <input id="swal-question" class="swal2-input" placeholder="Enter question" />
      <textarea id="swal-answer" class="swal2-textarea" placeholder="Enter answer (optional)"></textarea>
    `,
                    focusConfirm: false,
                    showCancelButton: true,
                    confirmButtonText: "Save",
                    cancelButtonText: "Cancel",
                    preConfirm: () => {
                      const question = (
                        document.getElementById(
                          "swal-question",
                        ) as HTMLInputElement
                      )?.value?.trim();
                      const answer = (
                        document.getElementById(
                          "swal-answer",
                        ) as HTMLTextAreaElement
                      )?.value?.trim();

                      if (!question) {
                        Swal.showValidationMessage("Question is required");
                        return;
                      }

                      return { question, answer: answer || "" };
                    },
                  });

                  if (!formValues) return;

                  const res = await dispatch(addQuestion(formValues));

                  // Optional: show success message
                  if (addQuestion.fulfilled.match(res)) {
                    Swal.fire({
                      icon: "success",
                      title: "Saved!",
                      text: "Question added successfully.",
                      timer: 1200,
                      showConfirmButton: false,
                    });
                  } else {
                    Swal.fire({
                      icon: "error",
                      title: "Error",
                      text: "Failed to add question.",
                    });
                  }
                }}
              >
                {saving ? "Saving..." : "+ Add Question"}
              </button>
            </div>
          </div>

          <div className="p-8">
            {saveError && (
              <div className="text-red-500 mb-4">Save Error: {saveError}</div>
            )}
            <QuestionAccordion />
          </div>
        </div>
      </div>
    </div>
  );
}
