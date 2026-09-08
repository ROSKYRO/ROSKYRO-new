import ReactDOMServer from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

// Called from scripts/prerender.mjs (Node, build time only) — never shipped
// to the browser. Renders the same component tree the client uses, for a
// given path, to plain HTML. Effects (data fetching, etc.) don't run during
// renderToString, so this is just the static shell + known content — the
// client bundle takes over and fetches live data normally after it loads.
export function render(url) {
  return ReactDOMServer.renderToString(
    <StaticRouter location={url}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StaticRouter>
  );
}
