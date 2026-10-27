import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "./app/Provider";
import { App } from "./app/App";
import "./styles/style.css";
import { LocaleProvider } from "./i18n/LocaleProvider";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LocaleProvider>
      <Provider>
        <App />
      </Provider>
    </LocaleProvider>
  </StrictMode>,
);
