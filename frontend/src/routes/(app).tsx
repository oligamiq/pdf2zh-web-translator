import { Suspense } from "solid-js";
import AuthSessionLoader from '../components/AuthSessionLoader';

export default function AppLayout(props: { children: any }) {
  return (
    <>
      <AuthSessionLoader />
      {props.children}
    </>
  );
}
