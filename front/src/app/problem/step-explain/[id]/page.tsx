"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  Skeleton,
  Button as MUIButton,
} from "@mui/material";
import { StepExplainResponse } from "@/type";
import { getMissionComponent } from "../../mapping";
import { BackHeader } from "@/app/component/common/backHeader";
import { navigateWithUpdateUsageTime } from "../../common/common";
import ReactMarkdown from "react-markdown"; // 追加
import { fetchWithoutUserId } from "@/utils/fetchers";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function StepExplainPage() {
  const [responseData, setResponseData] = useState<StepExplainResponse | null>(null);
  const [explainNum, setExplainNum] = useState<number>(0);
  const router = useRouter();
  const { id } = useParams();
  const [user, setUser] = useState<User | null>();

  const startTime = useRef(new Date());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async(user) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUser(user);
    });

    return () => unsub();
  }, [router])

  useEffect(() => {
    const fetchData = async() => {
      const res = await fetchWithoutUserId("/problem/stepExplain", {method: "POST", body: JSON.stringify({stepId: id})});
      const json: StepExplainResponse = await res.json();
      setResponseData(json)
    }
    fetchData();
  }, [id]);

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6 animate-pulse h-64">
        <CardHeader title={<Skeleton width="40%" />} />
        <CardContent>
          <Skeleton variant="rectangular" width="100%" height={120} />
        </CardContent>
      </Card>
      <Card className="p-6 animate-pulse h-64">
        <CardHeader title={<Skeleton width="40%" />} />
        <CardContent>
          <div className="flex gap-4">
            <Skeleton variant="circular" width={48} height={48} />
            <Skeleton variant="rectangular" width="100%" height={80} />
          </div>
        </CardContent>
        <CardActions className="flex justify-end">
          <Skeleton variant="rectangular" width={100} height={36} />
        </CardActions>
      </Card>
    </div>
  );

  if (!responseData) return <div className="bg-indigo-50 min-h-screen p-6">{renderSkeleton()}</div>;
  console.log(responseData.explains[explainNum].componentType);
  return (
    <div className="bg-indigo-50 min-h-screen w-full">
      <BackHeader
        title="ミッション確認へ戻る"
        onClick={() => navigateWithUpdateUsageTime(user, router, `/problem/mission-confirm/${responseData.mission.id}`, startTime.current, "replace")}
      />
      <div className="container mx-auto p-6 flex flex-col gap-6">

        {/* タイトル */}
        <Typography variant="h4" className="text-center mb-4 font-bold">
          {responseData.title}
        </Typography>

        {/* 進捗表示 */}
        <div className="flex items-center gap-2 mb-4 justify-center">
          <span className="text-sm text-gray-500">チュートリアル進捗:</span>
          <div className="flex gap-1">
            {responseData.explains.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index < explainNum
                    ? "bg-green-500"
                    : index === explainNum
                    ? "bg-blue-500"
                    : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {explainNum + 1} / {responseData.explains.length}
          </span>
        </div>

        {/* グリッド表示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左: 目標カード */}
          <Card className="p-6 h-fit">
            <CardHeader
              title={<Typography variant="h6">🎯 テーマ／目標画面</Typography>}
            />
            <CardContent>
              {responseData.explains[explainNum].componentType !== null ? (
                <>
                  <Typography className="text-gray-700 mb-4">
                    テーマ／目標はこちらです
                  </Typography>
                  <div className="border-2 border-indigo-500 rounded-md p-4">
                    {getMissionComponent(
                      responseData.mission.component || "",
                      responseData.explains[explainNum].highlight || "",
                      responseData.explains[explainNum].componentType || ""
                    )}
                  </div>
                </>
              ) : (
                <div className="border-2 border-dashed border-gray-400 rounded-md p-6 text-center text-gray-600 bg-gray-50">
                  <Typography className="text-base mb-2 font-medium">
                    💡 説明内容をしっかり理解しましょう
                  </Typography>
                  <Typography className="text-sm">
                    分からない点は検索や生成AIに頼りましょう。
                  </Typography>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 右: 説明カード */}
          <Card className="p-4 border-2 border-blue-300 bg-blue-50 h-fit">
            <CardHeader
              title={
                <Typography>
                  {responseData.explains[explainNum].supporter.imagePath}{" "}
                  {responseData.explains[explainNum].supporter.name}のレッスン
                  ステップ {explainNum + 1}
                </Typography>
              }
            />
            <CardContent>
              <div className="flex items-start gap-4">
                {/* キャラクター */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xl">
                  {responseData.explains[explainNum].supporter.imagePath}
                </div>
                {/* 吹き出し */}
                <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 text-sm relative flex-1">
                  <div className="absolute -left-2 top-4 w-4 h-4 bg-blue-100 border-l border-b border-blue-300 rotate-45"></div>
                  <p>{responseData.explains[explainNum].content}</p>
                    {/* codeが存在する場合にMarkdown表示 */}
                    {responseData.explains[explainNum].code && (
                      <div className="mt-4 p-2 bg-gray-50 border border-gray-300 rounded">
                        <ReactMarkdown>
                          {responseData.explains[explainNum].code}
                        </ReactMarkdown>
                      </div>
                    )}
                </div>
              </div>
            </CardContent>
            <CardActions className="flex justify-end">
              {explainNum + 1 !== responseData.explains.length ? (
                <MUIButton
                  variant="contained"
                  color="primary"
                  onClick={() => setExplainNum(explainNum + 1)}
                >
                  次へ→
                </MUIButton>
              ) : (
                <MUIButton
                  variant="contained"
                  color="primary"
                  onClick={() =>
                    navigateWithUpdateUsageTime(user, router, `/problem/step-exam/${responseData?.id}`, startTime.current, "push")
                  }
                >
                  コード練習へ→
                </MUIButton>
              )}
            </CardActions>
          </Card>
        </div>
      </div>
    </div>
  );
}
