// hybridExamScreen.tsx
import React from "react";
import { InstructionList } from "./instructionList";
import { ObjectScreen } from "./objectScreen";

export const HybridExamScreen = ({
  componentName,
  instructions,
  title
}: {
  componentName: string;
  instructions: string[];
  title?: string;
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* 要件カード */}
      <div className="bg-gray-50 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">要件</h2>
        <InstructionList
          instructions={instructions}
          title={title}
        />
      </div>

      {/* 目標画面カード */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">目標画面</h2>
        <ObjectScreen componentName={componentName} isHybrid />
      </div>
    </div>
  );
};
