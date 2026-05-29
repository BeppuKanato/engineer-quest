import { diffLines } from "diff";
import { UserDiffResult } from "./type";

type JsDiffChange = {
    value: string;
    added?: boolean;
    removed?: boolean;
};

const splitLines = (value: string) => {
    const lines = value.split("\n");

    if (lines[lines.length - 1] === "") {
        lines.pop();
    }

    return lines;
};

export const normalizeCode = (code: string) => {
    return code
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n")
        .trim();
};

export const isCodeCorrect = (userCode: string, answerCode: string) => {
    return normalizeCode(userCode) === normalizeCode(answerCode);
};

export const createUserLineDiff = (
    answerCode: string,
    userCode: string,
): UserDiffResult => {
    const changes = diffLines(
        normalizeCode(answerCode),
        normalizeCode(userCode),
    ) as JsDiffChange[];

    const lines: UserDiffResult["lines"] = [];
    let userLineNumber = 1;
    let hasDifference = false;

    for (let index = 0; index < changes.length; index += 1) {
        const change = changes[index];
        const currentLines = splitLines(change.value);

        if (change.removed) {
            hasDifference = true;

            const nextChange = changes[index + 1];

            if (nextChange?.added) {
                const addedLines = splitLines(nextChange.value);

                addedLines.forEach((line, lineIndex) => {
                    lines.push({
                        id: `${index}-${lineIndex}-changed`,
                        lineNumber: userLineNumber,
                        text: line,
                        status: "changed",
                    });

                    userLineNumber += 1;
                });

                index += 1;
            }

            continue;
        }

        if (change.added) {
            hasDifference = true;

            currentLines.forEach((line, lineIndex) => {
                lines.push({
                    id: `${index}-${lineIndex}-extra`,
                    lineNumber: userLineNumber,
                    text: line,
                    status: "extra",
                });

                userLineNumber += 1;
            });

            continue;
        }

        currentLines.forEach((line, lineIndex) => {
            lines.push({
                id: `${index}-${lineIndex}-same`,
                lineNumber: userLineNumber,
                text: line,
                status: "same",
            });

            userLineNumber += 1;
        });
    }

    return {
        lines,
        hasDifference,
    };
};

export const createPreviewSrcDoc = (html: string, css: string) => {
    return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>${css}</style>
  </head>
  <body>
    ${html}
  </body>
</html>
`;
};