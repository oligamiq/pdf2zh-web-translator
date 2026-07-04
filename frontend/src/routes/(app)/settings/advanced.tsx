import { Title, Meta } from "@solidjs/meta";
import { clientOnly } from "@solidjs/start";

const AdvancedSettingsClient = clientOnly(() => import("../../../pages/AdvancedSettings"), {
  lazy: true,
});

export default function AdvancedSettingsPage() {
  return (
    <>
      <Title>高度な設定 - PDF翻訳</Title>
      <Meta name="robots" content="noindex,nofollow" />
      <AdvancedSettingsClient />
    </>
  );
}
