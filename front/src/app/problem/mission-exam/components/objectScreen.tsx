// objectScreen.tsx
import React from "react";
import { getMissionComponent } from "../../mapping";

export const ObjectScreen = ({
  componentName,
  isHybrid = false
}: {
  componentName: string;
  isHybrid?: boolean;
}) => {
  return (
    <div>
      {!isHybrid && (
        <p className="text-gray-700 mb-4">
          この右側に表示されている画面と同じ内容を作成するHTMLコードを、
          左側のテキストエリアに書いてみましょう。
        </p>
      )}
      <div className="border-2 border-indigo-500 rounded-md p-4">
        {getMissionComponent(componentName, "", "")}
      </div>
    </div>
  );
};
