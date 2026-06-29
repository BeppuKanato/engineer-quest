// prisma/seed.ts

import {
  AchievementCategory,
  AchievementConditionType,
  KnowledgeCardRarity,
  Prisma,
  PrismaClient,
  TechIconBadgeRarity,
} from "@prisma/client";
import { learningSeed } from "./seedData/learningSeed";

const prisma = new PrismaClient();

async function deleteExistingData() {
  // Logs / Progress
  await prisma.activityAnswerLog.deleteMany();
  await prisma.badgeTicketTransaction.deleteMany();
  await prisma.userWorkReview.deleteMany();
  await prisma.userWork.deleteMany();
  await prisma.userTechIconBadge.deleteMany();
  await prisma.userKnowledgeCard.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.userMissionActivityProgress.deleteMany();
  await prisma.userMissionProgress.deleteMany();

  // Master data
  await prisma.techIconBadge.deleteMany();
  await prisma.createMission.deleteMany();
  await prisma.knowledgeCard.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.missionActivity.deleteMany();
  await prisma.missionSection.deleteMany();
  await prisma.mission.deleteMany();

  await prisma.courseCategoryMap.deleteMany();
  await prisma.courseCategory.deleteMany();
  await prisma.course.deleteMany();
}

async function seedCourse(course: (typeof learningSeed.courses)[number]) {
  for (const categoryName of course.categories) {
    await prisma.courseCategory.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });
  }

  const createdCourse = await prisma.course.create({
    data: {
      id: course.id,
      title: course.title,
      description: course.description,
      difficulty: course.difficulty,
      isInitiallyUnlocked: course.isInitiallyUnlocked,
      isPublished: course.isPublished,
      version: course.version,
    },
  });

  for (const categoryName of course.categories) {
    const category = await prisma.courseCategory.findUnique({
      where: { name: categoryName },
    });

    if (!category) {
      throw new Error(`Category not found: ${categoryName}`);
    }

    await prisma.courseCategoryMap.create({
      data: {
        courseId: createdCourse.id,
        categoryId: category.id,
      },
    });
  }

  for (const mission of course.missions) {
    const createdMission = await prisma.mission.create({
      data: {
        id: mission.id,
        courseId: createdCourse.id,
        title: mission.title,
        description: mission.description,
        difficulty: mission.difficulty,
        goalImg: mission.goalImg,
        estimatedMinutes: mission.estimatedMinutes,
        order: mission.order,
        type: mission.type,
        isRequiredForCourseCompletion: mission.isRequiredForCourseCompletion,
        parentMissionId: mission.parentMissionId,
        roadmapLane: mission.roadmapLane,
        branchOrder: mission.branchOrder,
        rewardExp: mission.rewardExp,
        learnedItems: mission.learnedItems,
        isPublished: mission.isPublished,
      },
    });

    for (const section of mission.sections) {
      const createdSection = await prisma.missionSection.create({
        data: {
          id: section.id,
          missionId: createdMission.id,
          title: section.title,
          description: section.description ?? null,
          order: section.order,
        },
      });

      for (const activity of section.activities) {
        await prisma.missionActivity.create({
          data: {
            id: activity.id,
            missionId: createdMission.id,
            sectionId: createdSection.id,
            type: activity.type,
            title: activity.title,
            instruction: activity.instruction,
            mentorMessage: activity.mentorMessage,
            content: activity.content as Prisma.InputJsonValue,
            preview:
              activity.preview === null
                ? Prisma.JsonNull
                : (activity.preview as Prisma.InputJsonValue),
            actionLabel: activity.actionLabel,
            order: activity.order,
            sectionOrder: activity.sectionOrder,
            isMissionCheck: activity.isMissionCheck,
          },
        });
      }
    }
  }
}

async function seedLearningData() {
  for (const course of learningSeed.courses) {
    await seedCourse(course);
  }
}

