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
	// Only accept POST requests to /compile
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	log.Println("Received compilation request")

	// Parse JSON request body
	var req CompileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("JSON parsing failed: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid JSON format"})
		return
	}

	// Generate unique identifier for this request
	requestID := fmt.Sprintf("latex_%d", time.Now().UnixNano())

	// Create temporary file paths
	texFilePath := filepath.Join("/tmp", requestID+".tex")
	pdfFilePath := filepath.Join("/tmp", requestID+".pdf")
	logFilePath := filepath.Join("/tmp", requestID+".log")
	auxFilePath := filepath.Join("/tmp", requestID+".aux")

	// Cleanup function to remove all temporary files
	cleanup := func() {
		os.Remove(texFilePath)
		os.Remove(pdfFilePath)
		os.Remove(logFilePath)
		os.Remove(auxFilePath)
	}
	defer cleanup()

	// Write LaTeX code to temporary file
	if err := os.WriteFile(texFilePath, []byte(req.LatexCode), 0644); err != nil {
		log.Printf("Failed to write LaTeX file: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to create temporary file"})
		return
	}

	// Execute pdflatex command
	cmd := exec.Command("pdflatex", "-output-directory=/tmp", "-interaction=nonstopmode", texFilePath)
	output, err := cmd.CombinedOutput()

	if err != nil {
		log.Printf("pdflatex command failed: %v", err)

		// Try to read the log file for more detailed error information
		var errorLog string
		if logData, logErr := os.ReadFile(logFilePath); logErr == nil {
			errorLog = string(logData)
		} else {
			errorLog = string(output)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: errorLog})
		return
	}

	// Read the generated PDF file
	pdfData, err := os.ReadFile(pdfFilePath)
	if err != nil {
		log.Printf("Failed to read generated PDF: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to read generated PDF"})
		return
	}

	// Send successful response with PDF
	w.Header().Set("Content-Type", "application/pdf")
	w.WriteHeader(http.StatusOK)
	w.Write(pdfData)

	log.Printf("Successfully compiled LaTeX to PDF (request ID: %s)", requestID)
}
