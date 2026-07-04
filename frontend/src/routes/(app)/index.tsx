import { Title, Meta, Link } from "@solidjs/meta";
import { clientOnly } from "@solidjs/start";

const DashboardClient = clientOnly(() => import("../../pages/Dashboard"), {
  lazy: true,
});

export default function HomePage() {
  return (
    <>
      <Title>PDF翻訳 - 翻訳済みPDFと対訳PDFを作成</Title>
      <Meta
        name="description"
        content="PDFをアップロードして、翻訳済みPDFと対訳PDFを作成できるWebアプリです。"
      />
      <Link rel="canonical" href="https://pdftr.pages.dev/" />
      <DashboardClient />
    </>
  );
}