async function seedAchievements() {
  const achievements = [
    {
      id: "achievement-first-mission",
      title: "はじめてのMission",
      description: "最初のMissionを完了しました。",
      category: AchievementCategory.MISSION_COUNT,
      conditionType: AchievementConditionType.MISSION_COUNT,
      conditionValue: 1,
      sortOrder: 10,
    },
    {
      id: "achievement-three-missions",
      title: "学びを積み上げる者",
      description: "Missionを3個完了しました。",
      category: AchievementCategory.MISSION_COUNT,
      conditionType: AchievementConditionType.MISSION_COUNT,
      conditionValue: 3,
      sortOrder: 20,
    },
    {
      id: "achievement-five-missions",
      title: "着実なエンジニア見習い",
      description: "Missionを5個完了しました。",
      category: AchievementCategory.MISSION_COUNT,
      conditionType: AchievementConditionType.MISSION_COUNT,
      conditionValue: 5,
      sortOrder: 30,
    },
    {
      id: "achievement-web-flow-clear",
      title: "Webの入口を理解した",
      description: "「Webページが表示される流れを知る」を完了しました。",
      category: AchievementCategory.MISSION_CLEAR,
      conditionType: AchievementConditionType.SPECIFIC_MISSION_CLEAR,
      missionId: "web-flow",
      sortOrder: 10,
    },
    {
      id: "achievement-frontend-backend-clear",
      title: "画面と裏側を分けて考える",
      description: "「フロントエンドとバックエンドを知る」を完了しました。",
      category: AchievementCategory.MISSION_CLEAR,
      conditionType: AchievementConditionType.SPECIFIC_MISSION_CLEAR,
      missionId: "frontend-backend",
      sortOrder: 20,
    },
    {
      id: "achievement-web-overview-required-complete",
      title: "Webアプリ全体像の基礎修了",
      description: "Webアプリの全体像コースの必須Missionをすべて完了しました。",
      category: AchievementCategory.COURSE_COMPLETE,
      conditionType: AchievementConditionType.COURSE_COMPLETE,
      courseId: "course-web-overview",
      sortOrder: 10,
    },
    {
      id: "achievement-web-overview-all-complete",
      title: "Webアプリ全体像コンプリート",
      description: "Challengeを含めてWebアプリの全体像コースをすべて完了しました。",
      category: AchievementCategory.MISSION_COMPLETE,
      conditionType: AchievementConditionType.COURSE_ALL_MISSION_COMPLETE,
      courseId: "course-web-overview",
      isSecret: true,
      sortOrder: 10,
    },
    {
      id: "achievement-ten-activities",
      title: "手を動かす学習者",
      description: "Activityを10個完了しました。",
      category: AchievementCategory.LEARNING_ACTION,
      conditionType: AchievementConditionType.ACTIVITY_COUNT,
      conditionValue: 10,
      sortOrder: 10,
    },
    {
      id: "achievement-thirty-activities",
      title: "演習を重ねる者",
      description: "Activityを30個完了しました。",
      category: AchievementCategory.LEARNING_ACTION,
      conditionType: AchievementConditionType.ACTIVITY_COUNT,
      conditionValue: 30,
      sortOrder: 20,
    },
    {
      id: "achievement-hard-course-exam",
      title: "高難度試験突破",
      description: "Course終了試験のHardをクリアしました。",
      category: AchievementCategory.COURSE_EXAM,
      conditionType: AchievementConditionType.COURSE_EXAM_HARD_CLEAR,
      isSecret: true,
      sortOrder: 10,
    },
    {
      id: "achievement-seven-day-streak",
      title: "7日間の継続",
      description: "7日連続で学習しました。",
      category: AchievementCategory.STREAK,
      conditionType: AchievementConditionType.STREAK_DAYS,
      conditionValue: 7,
      sortOrder: 10,
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { id: achievement.id },
      update: achievement,
      create: achievement,
    });
  }
}

