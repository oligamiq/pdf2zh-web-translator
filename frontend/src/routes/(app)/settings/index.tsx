import { Title, Meta } from "@solidjs/meta";
import { clientOnly } from "@solidjs/start";

const SettingsClient = clientOnly(() => import("../../../pages/Settings"), {
  lazy: true,
});

export default function SettingsPage() {
  return (
    <>
      <Title>設定 - PDF翻訳</Title>
      <Meta name="robots" content="noindex,nofollow" />
      <SettingsClient />
    </>
  );
}
