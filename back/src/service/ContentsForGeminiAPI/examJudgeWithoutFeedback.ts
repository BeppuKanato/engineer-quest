import { MissionExamLanguages } from "@prisma/client";

export const examJudgeWithoutFeedback = (missionCode: {[key in MissionExamLanguages]?: string}, userCode: {[key in MissionExamLanguages]?: string}, factor: string[], instructions: string[]): {contents: string, systemInstruction: string} => {
    return {
        contents: `サンプルコードと比較して、ユーザコードを100点満点で採点してください。

            【採点要素（factor）】
            以下の項目ごとに最大点を上限に部分点を付与してください。
            ${factor.map((f, i) => `${i + 1}. ${f}`).join("\n")}

            ${instructions && instructions.length > 0
            ? `【実装指示】
            ${instructions.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}`
            : ""}

            【スコアガイドライン（厳守）】
            - 各 factor の達成度に応じて部分点を付与する。
            - 全体スコアは必ず 0〜100 の 5点刻みで返すこと。
            - 出力は score のみを含む JSON とする。他のフィールドは含めないこと。

            【出力形式（厳守）】
            {
            "score": number
            }

            【サンプルコード(学習者には非公開)】
            ${Object.entries(missionCode).map(([lang, code]) => `--- ${lang} ---\n${code}`).join("\n\n")}

            【ユーザコード】
            ${Object.entries(userCode).map(([lang, code]) => `--- ${lang} ---\n${code}`).join("\n\n")}
        `,
        systemInstruction: `
            あなたは「厳密な採点を行う採点官」です。
            指示された採点基準とスコアガイドラインに従い、出力形式を厳密に守ってください。
            評価は簡潔に行い、score 以外の情報は絶対に出力しないでください。
        `
    }
}