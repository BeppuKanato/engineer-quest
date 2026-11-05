import feedbackV1Router from "./router/feedbackV1.router";
import learningRouter from "./router/learning.router";
import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import problemRouter from './router/problemRouter';
// import homeRouter from './router/homeRouter';
// import usageRouter from './router/usageRouter';
import authRouter from './router/auth.router';
import courseRouter from './router/course.router';
import achievementRouter from './router/achievement.router';
import collectionRouter from './router/collection.router';
import createQuestRouter from './router/createQuest.router';
import historyRouter from './router/history.router';
import homeRouter from './router/home.router';
import profileRouter from './router/profile.router';
import questBoardRouter from './router/questBoard.router';
import hexadRouter from './router/hexad.router';
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
app.use('/api/achievements', achievementRouter);
app.use('/api/collection', collectionRouter);
app.use('/api/history', historyRouter);
app.use('/api/quest-board', questBoardRouter);
app.use('/api/hexad', hexadRouter);
app.use('/api', createQuestRouter);

app.use('/api/feedback-v1', feedbackV1Router);
app.use('/api/learning', learningRouter);
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
