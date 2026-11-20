---
title: "Astro でポートフォリオとブログを構築しました"
description: "Astro 7 と Tailwind CSS v4、KaTeX を使って GitHub Pages 向けのミニマルなポートフォリオ＆技術ブログを作成した構成メモと記事の書き方ガイドです。"
pubDate: 2026-11-20
tags: ["Astro", "Blog", "Web"]
draft: true
---

GitHub Pages で公開するためのポートフォリオ兼技術ブログを **Astro** で構築しました。

このページでは、新しいブログ記事を Markdown で追加する方法と、主な機能を紹介します。

## 記事の追加方法

`src/content/blog/` 配下に `.md` ファイルを配置するだけで、自動的に記事ページ・一覧ページ・タグページ・RSS フィードに反映されます。

### Frontmatter の項目

記事の先頭に以下のような YAML Frontmatter を記述します。

```markdown
---
title: "記事タイトル"
description: "記事一覧や OGP に表示される概要文"
pubDate: 2026-11-20
updatedDate: 2026-11-21
tags: ["Astro", "Math"]
draft: false
---
```

| フィールド | 必須 | 説明 |
| --- | --- | --- |
| `title` | 必須 | 記事タイトル |
| `description` | 必須 | 概要文（一覧・SEO / OGP に使用） |
| `pubDate` | 必須 | 公開日（`YYYY-MM-DD`） |
| `updatedDate` | 任意 | 更新日 |
| `tags` | 任意 | タグ配列（省略時は空配列） |
| `draft` | 任意 | `true` にすると本番ビルドから除外（開発時のみ表示） |

## シンタックスハイライト

コードブロックは Shiki によってビルド時にハイライトされ、ライトモード・ダークモードの両方に自動で追従します。

```ts
export function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

## 目次（TOC）の自動生成

本文中の `##`（見出し 2）と `###`（見出し 3）から目次が自動で生成されます。デスクトップ画面では右側に追従し、モバイル画面では記事上部の折りたたみメニューから移動できます。

数式の記述方法については、[KaTeX による数式表示ガイド](/blog/math-rendering-guide) を参照してください。