async function seedKnowledgeCards() {
  const cards = [
    {
      id: "knowledge-web-browser",
      courseId: "course-web-overview",
      label: "Browser",
      title: "ブラウザ",
      description:
        "ブラウザは、ユーザーの操作を受け取り、サーバから返ってきたHTMLやCSSを画面として表示するアプリです。",
      rarity: KnowledgeCardRarity.COMMON,
      sortOrder: 10,
    },
    {
      id: "knowledge-web-server",
      courseId: "course-web-overview",
      label: "Server",
      title: "サーバ",
      description:
        "サーバは、ブラウザからのリクエストを受け取り、画面やデータを返す役割を持ちます。",
      rarity: KnowledgeCardRarity.COMMON,
      sortOrder: 20,
    },
    {
      id: "knowledge-html",
      courseId: "course-web-overview",
      label: "HTML",
      title: "HTML",
      description:
        "HTMLは、見出しや文章、ボタンなど、Webページの構造と内容を表すための言語です。",
      rarity: KnowledgeCardRarity.COMMON,
      sortOrder: 30,
    },
    {
      id: "knowledge-css",
      courseId: "course-web-overview",
      label: "CSS",
      title: "CSS",
      description:
        "CSSは、色、余白、配置など、Webページの見た目を整えるための言語です。",
      rarity: KnowledgeCardRarity.COMMON,
      sortOrder: 40,
    },
    {
      id: "knowledge-flask",
      courseId: "course-web-overview",
      label: "Flask",
      title: "Flask",
      description:
        "Flaskは、PythonでWebアプリを作るための軽量なフレームワークです。画面表示やフォーム入力の処理を作るときに使います。",
      rarity: KnowledgeCardRarity.RARE,
      sortOrder: 50,
    },
    {
      id: "knowledge-request-response",
      courseId: "course-web-overview",
      label: "Request / Response",
      title: "リクエストとレスポンス",
      description:
        "リクエストはブラウザからサーバへのお願い、レスポンスはサーバからブラウザへの返事です。",
      rarity: KnowledgeCardRarity.RARE,
      sortOrder: 60,
    },
    {
      id: "knowledge-database",
      courseId: "course-web-overview",
      label: "Database",
      title: "データベース",
      description:
        "データベースは、ユーザー情報や投稿内容など、あとから使いたいデータを保存する場所です。",
      rarity: KnowledgeCardRarity.RARE,
      sortOrder: 70,
    },
    {
      id: "knowledge-api",
      courseId: "course-web-overview",
      label: "API",
      title: "API",
      description:
        "APIは、別の機能やサービスとデータをやり取りするための窓口です。天気取得やAI連携などに使われます。",
      rarity: KnowledgeCardRarity.EPIC,
      sortOrder: 80,
    },
    {
      id: "knowledge-app-planning-target-user",
      courseId: "app-planning",
      label: "Target User",
      title: "対象ユーザー",
      description:
        "対象ユーザーを決めると、必要な画面や機能を選びやすくなります。誰の困りごとを解決するかが設計の軸になります。",
      rarity: KnowledgeCardRarity.COMMON,
      sortOrder: 10,
    },
    {
      id: "knowledge-app-planning-minimum-feature",
      courseId: "app-planning",
      label: "Minimum Feature",
      title: "最小機能",
      description:
        "最小機能は、アプリの目的を満たすために最初に必要な機能です。作りすぎを避け、完成まで進めやすくします。",
      rarity: KnowledgeCardRarity.COMMON,
      sortOrder: 20,
    },
    {
      id: "knowledge-app-planning-task-breakdown",
      courseId: "app-planning",
      label: "Task Breakdown",
      title: "タスク分解",
      description:
        "タスク分解は、大きな制作目標を小さな作業に分ける考え方です。次に何を作るかを明確にできます。",
      rarity: KnowledgeCardRarity.RARE,
      sortOrder: 30,
    },
  ];

  for (const card of cards) {
    await prisma.knowledgeCard.upsert({
      where: { id: card.id },
      update: card,
      create: card,
    });
  }
}

async function seedTechIconBadges() {
  const iconBaseUrl = "https://cdn.simpleicons.org";
  const badges = [
    {
      id: "badge-html5",
      name: "HTML5",
      description: "Webページの構造を作るための標準マークアップ技術です。",
      iconUrl: `${iconBaseUrl}/html5/E34F26`,
      rarity: TechIconBadgeRarity.COMMON,
      sortOrder: 10,
    },
    {
      id: "badge-css",
      name: "CSS",
      description: "Webページの見た目やレイアウトを整えるための技術です。",
      iconUrl: `${iconBaseUrl}/css/663399`,
      rarity: TechIconBadgeRarity.COMMON,
      sortOrder: 20,
    },
    {
      id: "badge-javascript",
      name: "JavaScript",
      description: "ブラウザ上の動きやWebアプリのロジックを作るための言語です。",
      iconUrl: `${iconBaseUrl}/javascript/F7DF1E`,
      rarity: TechIconBadgeRarity.COMMON,
      sortOrder: 30,
    },
    {
      id: "badge-typescript",
      name: "TypeScript",
      description: "JavaScriptに型の仕組みを加え、実装を堅くしやすくする言語です。",
      iconUrl: `${iconBaseUrl}/typescript/3178C6`,
      rarity: TechIconBadgeRarity.RARE,
      sortOrder: 40,
    },
    {
      id: "badge-react",
      name: "React",
      description: "UIをコンポーネントとして組み立てるためのJavaScriptライブラリです。",
      iconUrl: `${iconBaseUrl}/react/61DAFB`,
      rarity: TechIconBadgeRarity.RARE,
      sortOrder: 50,
    },
    {
      id: "badge-nextjs",
      name: "Next.js",
      description: "Reactをベースに、ルーティングやサーバー機能を扱いやすくするフレームワークです。",
      iconUrl: `${iconBaseUrl}/nextdotjs/000000`,
      rarity: TechIconBadgeRarity.RARE,
      sortOrder: 60,
    },
    {
      id: "badge-python",
      name: "Python",
      description: "Web開発、データ処理、AIなど幅広く使われる読み書きしやすい言語です。",
      iconUrl: `${iconBaseUrl}/python/3776AB`,
      rarity: TechIconBadgeRarity.RARE,
      sortOrder: 70,
    },
    {
      id: "badge-flask",
      name: "Flask",
      description: "Pythonで軽量なWebアプリを作るためのフレームワークです。",
      iconUrl: `${iconBaseUrl}/flask/000000`,
      rarity: TechIconBadgeRarity.RARE,
      sortOrder: 80,
    },
    {
      id: "badge-git",
      name: "Git",
      description: "コードの変更履歴を管理し、開発のやり直しや共有を支えるツールです。",
      iconUrl: `${iconBaseUrl}/git/F05032`,
      rarity: TechIconBadgeRarity.COMMON,
      sortOrder: 90,
    },
    {
      id: "badge-github",
      name: "GitHub",
      description: "Gitリポジトリを共有し、IssueやPull Requestで開発を進めるサービスです。",
      iconUrl: `${iconBaseUrl}/github/181717`,
      rarity: TechIconBadgeRarity.RARE,
      sortOrder: 100,
    },
    {
      id: "badge-postgresql",
      name: "PostgreSQL",
      description: "信頼性の高いオープンソースのリレーショナルデータベースです。",
      iconUrl: `${iconBaseUrl}/postgresql/4169E1`,
      rarity: TechIconBadgeRarity.EPIC,
      sortOrder: 110,
    },
    {
      id: "badge-firebase",
      name: "Firebase",
      description: "認証、ホスティング、データ保存などをまとめて扱えるアプリ開発基盤です。",
      iconUrl: `${iconBaseUrl}/firebase/FFCA28`,
      rarity: TechIconBadgeRarity.EPIC,
      sortOrder: 120,
    },
    {
      id: "badge-docker",
      name: "Docker",
      description: "アプリの実行環境をコンテナとして再現しやすくするためのプラットフォームです。",
      iconUrl: `${iconBaseUrl}/docker/2496ED`,
      rarity: TechIconBadgeRarity.EPIC,
      sortOrder: 130,
    },
    {
      id: "badge-vercel",
      name: "Vercel",
      description: "フロントエンドアプリを素早く公開し、継続的にデプロイできるプラットフォームです。",
      iconUrl: `${iconBaseUrl}/vercel/000000`,
      rarity: TechIconBadgeRarity.LEGENDARY,
      sortOrder: 140,
    },
  ];

  for (const badge of badges) {
    await prisma.techIconBadge.upsert({
      where: { id: badge.id },
      update: badge,
      create: badge,
    });
  }
}

