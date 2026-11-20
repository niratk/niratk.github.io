---
title: "KaTeX による数式表示ガイド"
description: "Markdown 記事内で LaTeX 形式のインライン数式・ブロック数式・行列・日本語混在数式を記述するためのサンプルと表示確認ガイドです。"
pubDate: 2026-11-19
tags: ["Math", "KaTeX", "Markdown"]
draft: true
---

このブログでは `remark-math` と `rehype-katex` を組み込んでおり、Markdown 内に LaTeX 記法で数式を直接書けます。数式はビルド時に静的 HTML へ変換されるため、閲覧時に余分な JavaScript を読み込まず高速に表示されます。

## インライン数式

単一のドル記号 `$...$` で囲むと、文章中にインライン数式を埋め込めます。

- アインシュタインの質量とエネルギーの等価性: $E = mc^2$
- マージソートの時間計算量: $\mathcal{O}(n \log n)$
- 二次方程式 $ax^2 + bx + c = 0$ の解は $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ で与えられます。

## ブロック数式（ディスプレイモード）

二重のドル記号 `$$...$$` で囲むと、独立したブロックとして中央揃えで表示されます。

### オイラーの等式とガウス積分

$$
e^{i\pi} + 1 = 0
$$

$$
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$

### 複数行の数式揃え（aligned 環境）

$$
\begin{aligned}
\sum_{k=1}^{n} k &= 1 + 2 + \dots + n \\
&= \frac{n(n + 1)}{2}
\end{aligned}
$$

### 行列と線形変換

2 次元平面における角度 $\theta$ の回転行列は次のように表せます。

$$
R(\theta) =
\begin{pmatrix}
\cos\theta & -\sin\theta \\
\sin\theta & \cos\theta
\end{pmatrix}
$$

## 日本語を含む数式

`rehype-katex` に `strict: false` を設定しているため、`\text{...}` 内に日本語を含めてもビルド警告なしで表示できます。

$$
\text{精度 (Accuracy)} = \frac{\text{正解数}}{\text{全サンプル数}}
$$

## Markdown 記述例

```markdown
インライン数式は $f(x) = x^2$ のように書きます。

$$
\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}
$$
```

> 横幅の広い数式を記述した場合でも、モバイル画面では数式ブロック内のみ横スクロールできるよう調整しています。
