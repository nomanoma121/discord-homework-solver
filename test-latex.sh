#!/bin/bash

echo "🧪 Testing LaTeX Compiler Service..."

# Test LaTeX code
TEST_LATEX='{
  "latex_code": "\\documentclass{article}\\n\\usepackage{amsmath}\\n\\begin{document}\\n\\title{Test Document}\\n\\author{Gemini-LaTeX Bot}\\n\\date{\\today}\\n\\maketitle\\n\\section{Test}\\nThis is a test: $E = mc^2$\\n\\end{document}"
}'

echo "Sending test request to LaTeX compiler..."

# Send test request
curl -X POST \
  -H "Content-Type: application/json" \
  -d "$TEST_LATEX" \
  http://localhost:8080/compile \
  --output test_output.pdf \
  --write-out "HTTP Status: %{http_code}\n"

if [ -f "test_output.pdf" ]; then
    echo "✅ LaTeX compilation successful! PDF generated."
    echo "📄 Output saved as test_output.pdf"
    ls -la test_output.pdf
else
    echo "❌ LaTeX compilation failed"
fi
