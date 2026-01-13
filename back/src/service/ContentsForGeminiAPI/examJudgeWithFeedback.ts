import { JudgeType, MissionExamLanguages } from "@prisma/client";

const hexadFeedbackInstructions: { [key in JudgeType]: string } = {
    WITH_FEEDBACK: "学習者が理解しやすく、前向きに取り組めるよう、一般的で中立的なフィードバックを提供してください。",
    WITHOUT_FEEDBACK: "",
    PHILANTHROPIST: "学習者は「user types hexad」の「PHILANTHROPIST」の傾向が強いです。「PHILANTHROPISTタイプ」のモチベーション向上に適したフィードバックを提供してください。",
    ACHIEVER: "学習者は「user types hexad」の「ACHIEVER」の傾向が強いです。「ACHIEVERタイプ」のモチベーション向上に適したフィードバックを提供してください。",
    FREE_SPIRIT: "学習者は「user types hexad」の「FREE_SPIRIT」の傾向が強いです。「FREE_SPIRITタイプ」のモチベーション向上に適したフィードバックを提供してください。",
    SOCIALIZER: "学習者は「user types hexad」の「SOCIALIZER」の傾向が強いです。「SOCIALIZERタイプ」のモチベーション向上に適したフィードバックを提供してください。",
    PLAYER: "学習者は「user types hexad」の「PLAYER」の傾向が強いです。「PLAYERタイプ」のモチベーション向上に適したフィードバックを提供してください。",
    DISRUPTOR: "学習者は「user types hexad」の「DISRUPTOR」の傾向が強いです。「DISRUPTORタイプ」のモチベーション向上に適したフィードバックを提供してください。"
};

export const examJudgeWithFeedback = (missionCode: {[key in MissionExamLanguages]?: string}, userCode: {[key in MissionExamLanguages]?: string}, factor: string[], instructions: string[], judgeType: JudgeType): {contents: string, systemInstruction: string} => {
    return {
        contents :`
            サンプルコードと比較して、ユーザコードを100点満点で採点してください。
            サンプルコードと同じ動作をするコードであれば高得点となります。
            サンプルコードはあくまで参考例であり、実装方法が異なっていても問題ありません。

            【採点要素（factor）】
                以下の項目ごとに、最大点を上限に部分点を付与して評価してください。
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

            【出力形式（JSON で厳守）】
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
                    },
                "feedback": "学習者向けのフィードバック文(300文字以内)"
                }

            【制約（厳守）】
                - good は必ず 2つ、bad は必ず1つ。
                - 上記 JSON 以外の文章は出力しない。
                - bad を出すために減点してはならない
                - 出力は JSON のみとし、コードブロックは一切使用しないでください。

            【サンプルコード（学習者には非公開）】
            ${Object.entries(missionCode).map(([lang, code]) => `--- ${lang} ---\n${code}`).join("\n\n")}

            【ユーザコード】
            ${Object.entries(userCode).map(([lang, code]) => `--- ${lang} ---\n${code}`).join("\n\n")}
        `,
        systemInstruction: `
                あなたは「学習支援を目的とした評価を行う教育者」です。
                文体はです・ます調に統一し、出力形式とスコアガイドラインを厳密に守ってください。
                ${hexadFeedbackInstructions[judgeType as JudgeType]}
            `
    }
}