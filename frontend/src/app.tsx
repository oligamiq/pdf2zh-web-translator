import { MetaProvider } from "@solidjs/meta";
import { Router, Route, Navigate } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./index.css";

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <div class="min-h-screen bg-gray-900 text-gray-100 font-sans">
            <Suspense>{props.children}</Suspense>
          </div>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
