import { Title, Meta } from "@solidjs/meta";
import { clientOnly } from "@solidjs/start";

const DashboardClient = clientOnly(() => import("../../pages/Dashboard"), {
  lazy: true,
});

export default function AppIndexPage() {
  return (
    <>
      <Title>PDF翻訳アプリ</Title>
      <Meta name="robots" content="noindex,nofollow" />
      <DashboardClient />
    </>
  );
}
