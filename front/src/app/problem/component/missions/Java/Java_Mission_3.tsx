import { Box, Typography, Card } from "@mui/material";

export const Java_Mission_3 = () => {
    return (
    <>
        <Typography variant="h6" fontWeight="bold">
        このミッションでやること
        </Typography>

        <ul>
        <li>コメントを書いて、コードの意図を伝える</li>
        <li>インデントを揃えて、構造を見やすくする</li>
        <li>プログラムの動きは変えない</li>
        </ul>

        <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>
        完成イメージ
        </Typography>

        <Card sx={{ p: 2, backgroundColor: "#f9f9f9" }}>
        <pre>
        {`public class Sample {
    public static void main(String[] args) {
        // メッセージを表示する
        System.out.println("Hello");
    }
}`}
        </pre>
        </Card>

        <Typography sx={{ mt: 2 }}>
        ※ 新しい文法は増えません。<br />
        今まで書いてきたコードを「整える」ことに集中しましょう。
        </Typography>
    </>
    )
}
