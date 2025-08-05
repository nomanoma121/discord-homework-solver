/**
 * Geminiから受け取ったLaTeXの本文を、完全なコンパイル可能なドキュメントに変換します。
 * また、AIが生成しがちなMarkdownのコードブロックや見出し記法を安全に除去・変換します。
 * @param latexCode - Gemini APIから返された生のLaTeX本文コンテンツ。
 * @returns コンパイル可能な完全なLaTeXドキュメント文字列。
 */
export function parseFullLatexCode(latexCode: string): string {
  let cleanedContent = latexCode.trim();

  // 1. 文字列の先頭と末尾がコードブロックで囲まれている場合のみ、その囲いを安全に削除
  if (cleanedContent.startsWith("```latex") && cleanedContent.endsWith("```")) {
    // '```latex' (7文字) と '```' (3文字) を削除
    cleanedContent = cleanedContent
      .substring(7, cleanedContent.length - 3)
      .trim();
  } else if (
    cleanedContent.startsWith("```") &&
    cleanedContent.endsWith("```")
  ) {
    // '```' (3文字) を両端から削除
    cleanedContent = cleanedContent
      .substring(3, cleanedContent.length - 3)
      .trim();
  }

  // 2. Markdownの見出し記法をLaTeXのセクションコマンドに変換
  //    行頭(^)にあるものだけを対象にする (gmフラグ: 複数行を対象)
  // ### 見出し -> \subsubsection*{見出し}
  cleanedContent = cleanedContent.replace(
    /^### (.*$)/gm,
    "\\subsubsection*{$1}"
  );
  // ## 見出し -> \subsection*{見出し}
  cleanedContent = cleanedContent.replace(/^## (.*$)/gm, "\\subsection*{$1}");
  // # 見出し -> \section*{見出し}
  cleanedContent = cleanedContent.replace(/^# (.*$)/gm, "\\section*{$1}");

  // 3. Markdownの太字をLaTeXのtextbfに変換
  cleanedContent = cleanedContent.replace(/\*\*(.*?)\*\*/g, "\\textbf{$1}");

  // 4. Markdownの水平線をLaTeXのhrulefillに変換
  cleanedContent = cleanedContent.replace(/^---$/gm, "\\hrulefill");

  // 5. 日本語対応のlualatex用テンプレートに埋め込む
  const fullLatexDocument = `
\\documentclass[a4paper, 12pt]{ltjsarticle}

% --- 基本パッケージ ---
\\usepackage{amsmath}      % 高度な数式環境
\\usepackage{amssymb}      % 特殊な数学記号
\\usepackage{geometry}     % 用紙サイズ・余白設定
\\usepackage{graphicx}     % 画像の挿入
\\usepackage{luatexja-fontspec} % フォント設定

% --- 分野共通で便利なパッケージ ---
\\usepackage{float}        % 図表の位置を[H]で固定
\\usepackage{tikz}         % 高機能な作図
\\usepackage{booktabs}     % 表の横線を美しくする
\\usepackage{subcaption}   % 複数の図を並べて(a), (b)のように参照
\\usepackage{enumitem}     % 箇条書きのインデントやラベルを柔軟に設定
\\usepackage{fancyhdr}     % ヘッダーとフッターを自由にカスタマイズ
\\usepackage{listings}     % ソースコードをきれいに表示

% --- 専門分野別のパッケージ（不要なものは行頭に'%'を付けて無効化）---

% 物理学向け
\\usepackage{siunitx}      % 物理単位(SI単位)をきれいに表示
\\usepackage{physics}      % 物理学特有の記法（ベクトル、微分、ブラケットなど）

% 化学向け
\\usepackage[version=4]{mhchem} % 化学式や反応式をきれいに表示
\\usepackage{chemfig}      % 化学構造式の描画

% --- パッケージ設定 ---
% 余白設定
\\geometry{left=20mm, right=20mm, top=25mm, bottom=25mm}

% フォント設定 (コンテナにインストールされている日本語フォントを指定)
\\setmainjfont{IPAexMincho}
\\setsansjfont{IPAexGothic}

% listings (ソースコード表示) の設定例
\\lstset{
  basicstyle=\\small\\ttfamily,
  commentstyle=\\color{gray},
  keywordstyle=\\color{blue},
  stringstyle=\\color{red},
  frame=tb,
  breaklines=true,
  columns=fullflexible,
  showstringspaces=false
}

% ヘッダー・フッターの設定
\\pagestyle{fancy}
\\fancyhf{} % ヘッダーとフッターを一旦クリア
\\fancyhead[L]{\\leftmark} % ヘッダー左に章タイトル
\\fancyfoot[C]{\\thepage} % フッター中央にページ番号
\\renewcommand{\\headrulewidth}{0.4pt} % ヘッダーの下に線を引く

% リンク設定 (パッケージの最後に読み込むのが推奨)
\\usepackage[luatex, pdfencoding=auto, hidelinks]{hyperref} % PDFに目次やURLのリンクを付与

\\begin{document}
\\fancypagestyle{plain}{ % 最初のページなどplainスタイルの場合もfancyhdrを適用
  \\fancyhf{}
  \\fancyfoot[C]{\\thepage}
}

${cleanedContent}
\\end{document}
`;

  return fullLatexDocument;
}