async function seedCreateMissions() {
  const createMissions = [
    {
      id: "create-web-profile-card",
      courseId: "course-web-overview",
      title: "自己紹介カードを記録しよう",
      theme: "HTML/CSSで自己紹介カードを作る",
      description:
        "Courseで学んだWebページの構造と見た目の考え方を使って、ローカル環境で作った自己紹介カードをEngineer Questに記録します。",
      minimumRequirements: [
        "作品名を入力する",
        "自己紹介カードの説明を書く",
        "こだわりポイントを書く",
        "HTMLまたはCSSのコード抜粋を登録する",
        "使用した技術を1つ以上登録する",
      ],
      advancedRequirements: [
        "カードらしい余白や影をつける",
        "色やフォントに意図を持たせる",
        "画像やアイコンを使う",
        "スマートフォン幅で見やすくする",
      ],
      suggestedTechnologies: ["HTML", "CSS", "JavaScript"],
      starterCode:
        '<div class="profile-card">\n  <h1>名前</h1>\n  <p>好きなことや学んだことを書きます。</p>\n</div>\n\n<style>\n.profile-card {\n  padding: 24px;\n  border-radius: 12px;\n}\n</style>',
      sortOrder: 10,
    },
    {
      id: "create-app-planning-card",
      courseId: "app-planning",
      title: "アプリ企画カードを記録しよう",
      theme: "作りたいアプリの企画を1枚のカードにまとめる",
      description:
        "ターゲットユーザー、解決したい課題、最小機能を整理し、企画カードとしてEngineer Questに記録します。",
      minimumRequirements: [
        "作品名を入力する",
        "どんなユーザー向けの企画か説明する",
        "こだわりポイントを書く",
        "企画メモやHTML/CSSなどのコード抜粋を登録する",
        "使用した技術や考え方を1つ以上登録する",
      ],
      advancedRequirements: [
        "画面構成を文章で説明する",
        "最小機能と追加機能を分ける",
        "ユーザーの困りごとを具体的に書く",
        "簡単なモックアップコードを添える",
      ],
      suggestedTechnologies: ["企画", "HTML", "CSS"],
      starterCode:
        "作品メモ:\n- 対象ユーザー:\n- 解決したい課題:\n- 最小機能:\n- こだわり:",
      sortOrder: 20,
    },
  ];

  for (const createMission of createMissions) {
    await prisma.createMission.upsert({
      where: { id: createMission.id },
      update: createMission,
      create: createMission,
    });
  }
}

async function main() {
  console.log("Start seeding...");

  await deleteExistingData();
  await seedLearningData();
  await seedAchievements();
  await seedKnowledgeCards();
  await seedTechIconBadges();
  await seedCreateMissions();

  console.log("Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seeding failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
