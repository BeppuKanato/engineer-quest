import type { CreateWork } from "@/api/create.api";

export const buildWorkShareHref = (work: CreateWork) => {
  const params = new URLSearchParams({
    category: "WORK_SHARE",
    title: work.title,
    workId: work.id,
    referenceUrl: `/my-works/${work.id}`,
  });

  const lines = [
    work.description,
    "",
    `制作テーマ: ${work.themeTitle}`,
    work.publicUrl ? `作品URL: ${work.publicUrl}` : "",
    work.repositoryUrl ? `リポジトリ: ${work.repositoryUrl}` : "",
  ].filter(Boolean);

  params.set("body", lines.join("\n"));

  if (work.courseId) {
    params.set("courseId", work.courseId);
  }

  return `/quest-board/new?${params.toString()}`;
};
