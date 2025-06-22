/**
 * Geminiから受け取ったLaTeXの本文を、完全なコンパイル可能なドキュメントに変換します。
 * また、AIが生成しがちなMarkdownのコードブロックや見出し記法を安全に除去・変換します。
 * @param latexCode - Gemini APIから返された生のLaTeX本文コンテンツ。
 * @returns コンパイル可能な完全なLaTeXドキュメント文字列。
 */
export function parseFullLatexCode(latexCode: string): string {
  let cleanedContent = latexCode.trim();

  // 1. 文字列の先頭と末尾がコードブロックで囲まれている場合のみ、その囲いを安全に削除
  if (cleanedContent.startsWith('```latex') && cleanedContent.endsWith('```')) {
    // '```latex' (7文字) と '```' (3文字) を削除
    cleanedContent = cleanedContent.substring(7, cleanedContent.length - 3).trim();
  } else if (cleanedContent.startsWith('```') && cleanedContent.endsWith('```')) {
    // '```' (3文字) を両端から削除
    cleanedContent = cleanedContent.substring(3, cleanedContent.length - 3).trim();
  }

  // 2. Markdownの見出し記法をLaTeXのセクションコマンドに変換
  //    行頭(^)にあるものだけを対象にする (gmフラグ: 複数行を対象)
  // ### 見出し -> \subsubsection*{見出し}
  cleanedContent = cleanedContent.replace(/^### (.*$)/gm, '\\subsubsection*{$1}');
  // ## 見出し -> \subsection*{見出し}
  cleanedContent = cleanedContent.replace(/^## (.*$)/gm, '\\subsection*{$1}');
  // # 見出し -> \section*{見出し}
  cleanedContent = cleanedContent.replace(/^# (.*$)/gm, '\\section*{$1}');

  // 3. Markdownの太字をLaTeXのtextbfに変換
  cleanedContent = cleanedContent.replace(/\*\*(.*?)\*\*/g, '\\textbf{$1}');
  
  // 4. Markdownの水平線をLaTeXのhrulefillに変換
  cleanedContent = cleanedContent.replace(/^---$/gm, '\\hrulefill');

  // 5. 日本語対応のlualatex用テンプレートに埋め込む
  const fullLatexDocument = `
\\documentclass[a4paper, 12pt]{ltjsarticle}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{geometry}
\\usepackage{luatexja-fontspec}
\\usepackage{graphicx}

\\geometry{left=20mm, right=20mm, top=25mm, bottom=25mm}
% コンテナにインストールされている日本語フォントを指定
\\setmainjfont{IPAexMincho}
\\setsansjfont{IPAexGothic}

\\begin{document}
${cleanedContent}
\\end{document}
`;

  return fullLatexDocument;
}
