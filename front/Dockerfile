# Next.js 用 Dockerfile（開発と本番どちらでも使えるシンプル版）

FROM node:20

WORKDIR /app

# 依存関係インストール
COPY package*.json ./
RUN npm install

# アプリ本体
COPY . .

# Cloud Run では PORT 環境変数でポートを指定する想定
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# 本番はビルドしてから起動する
# package.json の scripts:
#  "build": "next build",
#  "start": "next start -p ${PORT:-8080}"
#  みたいになっている前提
RUN npm run build

CMD ["npm", "start"]
