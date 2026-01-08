"use client";

import { useState } from "react";
import { Box, Typography, Button, List, ListItem, ListItemText, Input } from "@mui/material";
import { isComponentType, MissionComponentProps } from "../../common/common";

export const Web_Mission_4 = ({ componentType }: MissionComponentProps) => {
  // 状態管理
  const [score, setScore] = useState<number | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  return (
    <Box className="flex flex-col gap-4 p-4">
      {isComponentType("", componentType) && (
        <>
          <Typography sx={{ mb: 2 }}>
            このレッスンでは、JavaScript の基本構文を実際に体験しながら学びます。
            それぞれのステップで動作を確認して理解を深めましょう。
          </Typography>

          <Typography variant="h6" sx={{ mb: 1 }}>
            💡 今回扱う内容
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="・変数宣言（var / let / const の違い）" />
            </ListItem>
            <ListItem>
              <ListItemText primary="・データ型（数値・文字列・配列など）" />
            </ListItem>
            <ListItem>
              <ListItemText primary="・条件分岐（if文 / 比較演算子）" />
            </ListItem>
            <ListItem>
              <ListItemText primary="・繰り返し処理（for文）" />
            </ListItem>
            <ListItem>
              <ListItemText primary="・関数（function / アロー関数）" />
            </ListItem>
          </List>
        </>
      )}
      {/* 変数宣言 */}
      {isComponentType("step-1-1", componentType) && (
      <Box className="p-4 border rounded-lg bg-gray-50 flex flex-col gap-3">
          <Typography variant="h6">var / let / const の違いを体験してみよう</Typography>

          {/* var の例（擬似） */}
          <Box>
          <Typography color="primary">① var の例</Typography>
          <Typography>var name = &quot;太郎&quot;;</Typography>
          <Button
              variant="contained"
              color="primary"
              onClick={() => {
              // 擬似的に var の動作を再現
              let name = "太郎"; // 実際には let で代用
              name = "次郎"; // 再代入OK
              setMessage(`var は再代入OK（スコープが関数単位）→ name = ${name}`);
              }}
          >
              実行
          </Button>
          </Box>

          {/* let の例 */}
          <Box>
          <Typography color="primary">② let の例</Typography>
          <Typography>let count = 1;</Typography>
          <Button
              variant="contained"
              color="secondary"
              onClick={() => {
              let count = 1;
              count = 2; // 再代入OK
              setMessage(`let も再代入OK（スコープがブロック単位）→ count = ${count}`);
              }}
          >
              実行
          </Button>
          </Box>

          {/* const の例 */}
          <Box>
          <Typography color="primary">③ const の例</Typography>
          <Typography>const PI = 3.14;</Typography>
          <Button
              variant="contained"
              color="success"
              onClick={() => {
              setMessage("const は再代入できません（固定値として使います）");
              }}
          >
              実行
          </Button>
          </Box>

          {/* 結果表示 */}
          <Typography
          variant="body1"
          className="mt-2 p-2 bg-white rounded border text-center"
          >
          {message}
          </Typography>
      </Box>
      )}

      {isComponentType("step-1-3", componentType) && (
      <Box className="p-4 border rounded-lg bg-gray-50 flex flex-col gap-4">
          <Typography variant="h6">JavaScriptのデータ型と宣言の例</Typography>
          <Typography>
          JavaScriptでは型を宣言しなくても自動で判断してくれます。正しい書き方を見てみましょう。
          </Typography>

          {/* 間違った例 */}
          <Box className="p-3 border border-red-400 rounded bg-red-50 flex items-center gap-2">
          <Typography className="text-red-600 font-bold">×</Typography>
          <Typography>
              int count = 1;  {/* 型指定は不要 */}
          </Typography>
          </Box>

          {/* 正しい例 */}
          <Box className="p-3 border border-green-400 rounded bg-green-50 flex items-center gap-2">
          <Typography className="text-green-600 font-bold">〇</Typography>
          <Typography>
              let count = 1;  {/* JavaScriptではこれでOK */}
          </Typography>
          </Box>

          {/* 別の型例 */}
          <Box className="p-3 border border-green-400 rounded bg-green-50 flex items-center gap-2">
          <Typography className="text-green-600 font-bold">〇</Typography>
          <Typography>
              const name = &quot;太郎&quot;  {/* 文字列 */}
          </Typography>
          </Box>

          <Box className="p-3 border border-green-400 rounded bg-green-50 flex items-center gap-2">
          <Typography className="text-green-600 font-bold">〇</Typography>
          <Typography>
              const fruits = [&quot;りんご&quot;, &quot;みかん&quot;];  {/* 配列 */}
          </Typography>
          </Box>
      </Box>
      )}
      {isComponentType("step-1-exam", componentType) && (
          <Box className="p-4 border rounded-lg bg-gray-50 flex flex-col gap-3">
              <Typography variant="h6">名前と年齢を変数に代入する条件</Typography>
              <Typography>以下の条件を満たすようにコードを書きましょう。</Typography>

              {/* 名前の条件 */}
              <Box className="p-3 border border-green-400 rounded bg-green-50 flex items-center gap-2">
              <Typography className="text-green-600 font-bold">〇</Typography>
              <Typography>名前: 山田太郎 代入可能</Typography>
              </Box>

              {/* 年齢の条件 */}
              <Box className="p-3 border border-green-400 rounded bg-green-50 flex items-center gap-2">
              <Typography className="text-green-600 font-bold">〇</Typography>
              <Typography>年齢: 25 代入可能</Typography>
              </Box>
          </Box>
      )}
      {isComponentType("step-2-1", componentType) && (
      <Box className="p-4 border rounded-lg bg-gray-50 flex flex-col gap-4">
          <Typography variant="h6">if文の挙動を体験してみよう</Typography>
          <Typography>
          「スコア」に応じて合格か不合格か判定されます。<br />80点以上が合格です。<br />数字を変えてボタンを押してみましょう。
          </Typography>

          <Box className="flex gap-2 items-center">
          <Typography>スコア:</Typography>
          <Input
              type="number"
              value={score ?? ""}
              onChange={(e) => setScore(Number(e.target.value))}
              className="border rounded px-2 py-1 w-24"
          />
          <Button
              variant="contained"
              color="primary"
              onClick={() => {
              if (score === null) {
                  setMessage("まずスコアを入力してください");
              } else if (score >= 80) {
                  setMessage("合格です");
              } else {
                  setMessage("不合格です");
              }
              }}
          >
              判定
          </Button>
          </Box>

          <Typography className="mt-2 p-2 bg-white rounded border text-center">
          {message}
          </Typography>
      </Box>
      )}

      {isComponentType("step-2-2", componentType) && (
        <Box
          sx={{
            p: 4,
            border: "1px solid",
            borderColor: "grey.300",
            borderRadius: 2,
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography variant="h6">比較演算子の結果</Typography>

          <Typography>
            各比較演算子を使ったときの結果を確認してみましょう。
          </Typography>

          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
              🔹 等価演算子（==）
            </Typography>
            <Typography>2 == &quot;2&quot; → <strong>true</strong>（型が違っても値が同じなら一致）</Typography>
            <Typography>2 == 3 → <strong>false</strong></Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
              🔹 厳密等価演算子（===）
            </Typography>
            <Typography>2 === &quot;2&quot; → <strong>false</strong>（型が違うため不一致）</Typography>
            <Typography>2 === 2 → <strong>true</strong></Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
              🔹 大なり・小なり演算子（&gt;, &lt;）
            </Typography>
            <Typography>5 &gt; 3 → <strong>true</strong></Typography>
            <Typography>3 &lt; 1 → <strong>false</strong></Typography>
            <Typography>&quot;5&quot; &gt; 3 → <strong>true</strong>（文字列 &quot;5&quot; が数値に変換される）</Typography>
          </Box>

          <Typography sx={{ color: "text.secondary", mt: 2 }}>
            💡基本的には、型の違いによる誤動作を防ぐために
            <code>===</code> を使います。
          </Typography>
        </Box>
      )}
      {/* 条件分岐 */}
      {isComponentType("step-2-exam", componentType) && (
        <Box>
          <Typography>年齢で成人か未成年か判定してみよう</Typography>
          <Input
            type="number"
            value={age ?? ""}
            onChange={(e) => setAge(Number(e.target.value))}
            className="border rounded px-2 py-1 w-24"
          /><br />
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (age === null) {
                setMessage("まず年齢を設定してください");
              } else if (age >= 20) {
                setMessage("成人");
              } else {
                setMessage("未成年");
              }
            }}
          >
            判定
          </Button>
          <Typography>{message}</Typography>
        </Box>
      )}

      {/* 繰り返し処理 */}
      {isComponentType("step-3", componentType) && (
        <Box>
          <Typography>1から10までの数字を表示してみよう</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              let result = "";
              for (let i = 1; i <= 10; i++) {
                result += i + " ";
              }
              setMessage(result);
            }}
          >
            実行
          </Button>
          <Typography>{message}</Typography>
        </Box>
      )}

      {/* 関数 */}
      {isComponentType("step-4", componentType) && (
        <Box>
          <Typography>2つの数を足す関数を作ってみよう</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              const add = (a: number, b: number) => a + b;
              setMessage(`3 + 4 = ${add(3, 4)}`);
            }}
          >
            実行
          </Button>
          <Typography>{message}</Typography>
        </Box>
      )}
    </Box>
  );
};
