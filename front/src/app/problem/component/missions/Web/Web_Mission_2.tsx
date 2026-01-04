"use client";

import { Box, Typography, Card, TextField, Radio, RadioGroup, FormControlLabel, Select, MenuItem, Button } from "@mui/material";
import { isComponentType, MissionComponentProps } from "../../common/common";

export const Web_Mission_2 = ({ componentType }: MissionComponentProps) => {
  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        入力フォームプレビュー
      </Typography>

      <Card sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          
          {/* === step-1-1: form と input（text） === */}
          {isComponentType("step-1-1", componentType) && (
            <>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                名前入力フォーム（基本構造）
              </Typography>
              <form>
                <TextField label="名前" variant="outlined" fullWidth />
              </form>
            </>
          )}

          {/* === step-1-2: text / email フィールド === */}
          {isComponentType("step-1-2", componentType) && (
            <>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                2種類の入力欄（text / email）
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField label="名前 (text)" placeholder="名前" fullWidth />
                <TextField label="メール (email)" type="email" placeholder="メール" fullWidth />
              </Box>
            </>
          )}

          {/* === step-2-1: ラジオボタン === */}
          {isComponentType("step-2-1", componentType) && (
            <>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                ラジオボタン（男女の選択）
              </Typography>
              <RadioGroup defaultValue="man" name="gender">
                <FormControlLabel value="man" control={<Radio />} label="男" />
                <FormControlLabel value="woman" control={<Radio />} label="女" />
              </RadioGroup>
            </>
          )}

          {/* === step-3-1: select（部署選択） === */}
          {isComponentType("step-3-1", componentType) && (
            <>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                部署を選ぶプルダウン（select）
              </Typography>
              <Select defaultValue="dev" fullWidth>
                <MenuItem value="sales">営業</MenuItem>
                <MenuItem value="dev">開発</MenuItem>
                <MenuItem value="general">総務</MenuItem>
              </Select>
            </>
          )}

          {/* === step-4-1: 送信ボタン === */}
          {isComponentType("step-4-1", componentType) && (
            <>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                送信ボタン
              </Typography>
              <Button variant="contained" color="primary" type="submit">
                送信
              </Button>
            </>
          )}

          {/* === (default) ミッション開始画面フォールバック === */}
          {isComponentType("", componentType) && (
            <>
              <Typography>
                このミッションでは、HTML の入力フォーム要素（input, radio, select, button）を一覧で確認できます。
              </Typography>
              <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: "bold" }}>
                ここで扱う要素
              </Typography>
              <ul>
                <li>テキスト入力（text）/ メール入力（email）</li>
                <li>ラジオボタン（radio）</li>
                <li>プルダウンメニュー（select）</li>
                <li>送信ボタン（button type=`@quot`submit`@quot`）</li>
              </ul>
            </>
          )}
        </Box>
      </Card>
    </Box>
  );
};
