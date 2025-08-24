/**
 * Geminiから受け取ったLaTeXの本文を、完全なコンパイル可能なドキュメントに変換します。
 * また、AIが生成しがちなMarkdownのコードブロックや見出し記法を安全に除去・変換します。
 * @param latexCode - Gemini APIから返された生のLaTeX本文コンテンツ。
 * @returns コンパイル可能な完全なLaTeXドキュメント文字列。
 */
/**
 * LaTeXコードからタイトルを抽出します。
 * セクション、サブセクション、問題文などからタイトルを検索します。
 * @param latexCode - LaTeXコード
 * @returns 抽出されたタイトル、または見つからない場合は'solution'
 */
export function extractLatexTitle(latexCode: string): string {
  // \title{...}
  let match = latexCode.match(/\\title\{([^}]+)\}/);
  if (match) return sanitizeFilename(match[1]);

  // \section*{...} or \section{...}
  match = latexCode.match(/\\section\*?\{([^}]+)\}/);
  if (match) return sanitizeFilename(match[1]);

  // \subsection*{...} or \subsection{...}
  match = latexCode.match(/\\subsection\*?\{([^}]+)\}/);
  if (match) return sanitizeFilename(match[1]);

  // # 見出し (Markdown形式)
  match = latexCode.match(/^# (.+)$/m);
  if (match) return sanitizeFilename(match[1]);

  // ## 見出し (Markdown形式)
  match = latexCode.match(/^## (.+)$/m);
  if (match) return sanitizeFilename(match[1]);

  // 問題、Question、Problemなどの単語を含む行
  match = latexCode.match(/(?:問題|Question|Problem)[:：]?\s*(.+?)(?:\n|$)/i);
  if (match) return sanitizeFilename(match[1].trim());

  return 'solution';
}

/**
 * ファイル名として使用できるように文字列をサニタイズします。
 * @param str - サニタイズする文字列
 * @returns サニタイズされた文字列
 */
function sanitizeFilename(str: string): string {
  return str
    .replace(/[<>:"/\\|?*]/g, '') // 不正な文字を削除
    .replace(/\s+/g, '_') // スペースをアンダースコアに
    .substring(0, 50) // 長すぎる場合は切り詰める
    .replace(/^_+|_+$/g, ''); // 先頭・末尾のアンダースコアを削除
}

/**
 * 現在の日時を YYYYMMDD_HHMMSS 形式の文字列で返します。
 * @returns 日時文字列
 */
/**
 * 科目に応じた専用プロンプトを生成します。
 * @param subject - 科目名
 * @returns 科目に特化したプロンプト文字列
 */
export function getSubjectPrompt(subject: string = "general"): string {
  const basePrompt = "この問題を解き、その解答と詳しい解説を**LaTeX形式の本文として**日本語で提供してください。\n注意: \\documentclassや\\begin{document}などの文書構造は**含めないでください**。純粋な解答のテキストと数式（例: これは解答です。$$ y = x^2 $$）のみを生成してください。コメントのような必要でないものは記述しないでください。";

  const subjectSpecificPrompts: { [key: string]: string } = {
    mathematics: `${basePrompt}

**数学解答の指針:**
- 解答過程を段階的に示してください
- 重要な定理や公式を使用する際は名前を明記してください
- 計算過程は省略せず、中間結果も示してください  
- グラフや図が必要な場合はTikZコードで作成してください
- 証明問題の場合は論理的な構成を明確にしてください`,

    physics: `${basePrompt}

**物理学解答の指針:**
- 使用する物理法則や原理を明確に述べてください
- 単位系を統一し、SI単位を使用してください
- ベクトル量とスカラー量を区別して表記してください
- 近似を用いる場合はその妥当性を説明してください
- 図やグラフが必要な場合はTikZで作成し、座標軸やラベルを明記してください`,

    chemistry: `${basePrompt}

**化学解答の指針:**
- 化学反応式は正確にバランスを取ってください
- 化学式はmhchemパッケージの記法を使用してください
- 分子構造が必要な場合はchemfigパッケージを使用してください
- 濃度、pH、平衡定数などの計算過程を詳しく示してください
- 実験条件や仮定を明確にしてください`,

    biology: `${basePrompt}

**生物学解答の指針:**
- 生物学的現象のメカニズムを段階的に説明してください
- 関連する器官、組織、細胞の構造と機能を説明してください
- 図や模式図が必要な場合はTikZで作成してください
- 専門用語を使用する際は適切な説明を加えてください
- 進化的、生態学的観点からの考察も含めてください`,

    engineering: `${basePrompt}

**工学解答の指針:**
- 設計条件や制約条件を明確に整理してください
- 使用する工学原理や設計手法を説明してください
- 計算過程では有効数字を考慮してください
- 安全率や許容値について言及してください
- 図面や回路図が必要な場合はTikZで作成してください`,

    statistics: `${basePrompt}

**統計学解答の指針:**
- 使用する統計手法とその適用条件を説明してください
- 仮説設定を明確にし、有意水準を設定してください
- 計算過程では確率分布や検定統計量を明示してください
- 結果の統計的解釈と実践的意味を説明してください
- 必要に応じてグラフや表をTikZで作成してください`,

    general: basePrompt
  };

  return subjectSpecificPrompts[subject] || subjectSpecificPrompts.general;
}

export function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * 科目に応じたLaTeXテンプレートを生成します。
 * @param subject - 科目名
 * @param content - LaTeXコンテンツ
 * @returns 科目に最適化されたLaTeXドキュメント
 */
export function generateSubjectSpecificLatex(subject: string, content: string): string {
  const subjectPackages: { [key: string]: string } = {
    mathematics: `
% --- 数学特化パッケージ ---
\\usepackage{amsmath, amssymb, amsthm}  % 数学記号・環境
\\usepackage{mathrsfs}         % 筆記体数学文字
\\usepackage{mathtools}        % 数学ツール拡張
\\usepackage{bm}               % 太字ベクトル
\\usepackage{cases}            % case環境拡張
\\usepackage{tikz-cd}          % 可換図式`,

    physics: `
% --- 物理学特化パッケージ ---
\\usepackage{amsmath, amssymb}
\\usepackage{siunitx}          % SI単位系
\\usepackage{physics}          % 物理記法（偏微分、ベクトルなど）
\\usepackage{bm}               % 太字ベクトル
\\usepackage{braket}           % ブラケット記法
\\usepackage{tensor}           % テンソル記法`,

    chemistry: `
% --- 化学特化パッケージ ---
\\usepackage{amsmath, amssymb}
\\usepackage[version=4]{mhchem}  % 化学式・反応式
\\usepackage{chemfig}          % 化学構造式
\\usepackage{chemformula}      % 化学式の追加機能
\\usepackage{bohr}             % 原子構造図
\\usepackage{modiagram}        % 分子軌道図`,

    biology: `
% --- 生物学特化パッケージ ---
\\usepackage{amsmath, amssymb}
\\usepackage{tikz}
\\usetikzlibrary{shapes.geometric, arrows.meta, positioning}
\\usepackage{pgfplots}         % グラフ・チャート
\\usepackage{xcolor}           % カラー設定`,

    engineering: `
% --- 工学特化パッケージ ---
\\usepackage{amsmath, amssymb}
\\usepackage{siunitx}          % SI単位系
\\usepackage{tikz}
\\usetikzlibrary{circuits.ee.IEC, positioning, arrows.meta}
\\usepackage{pgfplots}         % グラフ・図表
\\usepackage{circuitikz}       % 電子回路図
\\usepackage{steinmetz}        % 複素数表示`,

    statistics: `
% --- 統計学特化パッケージ ---
\\usepackage{amsmath, amssymb, amsthm}
\\usepackage{mathtools}        % 数学ツール
\\usepackage{bm}               % 太字文字
\\usepackage{tikz}
\\usepackage{pgfplots}         % 統計グラフ
\\usepackage{pgfplotstable}    % データテーブル
\\usepackage{array}            % 表拡張`,

    general: `
% --- 基本パッケージ ---
\\usepackage{amsmath, amssymb}
\\usepackage{tikz}
\\usepackage{pgfplots}`
  };

  const packages = subjectPackages[subject] || subjectPackages.general;
  
  const template = `
\\documentclass[a4paper, 12pt]{ltjsarticle}

${packages}

% --- 共通パッケージ ---
\\usepackage{geometry}         % 用紙サイズ・余白設定
\\usepackage{graphicx}         % 画像の挿入
\\usepackage{luatexja-fontspec} % フォント設定
\\usepackage{float}            % 図表の位置を[H]で固定
\\usepackage{booktabs}         % 表の横線を美しくする
\\usepackage{subcaption}       % 複数の図を並べて(a), (b)のように参照
\\usepackage{enumitem}         % 箇条書きのインデントやラベルを柔軟に設定
\\usepackage{fancyhdr}         % ヘッダーとフッターを自由にカスタマイズ
\\usepackage{xcolor}           % カラー設定

% --- パッケージ設定 ---
% 余白設定
\\geometry{left=20mm, right=20mm, top=25mm, bottom=25mm}

% フォント設定 (コンテナにインストールされている日本語フォントを指定)
\\setmainjfont{IPAexMincho}
\\setsansjfont{IPAexGothic}

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

${content}
\\end{document}
`;

  return template;
}

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
