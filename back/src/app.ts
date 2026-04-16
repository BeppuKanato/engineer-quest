import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import problemRouter from './router/problemRouter';
import homeRouter from './router/homeRouter';
import usageRouter from './router/usageRouter';
import authRouter from './router/authRouter';
import shareRouter from './router/shareRouter';

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
app.use('/auth', authRouter);

//問題機能
app.use('/problem', problemRouter);

//ホーム画面
app.use('/home', homeRouter)

//学習時間
app.use('/usage', usageRouter);

//共有機能
app.use('/share', shareRouter);

app.listen(PORT, () => {
  console.log(`Backend started. Listening on port ${PORT}`);
});