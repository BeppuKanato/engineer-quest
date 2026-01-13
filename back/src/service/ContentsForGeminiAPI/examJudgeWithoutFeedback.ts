import { MissionExamLanguages } from "@prisma/client";

export const examJudgeWithoutFeedback = (missionCode: {[key in MissionExamLanguages]?: string}, userCode: {[key in MissionExamLanguages]?: string}, factor: string[], instructions: string[]): {contents: string, systemInstruction: string} => {
    return {
        contents: `
            サンプルコードと比較して、ユーザコードを100点満点で採点してください。
            サンプルコードと同じ動作をするコードであれば高得点となります。
            サンプルコードはあくまで参考例であり、実装方法が異なっていても問題ありません。

            【採点要素（factor）】
                以下の項目ごとに最大点を上限に部分点を付与して評価してください。
                ${factor.map((f, i) => `${i + 1}. ${f}`).join("\n")}

                ${instructions && instructions.length > 0
                ? `【実装指示】
                以下は学習者に与えた指示です。この指示が満たされているかも採点の参考にしてください。
                ${instructions.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}`
                : ""}

            【スコアガイドライン（厳守）】
                - 各 factor は最大点まで部分点を付与してよい。
                - 全体スコアは 0〜100 の範囲で必ず 5点刻み（0, 5, 10, …, 100）。
                - 各 factor の達成度は以下で判断する：
                    ・完全に満たす → 最大点
                    ・概ね満たす → 最大点の 70%
                    ・一部のみ満たす → 最大点の 40%
                    ・ほぼ満たさない → 0〜20%
                - 実装方法の違いは減点対象にせず、必要機能が満たされていれば満点とする。
                - タイポは実行に影響がある場合のみ減点対象とする。
               
            【出力形式（厳守）】
                以下の形式でのみ出力してください：
                {
                "score": number,  // 0〜100 の 5点刻み
                "reason": {
                    "good": [
                    "良い点1（25文字以内の一文）",
                    "良い点2（25文字以内の一文）"
                    ],
                    "bad": [
                    "改善点1（30文字以内の一文）"
                    ]
                }
                }

            【制約（厳守）】
                - good は必ず 2つ、bad は必ず1つ。
                - 上記 JSON 以外の文章は出力しない。
                - bad を出すために減点してはならない
                - 出力は JSON のみとし、コードブロックは一切使用しないでください。

            【サンプルコード(学習者には非公開)】
            ${Object.entries(missionCode).map(([lang, code]) => `--- ${lang} ---\n${code}`).join("\n\n")}

            【ユーザコード】
            ${Object.entries(userCode).map(([lang, code]) => `--- ${lang} ---\n${code}`).join("\n\n")}
        `,
        systemInstruction: `
            あなたは「学習支援を目的とした評価を行う教育者」です。
            文体はです・ます調に統一し、出力形式とスコアガイドラインを厳密に守ってください。
        `
    }
}