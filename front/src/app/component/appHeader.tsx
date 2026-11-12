"use client";

import { Skeleton } from "@mui/material";
import { usePathname } from "next/navigation";
import { AppHeaderView } from "@/components/layouts/AppHeaderView";
import { useUserMascotState } from "./mascot";
import { MascotFigure } from "./mascotFigure";

/** アプリの利用者状態を表示専用ヘッダーへ接続する。 */
export function AppHeader() {
  const pathname = usePathname();
  const { mascotId, isLoading: isMascotLoading } = useUserMascotState();
  return <AppHeaderView pathname={pathname} profileIcon={isMascotLoading || !mascotId ? (
    <Skeleton
      variant="circular"
      animation="wave"
      sx={{
        width: { xs: 38, md: 48 },
        height: { xs: 38, md: 48 },
        bgcolor: "rgba(255,255,255,0.38)",
      }}
    />
  ) : (
    <MascotFigure mascotId={mascotId} alt="ユーザーアイコン" size="S" presentation="circle" />
  )} />;
}
