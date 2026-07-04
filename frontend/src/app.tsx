import { MetaProvider } from "@solidjs/meta";
import { Router, Route, Navigate } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./index.css";

import GlobalApp from "./App";

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <title>PDF翻訳</title>
          <GlobalApp>
            <Suspense>{props.children}</Suspense>
          </GlobalApp>
        </MetaProvider>
      )}
    >
      <FileRoutes />
      <Route path="/settings" component={() => <Navigate href="/app/settings" />} />
      <Route path="/settings/*" component={() => <Navigate href="/app/settings" />} />
      <Route path="/jobs/*" component={() => <Navigate href="/app" />} />
    </Router>
  );
}
