import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../api/axios";
import type { RootState } from "../../store/store";
import { setPage } from "../ui/uiSlice";

export interface Question {
  id: number;
  question: string;
  answer: string;
  difficulty: "basic" | "intermediate" | "advanced";
  created_at: string;
  updated_at: string;
}

interface QuestionsResponse {
  category: {
    id: number;
    name: string;
    slug: string;
  };
  items: Question[];
  total: number;
  totalPages: number;
  currentPage: number;
}

interface QuestionsState {
  items: Question[];
  total: number;
  totalPages: number;
  loading: boolean;
  saving: boolean;
  saveError: string | null;
  practiceHistoryByQuestionId: Record<number, PracticeHistoryItem[]>;
  practiceLoading: boolean;
  practiceError: string | null;
}

const initialState: QuestionsState = {
  items: [],
  total: 0,
  totalPages: 0,
  loading: false,
  saving: false,
  saveError: null,
  practiceHistoryByQuestionId: {},
  practiceLoading: false,
  practiceError: null,
};
export type PracticeSubmissionResponse = {
  message: string;
  submission_id: number;
  is_correct: boolean;
};

export type PracticeHistoryItem = {
  id: number;
  submitted_answer: string;
  is_correct: 0 | 1;
  created_at: string;
  name: string;
};
export const fetchQuestions = createAsyncThunk(
  "questions/fetchQuestions",
  async (_, { getState }) => {
    const state = getState() as RootState;
    const { selectedCategorySlug, searchTerm, page, limit, difficulty } =
      state.ui;

    const response = await api.get<QuestionsResponse>("/questions", {
      params: {
        categorySlug: selectedCategorySlug,
        search: searchTerm || "",
        difficulty: difficulty || "",
        page: page || 1,
        limit: limit || 10,
      },
    });
    return response.data;
  },
);

export const addQuestion = createAsyncThunk(
  "questions/addQuestion",
  async (
    payload: {
      question: string;
      answer: string;
      difficulty?: "basic" | "intermediate" | "advanced";
      categorySlug?: string;
    },
    { dispatch, getState },
  ) => {
    const state = getState() as RootState;
    //use selacted category if not passed
    const categorySlug = payload.categorySlug ?? state.ui.selectedCategorySlug;

    const difficulty = payload.difficulty ?? state.ui.difficulty ?? "basic";

    await api.post("/questions", {
      question: payload.question,
      answer: payload.answer,
      difficulty,
      categorySlug,
    });
    dispatch(setPage(1));
    dispatch(fetchQuestions());
    return true;
  },
);
export const updateQuestion = createAsyncThunk(
  "questions/updateQuestion",
  async (
    payload: {
      id: number;
      question: string;
      answer: string;
      difficulty?: "basic" | "intermediate" | "advanced";
    },
    { dispatch },
  ) => {
    await api.put(`/questions/${payload.id}`, {
      question: payload.question,
      answer: payload.answer,
      ...(payload.difficulty ? { difficulty: payload.difficulty } : {}),
    });

    dispatch(fetchQuestions());
    return true;
  },
);
export const deleteQuestion = createAsyncThunk(
  "questions/deleteQuestion",
  async (payload: { id: number }, { dispatch, getState }) => {
    const state = getState() as RootState;
    const page = state.ui.page;

    await api.delete(`/questions/${payload.id}`);

    // If you deleted the last item on a page, go back one page (optional but nice)
    const isLastItemOnPage = state.questions.items.length === 1;
    if (isLastItemOnPage && page > 1) {
      dispatch(setPage(page - 1));
    }

    dispatch(fetchQuestions());
    return true;
  },
);
export const submitPracticeAnswer = createAsyncThunk(
  "questions/submitPracticeAnswer",
  async (payload: { questionId: number; submitted_answer: string }) => {
    const res = await api.post<PracticeSubmissionResponse>(
      `questions/${payload.questionId}/submit`,
      { submitted_answer: payload.submitted_answer },
    );
    return res.data;
  },
);
export const fetchPracticeHistory = createAsyncThunk(
  "questions/fetchPracticeHistory",
  async (payload: { questionId: number; limit?: number }) => {
    const res = await api.get<PracticeHistoryItem[]>(
      `questions/${payload.questionId}/history`,
      { params: { limit: payload.limit ?? 10 } },
    );
    return res.data;
  },
);

const questionsSlice = createSlice({
  name: "questions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestions.pending, (state) => {
        state.loading = true;
        state.saveError = null;
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.loading = false;
        state.saveError = action.error.message || "Error fetching questions";
      })
      .addCase(addQuestion.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(addQuestion.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(addQuestion.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.error.message || "Error adding question";
      })
      .addCase(updateQuestion.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(updateQuestion.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateQuestion.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.error.message || "Error updating question";
      })
      .addCase(deleteQuestion.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(deleteQuestion.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(deleteQuestion.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.error.message || "Error deleting question";
      })
      .addCase(submitPracticeAnswer.pending, (state) => {
        state.practiceLoading = true;
        state.practiceError = null;
      })
      .addCase(submitPracticeAnswer.fulfilled, (state) => {
        state.practiceLoading = false;
      })
      .addCase(submitPracticeAnswer.rejected, (state, action) => {
        state.practiceLoading = false;
        state.practiceError = action.error.message || "Submit failed";
      })

      .addCase(fetchPracticeHistory.pending, (state) => {
        state.practiceLoading = true;
        state.practiceError = null;
      })
      .addCase(fetchPracticeHistory.fulfilled, (state, action) => {
        state.practiceLoading = false;
        // store history by question id
        // action.meta.arg has questionId
        const qid = action.meta.arg.questionId;
        state.practiceHistoryByQuestionId[qid] = action.payload;
      })
      .addCase(fetchPracticeHistory.rejected, (state, action) => {
        state.practiceLoading = false;
        state.practiceError = action.error.message || "History fetch failed";
      });
  },
});

export default questionsSlice.reducer;
