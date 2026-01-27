import { JudgeType, MissionExamLanguages } from "@prisma/client";

const hexadFeedbackInstructions: { [key in JudgeType]: string } = {
    STANDARD: "特定のユーザタイプを想定しない、一般的で中立的な学習者向けフィードバックです。学習への取り組みを肯定し、学習意欲を高めるフィードバックを作成してください。",
    PHILANTHROPIST: "以下は「user types hexad」の「PHILANTHROPIST」タイプの特徴です。「PHILANTHROPISTタイプ」の動機付け特性を踏まえ、学習の取り組み方を肯定し、学習意欲を高めるフィードバックを作成してください。" + 
                    "【特徴】：Philanthropists are motivated by Purpose and Meaning. This group are altruistic, wanting to give to other people and enrich the lives of others in some way with no expectation of reward.",
    ACHIEVER: "以下は「user types hexad」の「ACHIEVER」タイプの特徴です。「ACHIEVERタイプ」の動機付け特性を踏まえ、学習の取り組み方を肯定し、学習意欲を高めるフィードバックを作成してください。" + 
              "【特徴】：Achievers are motivated by Mastery. They are looking to learn new things and improve themselves. They want challenges to overcome.",
    FREE_SPIRIT: "以下は「user types hexad」の「FREE_SPIRIT」タイプの特徴です。「FREE_SPIRITタイプ」の動機付け特性を踏まえ、学習の取り組み方を肯定し、学習意欲を高めるフィードバックを作成してください。" +
                 "【特徴】：Free Spirits are motivated by Autonomy and self-expression. They want to create and explore.",
    SOCIALIZER: "以下は「user types hexad」の「SOCIALIZER」の特徴です。「SOCIALIZERタイプ」の動機付け特性を踏まえ、学習の取り組み方を肯定し、学習意欲を高めるフィードバックを作成してください。" + 
                "【特徴】：Socialisers are motivated by Relatedness. They want to interact with others and create social connections.",
    PLAYER: "以下は「user types hexad」の「PLAYER」の特徴です。「PLAYERタイプ」の動機付け特性を踏まえ、学習の取り組み方を肯定し、学習意欲を高めるフィードバックを作成してください。" + 
            "【特徴】：Players are motivated by Rewards. They will do what is needed of them to collect rewards from a system. They are in it for themselves.",
    DISRUPTOR: "以下は「user types hexad」の「DISRUPTOR」の特徴です。「DISRUPTORタイプ」の動機付け特性を踏まえ、学習の取り組み方を肯定し、学習意欲を高めるフィードバックを作成してください。" +
               "【特徴】：Disruptors are motivated by Change. In general, they want to disrupt your system, either directly or through other users to force positive or negative change."
};

export const examJudgeWithFeedback = (missionCode: {[key in MissionExamLanguages]?: string}, userCode: {[key in MissionExamLanguages]?: string}, factor: string[], instructions: string[], judgeType: JudgeType[]): {contents: string, systemInstruction: string} => {
    const selectedDescriptions = judgeType.map(jt => `【${jt}】${hexadFeedbackInstructions[jt]}`).join("\n\n");

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

            【出力形式（JSONで厳守）】
                {
                    "score": number,
                    "reason": {
                        "good": [
                        "良い点1（25文字以内）",
                        "良い点2（25文字以内）"
                        ],
                        "bad": [
                        "改善点1（30文字以内）"
                        ]
                    },
                    "feedbacks": [
                        {
                        "index": 0,
                        "type": "<指定されたユーザタイプ0>",
                        "text": "<指定されたユーザタイプ0>タイプに基づく学習者向けフィードバック文（300文字以内）"
                        },
                        {
                        "index": 1,
                        "type": "<指定されたユーザタイプ1>",
                        "text": "<指定されたユーザタイプ1>タイプに基づく学習者向けフィードバック文（300文字以内）"
                        },
                        {
                        "index": 2,
                        "type": "<指定されたユーザタイプ2>",
                        "text": "<指定されたユーザタイプ2>タイプに基づく学習者向けフィードバック文（300文字以内）"
                        },
                        {
                        "index": 3,
                        "type": "<指定されたユーザタイプ3>",
                        "text": "<指定されたユーザタイプ3>タイプに基づく学習者向けフィードバック文（300文字以内）"
                        }
                    ]
                }

            【制約（厳守）】
                - good は必ず 2つ、bad は必ず1つ。
                - 上記 JSON 以外の文章は出力しない。
                - bad を出すために減点してはならない。
                - 出力は JSON のみとし、コードブロックは一切使用しないでください。
                - フィードバックの構成は次の【フィードバック文の構成指示】に従うこと。
                - ユーザタイプは、フィードバック文の語調・価値づけ・動機づけの方向性にのみ反映させること。
                - feedbacks配列は必ず4要素とすること。
                - 各要素のindexは0から始め、指定されたユーザタイプの順序と一致させること。
                - typeには、指定されたユーザタイプ名(ACHIEVER、PLAYERなど)をそのまま使用すること。
                - textには、そのtypeに対応するユーザタイプの特徴を反映したフィードバック文(300文字以内)を記載すること。
                - フィードバック文中でユーザタイプ名(ACHIEVER、PLAYERなど)を直接言及しないこと。
            【フィードバック文の構成指示】
            以下に指定する4つのユーザタイプごとに、学習者向けのフィードバックを作成してください。フィードバックは以下の構成で作成してください。※ STANDARD は、特定のユーザタイプを想定しない比較基準条件として含める。
            指定されたユーザタイプ：
            ${judgeType.map((jt, i) => `index = ${i}: ${jt}`).join("\n")}
            【構成内容】2では、新たな技術的指摘や修正点は述べないこと。技術的な内容は1または3で扱ってください。
                【構成内容】
                1. 実装全体に対する簡潔なフィードバック
                2. 実装内容を踏まえつつ、指定されたユーザタイプ(HEXAD)の傾向に配慮し、以下のいずれかを必ず含めたフィードバックを行うこと：
                    - 取り組み方への肯定的評価
                    - 学習を続けたくなる心理的後押し
                3. 実装内容および指定されたユーザタイプを踏まえ、次に取り組むとよい学習の方向性
            
            【各ユーザタイプの参考説明(内部用・出力しない)】
            ${selectedDescriptions}

            【サンプルコード（学習者には非公開）】
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