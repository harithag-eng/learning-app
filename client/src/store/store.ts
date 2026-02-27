import { configureStore } from "@reduxjs/toolkit";
import categoriesReducer from "../features/categories/categoriesSlice";
import questionsReducer from "../features/questions/questionsSlice";
import uiReducer from "../features/ui/uiSlice";
import authReducer from "../features/auth/authSlice";
export const store = configureStore({
  reducer: {
    categories: categoriesReducer,
    questions: questionsReducer,
    ui: uiReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
