# Planning Poker

リアルタイムで見積りを行うためのプランニングポーカーアプリケーション。複数の参加者がカードを選択し、投票内容をリアルタイムで確認できます。

## 機能

- ルームの作成と参加
- リアルタイム投票（EventSource経由）
- 投票結果の即座確認
- ホストによる新規ラウンド開始機能
- Google Cloud Firestore を使用したデータ保存

## 環境構築

### 前提条件

- Node.js
- Terraform
- Google Cloud プロジェクト
- gcloud CLI

### セットアップ手順

1. リポジトリをクローンする

```bash
git clone https://github.com/noy72/planning-porker.git
cd planning-porker
```

2. Google Cloud 認証を設定

```bash
gcloud auth application-default login
```

3. 環境変数を設定する

```bash
cp .env.local.example .env.local
```

`.env.local` ファイルを編集し、Google Cloud プロジェクトIDを入力します：

```
GOOGLE_CLOUD_PROJECT=your-project-id
```

4. Terraform で Google Cloud リソースをアプライ

```bash
cd terraform
terraform init
terraform plan
terraform apply
cd ..
```

Terraform アプライでは以下のリソースが作成されます：

- Google Cloud Firestore データベース
- Cloud Run（デプロイメント先）
- Artifact Registry（Docker イメージレジストリ）
- 必要な Google Cloud API の有効化

5. 依存パッケージをインストール

```bash
pnpm install
```

## 利用開始

### 開発環境での実行

```bash
pnpm dev
```

ブラウザで `http://localhost:3000` を開きます。

### ビルドと本番実行

```bash
pnpm build
pnpm start
```

## 使い方

1. ホームページで「新しい部屋を作成する」をクリック
2. ルームが作成されると自動的に詳細ページに遷移
3. ルームURLを他の参加者と共有
4. 参加者がカードを選択して投票
5. 全員が投票したらホストが「結果を表示」をクリック
6. 投票結果と統計情報を確認
7. ホストが「次のラウンドを開始」をクリックして新規ラウンド開始

## ライセンス

MIT
