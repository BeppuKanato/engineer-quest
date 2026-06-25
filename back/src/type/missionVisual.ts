export type MissionVisualPlacement = "full" | "aside";

export type MissionVisualTone =
  | "blue"
  | "green"
  | "orange"
  | "purple"
  | "gray";

export type MissionVisualIcon =
  | "browser"
  | "server"
  | "database"
  | "cloud"
  | "user"
  | "device"
  | "file"
  | "code"
  | "html"
  | "css";

type MissionVisualBase = {
  title?: string;
  caption?: string;
};

export type FlowDiagramVisual = MissionVisualBase & {
  type: "FLOW_DIAGRAM";
  direction?: "horizontal" | "vertical";
  nodes: Array<{
    id: string;
    label: string;
    description?: string;
    icon: MissionVisualIcon;
    tone?: MissionVisualTone;
  }>;
  edges: Array<{
    id: string;
    from: string;
    to: string;
    label?: string;
    reverseLabel?: string;
    bidirectional?: boolean;
  }>;
};

export type ComparePanelVisual = MissionVisualBase & {
  type: "COMPARE_PANEL";
  panels: Array<{
    id: string;
    title: string;
    subtitle?: string;
    tone?: MissionVisualTone;
    items: string[];
  }>;
};

export type IllustrationPanelVisual = MissionVisualBase & {
  type: "ILLUSTRATION_PANEL";
  image: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  };
};

export type CodeExplainVisual = MissionVisualBase & {
  type: "CODE_EXPLAIN";
  language: string;
  code: string;
  annotations: Array<{
    id: string;
    line: number;
    label: string;
    description: string;
  }>;
};

export type CodePreviewVisual = MissionVisualBase & {
  type: "CODE_PREVIEW";
  language: string;
  code: string;
  preview: {
    heading?: string;
    paragraphs?: string[];
    buttonLabel?: string;
  };
};

export type FileTreeMapVisual = MissionVisualBase & {
  type: "FILE_TREE_MAP";
  root: FileTreeNode;
};

export type FileTreeNode = {
  name: string;
  kind: "file" | "directory";
  description?: string;
  children?: FileTreeNode[];
};

export type BeforeAfterVisual = MissionVisualBase & {
  type: "BEFORE_AFTER";
  before: ComparisonSnapshot;
  after: ComparisonSnapshot;
};

export type ComparisonSnapshot = {
  label: string;
  image?: {
    src: string;
    alt: string;
  };
  lines?: string[];
};

export type MissionVisual =
  | FlowDiagramVisual
  | ComparePanelVisual
  | IllustrationPanelVisual
  | CodeExplainVisual
  | CodePreviewVisual
  | FileTreeMapVisual
  | BeforeAfterVisual;

export type MissionVisualContent = {
  version: 1;
  placement: MissionVisualPlacement;
  data: MissionVisual;
};

export const defineMissionVisual = <T extends MissionVisualContent>(
  visual: T
): T => visual;
