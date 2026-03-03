import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { initI18n } from "./i18n.ts";
import { App } from "./app.tsx";
import "./styles/index.css";

const root = document.getElementById("root");
if (root) {
  initI18n().then(() => {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
}
