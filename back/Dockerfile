FROM node:20

WORKDIR /app

# まず依存関係をインストール
COPY package*.json ./
RUN npm install

# src / prisma などソースをすべてコピー
COPY . .

# Prisma Client を生成（ts ファイルも使える状態）
RUN npx prisma generate

# TypeScript をビルド
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]
