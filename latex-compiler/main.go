package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

type CompileRequest struct {
	LatexCode string `json:"latex_code"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func main() {
	http.HandleFunc("/compile", handleCompile)

	log.Println("LaTeX compiler service starting on port 8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}

func handleCompile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	log.Println("Received compilation request")

	var req CompileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("JSON parsing failed: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid JSON format"})
		return
	}

	requestID := fmt.Sprintf("latex_%d", time.Now().UnixNano())
	texFilePath := filepath.Join("/tmp", requestID+".tex")

	// deferを使って、この関数が終了する際に必ず一時ファイルを削除する
	defer os.Remove(texFilePath)

	if err := os.WriteFile(texFilePath, []byte(req.LatexCode), 0644); err != nil {
		log.Printf("Failed to write LaTeX file: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to create temporary file"})
		return
	}

	// lualatexコマンドを実行
	cmd := exec.Command("lualatex", "-output-directory=/tmp", "-interaction=nonstopmode", texFilePath)
	output, err := cmd.CombinedOutput() // 標準出力と標準エラーを両方取得

	// エラーが発生した場合（コンパイル失敗）
	if err != nil {
		// コマンドの出力を文字列として取得。これがLaTeXのエラーログになる。
		errorLog := string(output)

		// 修正点：詳細なエラーログをサーバーのコンソールに出力
		log.Printf("--- LaTeX Compilation Failed (Request ID: %s) ---", requestID)
		log.Printf("Full log output:\n%s", errorLog)
		log.Println("--- End of Log ---")

		// bot-appに詳細なエラーログをJSONで返す
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError) // 500 Internal Server Error
		json.NewEncoder(w).Encode(ErrorResponse{Error: errorLog})
		return // ここで処理を終了
	}

	// コンパイル成功時
	pdfFilePath := filepath.Join("/tmp", requestID+".pdf")
	defer os.Remove(pdfFilePath) // PDFも関数終了時に削除

	pdfData, err := os.ReadFile(pdfFilePath)
	if err != nil {
		log.Printf("Failed to read generated PDF: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to read generated PDF after successful compilation"})
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.WriteHeader(http.StatusOK)
	w.Write(pdfData)

	log.Printf("Successfully compiled LaTeX to PDF (request ID: %s)", requestID)
}
