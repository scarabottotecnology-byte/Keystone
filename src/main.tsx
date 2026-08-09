// Fontes auto-hospedadas. Nunca de CDN: dependência externa e vazamento
// da visita do usuário para terceiro.
import "@fontsource-variable/newsreader";
import "@fontsource-variable/inter";

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
