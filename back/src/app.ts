import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import problemRouter from './router/problemRouter';
// import homeRouter from './router/homeRouter';
// import usageRouter from './router/usageRouter';
import authRouter from './router/auth.router';
import courseRouter from './router/course.router';
import missionRouter from './router/mission.router';
import achievementRouter from './router/achievement.router';
import badgeRouter from './router/badge.router';
import collectionRouter from './router/collection.router';
import createThemeRouter from './router/createTheme.router';
import createMissionRouter from './router/createMission.router';
import historyRouter from './router/history.router';
import homeRouter from './router/home.router';
import profileRouter from './router/profile.router';
import questBoardRouter from './router/questBoard.router';
import missionRewardRouter from './router/missionReward.router';
import { errorHandler } from './middleware/errorHandler';
// import shareRouter from './router/shareRouter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.get("/health", (req: Request, res: Response) => {
  res.status(200).send("OK");
});

//ユーザ認証
app.use('/api/auth', authRouter);
app.use('/api/home', homeRouter);
app.use('/api/profile', profileRouter);
app.use('/api/courses', courseRouter);
app.use('/api/missions', missionRouter);
app.use('/api/achievements', achievementRouter);
app.use('/api/badges', badgeRouter);
app.use('/api/collection', collectionRouter);
app.use('/api/history', historyRouter);
app.use('/api/quest-board', questBoardRouter);
app.use('/api/mission-rewards', missionRewardRouter);
app.use('/api', createThemeRouter);
app.use('/api', createMissionRouter);

app.use(errorHandler)

// //問題機能
// app.use('/problem', problemRouter);

// //ホーム画面
// app.use('/home', homeRouter)

// //学習時間
// app.use('/usage', usageRouter);

// //共有機能
// app.use('/share', shareRouter);

app.listen(PORT, () => {
  console.log(`Backend started. Listening on port ${PORT}`);
});
