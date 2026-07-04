import { Navigate, useLocation } from "@solidjs/router";

export default function AppIndexRedirect() {
  const location = useLocation();
  const search = location.search || "";
  return <Navigate href={`/${search}`} />;
}
