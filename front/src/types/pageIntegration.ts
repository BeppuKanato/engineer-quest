import type { ComponentType, ReactNode } from "react";

/** app側からページへ渡す共有UI・到達観測の接続。 */
export type PageIntegration = {
  header: ReactNode;
  FeedbackDestination: ComponentType<{
    ready: boolean;
    failed?: boolean;
    targetId?: string | null;
    actualRoute?: string;
  }>;
};