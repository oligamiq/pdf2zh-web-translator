import { Title, Meta } from "@solidjs/meta";
import { clientOnly } from "@solidjs/start";

const JobDetailClient = clientOnly(() => import("../../../pages/JobDetail"), {
  lazy: true,
});

export default function JobDetailPage() {
  return (
    <>
      <Title>ジョブ詳細 - PDF翻訳</Title>
      <Meta name="robots" content="noindex,nofollow" />
      <JobDetailClient />
    </>
  );
}
