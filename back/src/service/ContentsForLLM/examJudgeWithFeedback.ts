import { JudgeType, MissionExamLanguages } from "@prisma/client";

const hexadFeedbackInstructions: { [key in JudgeType]: string } = {
    WITH_FEEDBACK: "学習者のユーザタイプは考慮せず、全学習者に共通する標準的なフィードバックを提供してください。",
    WITHOUT_FEEDBACK: "",
    PHILANTHROPIST: "学習者は「user types hexad」の「PHILANTHROPIST」の傾向が強いです。「PHILANTHROPISTタイプ」の動機付け特性を踏まえ、学習の取り組み方や姿勢を肯定するフィードバックを提供してください。" + 
                    "以下Pholanthropistタイプの説明：Philanthropists are motivated by Purpose and Meaning. This group are altruistic, wanting to give to other people and enrich the lives of others in some way with no expectation of reward.",
    ACHIEVER: "学習者は「user types hexad」の「ACHIEVER」の傾向が強いです。「ACHIEVERタイプ」の動機付け特性を踏まえ、学習の取り組み方や姿勢を肯定するフィードバックを提供してください。" + 
              "以下Achieverタイプの説明：Achievers are motivated by Mastery. They are looking to learn new things and improve themselves. They want challenges to overcome.",
    FREE_SPIRIT: "学習者は「user types hexad」の「FREE_SPIRIT」の傾向が強いです。「FREE_SPIRITタイプ」の動機付け特性を踏まえ、学習の取り組み方や姿勢を肯定するフィードバックを提供してください" +
                 "以下Free Spiritsタイプの説明：Free Spirits are motivated by Autonomy and self-expression. They want to create and explore.",
    SOCIALIZER: "学習者は「user types hexad」の「SOCIALIZER」の傾向が強いです。「SOCIALIZERタイプ」の動機付け特性を踏まえ、学習の取り組み方や姿勢を肯定するフィードバックを提供してください" + 
                "以下Socializerタイプの説明：Socialisers are motivated by Relatedness. They want to interact with others and create social connections.",
    PLAYER: "学習者は「user types hexad」の「PLAYER」の傾向が強いです。「PLAYERタイプ」の動機付け特性を踏まえ、学習の取り組み方や姿勢を肯定するフィードバックを提供してください" + 
            "以下Playerタイプの説明：Players are motivated by Rewards. They will do what is needed of them to collect rewards from a system. They are in it for themselves.",
    DISRUPTOR: "学習者は「user types hexad」の「DISRUPTOR」の傾向が強いです。「DISRUPTORタイプ」の動機付け特性を踏まえ、学習の取り組み方や姿勢を肯定するフィードバックを提供してください" +
               "以下Disruptorタイプの説明：Disruptors are motivated by Change. In general, they want to disrupt your system, either directly or through other users to force positive or negative change."
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
                - bad を出すために減点してはならない。
                - 出力は JSON のみとし、コードブロックは一切使用しないでください。
                - フィードバックの構成は次の【フィードバック文の構成指示】に従うこと。
                - フィードバック文中で、ユーザタイプ名(ACHIEVER / PLAYERなど)や「あなたは○○タイプです」といった直接的な言及は一切行わない。
                - ユーザタイプは表現のトーンや内容の選択にのみ反映させること。
            【フィードバック文の構成指示】
            フィードバックは以下の構成で作成してください。
            また、学習者のユーザタイプが指定されていない場合は、【構成内容】の2・3は一般的な学習者を想定した内容とし、ユーザタイプは考慮しないでください。
            【構成内容】2では、新たな技術的指摘や修正点は述べないこと。技術的な内容は1または3で扱ってください。
                【構成内容】
                1. 実装全体に対する簡潔なフィードバック
                2. 実装内容を踏まえつつ、学習者のユーザタイプ（HEXAD）の傾向に配慮し、以下のいずれかを必ず含めたフィードバックを行うこと：
                    - 取り組み方への肯定的評価
                    - 学習を続けたくなる心理的後押し
                3. 実装内容および学習者のユーザタイプを踏まえ、次に取り組むとよい学習の方向性

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