/**
 * URL: /mission/[missionId]/play
 *
 * Mission内のActivityを順番に学習する画面のNext.jsルート入口。
 * 画面・回答・進捗の実装は `features/learning/mission-activity-play` へ委譲する。
 */
import { MissionActivityPlayPage } from "@/features/learning/mission-activity-play/MissionActivityPlayPage";

export default function MissionActivityPlayRoute() {
  return <MissionActivityPlayPage />;
}
