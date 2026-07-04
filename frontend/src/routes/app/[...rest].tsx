import { Navigate, useParams, useLocation } from "@solidjs/router";

export default function AppRedirect() {
  const params = useParams();
  const location = useLocation();
  const rest = params.rest || "";
  const search = location.search || "";
  return <Navigate href={`/${rest}${search}`} />;
}
