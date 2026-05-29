import { MissionExamDifficulty, MissionExamProblem } from "./type";

const ANSWER_CODE = `<div class="profile-card">
  <img class="profile-avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='60' fill='%23bfdbfe'/%3E%3Ccircle cx='60' cy='46' r='22' fill='%231d4ed8'/%3E%3Cpath d='M25 104c7-24 25-36 35-36s28 12 35 36' fill='%231d4ed8'/%3E%3C/svg%3E" alt="プロフィール画像" />
  <h1>山田 太郎</h1>
  <p>HTMLとCSSを学習中です。楽しくWebページを作れるようになりたいです。</p>
</div>`;

const PREVIEW_CSS = `
body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%);
  font-family: Arial, sans-serif;
}

.profile-card {
  width: 280px;
  padding: 28px 24px;
  border-radius: 24px;
  background: #ffffff;
  text-align: center;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
}

.profile-avatar {
  width: 88px;
  height: 88px;
  border-radius: 999px;
  object-fit: cover;
  margin-bottom: 16px;
}

.profile-card h1 {
  margin: 0 0 10px;
  color: #1e293b;
  font-size: 26px;
}

.profile-card p {
  margin: 0;
  color: #475569;
  line-height: 1.7;
  font-size: 15px;
}
`;

const baseProblem = {
    id: "self-introduction-card",
    missionId: "mission-html-profile-card",
    title: "自己紹介カードを完成させよう",
    description:
        "お手本コードを参考にしながら、左のエディタにコードを入力しましょう。プレビューで表示を確認し、違いが分からないときは「違いを確認」を使えます。",
    thumbnailUrl: "/images/goals/sample.png",
    answerCode: ANSWER_CODE,
    previewCss: PREVIEW_CSS,
};

export const missionExamProblems: Record<MissionExamDifficulty, MissionExamProblem> = {
    easy: {
        ...baseProblem,
        difficulty: "easy",
        initialCode: `<div class="profile-card">
  <img class="profile-avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='60' fill='%23bfdbfe'/%3E%3Ccircle cx='60' cy='46' r='22' fill='%231d4ed8'/%3E%3Cpath d='M25 104c7-24 25-36 35-36s28 12 35 36' fill='%231d4ed8'/%3E%3C/svg%3E" alt="プロフィール画像" />
  <h1></h1>
  <p></p>
</div>`,
    },
    normal: {
        ...baseProblem,
        difficulty: "normal",
        initialCode: `<div class="profile-card">
  
</div>`,
    },
    hard: {
        ...baseProblem,
        difficulty: "hard",
        initialCode: ``,
    },
};