
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.CharacterScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  imagePath: 'imagePath'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  rankId: 'rankId',
  name: 'name',
  level: 'level',
  experience: 'experience'
};

exports.Prisma.DifficultyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug'
};

exports.Prisma.MissionScalarFieldEnum = {
  id: 'id',
  difficultyId: 'difficultyId',
  clientId: 'clientId',
  title: 'title',
  detail: 'detail',
  component: 'component',
  experience: 'experience',
  type: 'type',
  slug: 'slug'
};

exports.Prisma.StepScalarFieldEnum = {
  id: 'id',
  missionId: 'missionId',
  order: 'order',
  title: 'title',
  detail: 'detail'
};

exports.Prisma.ExplainScalarFieldEnum = {
  id: 'id',
  stepId: 'stepId',
  supporterId: 'supporterId',
  order: 'order',
  content: 'content',
  highlight: 'highlight',
  componentType: 'componentType',
  code: 'code'
};

exports.Prisma.MissionExamScalarFieldEnum = {
  id: 'id',
  missionId: 'missionId',
  criteria: 'criteria',
  type: 'type',
  instructions: 'instructions',
  component: 'component',
  exampleCode: 'exampleCode',
  language: 'language'
};

exports.Prisma.StepExamScalarFieldEnum = {
  id: 'id',
  stepId: 'stepId',
  supporterId: 'supporterId',
  content: 'content',
  answer: 'answer',
  order: 'order',
  instructions: 'instructions',
  highlight: 'highlight',
  componentType: 'componentType'
};

exports.Prisma.MissionExamProgressScalarFieldEnum = {
  id: 'id',
  examId: 'examId',
  userId: 'userId',
  progressId: 'progressId',
  point: 'point',
  isPassed: 'isPassed',
  good: 'good',
  bad: 'bad',
  feedback: 'feedback',
  judgeType: 'judgeType',
  createdAt: 'createdAt'
};

exports.Prisma.MissionUnlockByRankScalarFieldEnum = {
  id: 'id',
  missionId: 'missionId',
  rankId: 'rankId'
};

exports.Prisma.MissionUnlockByLevelScalarFieldEnum = {
  id: 'id',
  missionId: 'missionId',
  level: 'level'
};

exports.Prisma.MissionUnlockByMissionScalarFieldEnum = {
  id: 'id',
  missionId: 'missionId',
  requiredId: 'requiredId'
};

exports.Prisma.MissionUnlockByAchievementScalarFieldEnum = {
  id: 'id',
  missionId: 'missionId',
  requiredId: 'requiredId'
};

exports.Prisma.RankScalarFieldEnum = {
  id: 'id',
  name: 'name',
  order: 'order',
  slug: 'slug',
  requiredId: 'requiredId'
};

exports.Prisma.MissionBeforeSentenceScalarFieldEnum = {
  id: 'id',
  missionId: 'missionId',
  speakerId: 'speakerId',
  sentence: 'sentence',
  order: 'order'
};

exports.Prisma.MissionAfterSentenceScalarFieldEnum = {
  id: 'id',
  missionId: 'missionId',
  speakerId: 'speakerId',
  sentence: 'sentence',
  order: 'order'
};

exports.Prisma.MissionProgressScalarFieldEnum = {
  id: 'id',
  missionId: 'missionId',
  userId: 'userId',
  status: 'status',
  currentStep: 'currentStep',
  completedAt: 'completedAt',
  createdAt: 'createdAt'
};

exports.Prisma.AchievementScalarFieldEnum = {
  id: 'id',
  name: 'name',
  detail: 'detail',
  slug: 'slug',
  type: 'type'
};

exports.Prisma.AchievementConditionScalarFieldEnum = {
  id: 'id',
  achievementId: 'achievementId',
  stringCondition: 'stringCondition',
  intCondition: 'intCondition',
  type: 'type'
};

exports.Prisma.UserAchievementScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  achievementId: 'achievementId',
  createdAt: 'createdAt'
};

exports.Prisma.LevelupRequirementScalarFieldEnum = {
  level: 'level',
  requiredExperience: 'requiredExperience'
};

exports.Prisma.UsageTimeScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  date: 'date',
  usageTime: 'usageTime'
};

exports.Prisma.ExperienceLogScalarFieldEnum = {
  id: 'id',
  missionProgressId: 'missionProgressId',
  userId: 'userId',
  experience: 'experience',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.MissionType = exports.$Enums.MissionType = {
  PROMOTION: 'PROMOTION',
  MAIN: 'MAIN',
  SUB: 'SUB'
};

exports.ExamType = exports.$Enums.ExamType = {
  REPRODUCTION: 'REPRODUCTION',
  FREE_CREATION: 'FREE_CREATION',
  HYBRID: 'HYBRID'
};

exports.MissionExamLanguages = exports.$Enums.MissionExamLanguages = {
  HTML: 'HTML',
  CSS: 'CSS',
  JavaScript: 'JavaScript'
};

exports.JudgeType = exports.$Enums.JudgeType = {
  WITH_FEEDBACK: 'WITH_FEEDBACK',
  WITHOUT_FEEDBACK: 'WITHOUT_FEEDBACK'
};

exports.MissionStatus = exports.$Enums.MissionStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELED: 'CANCELED'
};

exports.Prisma.ModelName = {
  Character: 'Character',
  User: 'User',
  Difficulty: 'Difficulty',
  Mission: 'Mission',
  Step: 'Step',
  Explain: 'Explain',
  MissionExam: 'MissionExam',
  StepExam: 'StepExam',
  MissionExamProgress: 'MissionExamProgress',
  MissionUnlockByRank: 'MissionUnlockByRank',
  MissionUnlockByLevel: 'MissionUnlockByLevel',
  MissionUnlockByMission: 'MissionUnlockByMission',
  MissionUnlockByAchievement: 'MissionUnlockByAchievement',
  Rank: 'Rank',
  MissionBeforeSentence: 'MissionBeforeSentence',
  MissionAfterSentence: 'MissionAfterSentence',
  MissionProgress: 'MissionProgress',
  Achievement: 'Achievement',
  AchievementCondition: 'AchievementCondition',
  UserAchievement: 'UserAchievement',
  LevelupRequirement: 'LevelupRequirement',
  UsageTime: 'UsageTime',
  ExperienceLog: 'ExperienceLog'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
