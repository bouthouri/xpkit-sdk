import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { configureXPKit } from "../shared/index";
import { App } from "./App";
import "./styles.css";

/**
 * One call at startup. On web `localStorage` already satisfies `StorageAdapter`, so
 * there is no adapter to write — see docs/04-storage-and-state.md.
 *
 * `persist: false` is not passed here; the playground keeps its own state in React so
 * you can hammer the event buttons without polluting localStorage.
 */
configureXPKit({
  storage: localStorage,
  keyPrefix: "xpkit-playground",
  appVersion: "0.1.0",
});

const root = document.getElementById("root");
if (!root) throw new Error("#root missing from index.html");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
