import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  selectedCategorySlug: string;
  searchTerm: string;
  page: number;
  limit: number;
  difficulty: "" | "basic" | "intermediate" | "advanced";
}

const initialState: UIState = {
  selectedCategorySlug: "dashboard",
  searchTerm: "",
  page: 1,
  limit: 5,
  difficulty: "",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategorySlug = action.payload;
      state.page = 1; // Reset to first page when category changes
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
      state.page = 1; // Reset to first page when search changes
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setDifficulty(state, action: PayloadAction<UIState["difficulty"]>) {
      state.difficulty = action.payload;
      state.page = 1;
    },
  },
});

export const { setCategory, setSearchTerm, setPage, setDifficulty } =
  uiSlice.actions;
export default uiSlice.reducer;
