import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { Provider } from "react-redux";
import { store } from "./store/store";
import { setApiAuthToken } from "./api/axios";
setApiAuthToken(store.getState().auth.token); // ✅ set initial token

store.subscribe(() => {
  setApiAuthToken(store.getState().auth.token); // ✅ keep updated
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
