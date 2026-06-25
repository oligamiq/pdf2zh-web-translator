package main

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
)

var (
	jobsMu         sync.Mutex
	runningJobs    = make(map[string]bool)
)

func ensureDir(path string) error {
	return os.MkdirAll(path, 0755)
}

func verifySecret(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		secret := os.Getenv("PROXY_SECRET")
		hasHeader := r.Header.Get("X-Proxy-Secret") != ""
		if secret != "" && r.Header.Get("X-Proxy-Secret") != secret {
			log.Printf("proxy secret rejected: method=%s path=%s has_header=%t", r.Method, r.URL.Path, hasHeader)
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		next(w, r)
	}
}

// GET /internal/healthz
func handleHealthz(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

// PUT /internal/files/{job_id}/input
func handlePutInput(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 5 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	jobID := parts[3]
	log.Printf("received input upload: job_id=%s method=%s path=%s", jobID, r.Method, r.URL.Path)

	uploadDir := filepath.Join("/data/uploads", jobID)
	ensureDir(uploadDir)
	inputPath := filepath.Join(uploadDir, "input.pdf")

	out, err := os.Create(inputPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, r.Body); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// GET /internal/jobs/{job_id}/log?offset=N&limit=65536
func handleLog(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 5 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	jobID := parts[3]

	offsetStr := r.URL.Query().Get("offset")
	limitStr := r.URL.Query().Get("limit")
	
	var offset int64 = 0
	var limit int64 = 65536
	if offsetStr != "" {
		offset, _ = strconv.ParseInt(offsetStr, 10, 64)
	}
	if limitStr != "" {
		limit, _ = strconv.ParseInt(limitStr, 10, 64)
	}

	logPath := filepath.Join("/data/logs", jobID+".log")
	file, err := os.Open(logPath)
	if err != nil {
		if os.IsNotExist(err) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"data": "", "next_offset": 0}`))
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer file.Close()

	info, err := file.Stat()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if offset > info.Size() {
		offset = info.Size()
	}

	readLen := limit
	if offset+readLen > info.Size() {
		readLen = info.Size() - offset
	}

	buf := make([]byte, readLen)
	file.Seek(offset, 0)
	n, _ := file.Read(buf)

	resp := map[string]interface{}{
		"data":        string(buf[:n]),
		"next_offset": offset + int64(n),
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// GET /internal/jobs/{job_id}/download
func handleDownload(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 5 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	jobID := parts[3]

	dirPath := filepath.Join("/data/outputs", jobID)
	zipName := "translated_" + jobID + ".zip"

	pdfs, _ := findOutputPDFs(dirPath)

	if len(pdfs) == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)
		w.Write([]byte(`{"error":"no_output_pdf"}`))
		return
	}

	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", zipName))
	
	zw := zip.NewWriter(w)
	defer zw.Close()

	filepath.WalkDir(dirPath, func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}
		b, readErr := os.ReadFile(path)
		if readErr == nil {
			rel, _ := filepath.Rel(dirPath, path)
			if f, createErr := zw.Create(rel); createErr == nil {
				f.Write(b)
			}
		}
		return nil
	})
}

func findOutputPDFs(root string) ([]string, error) {
	var pdfs []string

	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if d.IsDir() {
			return nil
		}
		if !strings.HasSuffix(strings.ToLower(d.Name()), ".pdf") {
			return nil
		}

		info, err := d.Info()
		if err != nil {
			return err
		}
		if info.Size() <= 0 {
			return nil
		}

		pdfs = append(pdfs, path)
		return nil
	})

	return pdfs, err
}

func logOutputTree(jobID, root string) {
	log.Printf("job output tree: job_id=%s root=%s", jobID, root)

	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			log.Printf("job output walk error: path=%s err=%v", path, walkErr)
			return nil
		}

		info, statErr := d.Info()
		if statErr != nil {
			log.Printf("job output stat error: path=%s err=%v", path, statErr)
			return nil
		}

		rel, relErr := filepath.Rel(root, path)
		if relErr != nil {
			rel = path
		}

		log.Printf(" - %s dir=%t size=%d", rel, d.IsDir(), info.Size())
		return nil
	})

	if err != nil {
		log.Printf("job output walk failed: job_id=%s err=%v", jobID, err)
	}
}

// POST /internal/files/{job_id}/delete
func handleDelete(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 5 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	jobID := parts[3]

	os.RemoveAll(filepath.Join("/data/uploads", jobID))
	os.RemoveAll(filepath.Join("/data/outputs", jobID))
	os.RemoveAll(filepath.Join("/data/logs", jobID+".log"))
	os.RemoveAll(filepath.Join("/data/work", jobID))
	
	w.WriteHeader(http.StatusOK)
}

func runJob(jobID string) error {
	jobsMu.Lock()
	if runningJobs[jobID] {
		jobsMu.Unlock()
		return fmt.Errorf("already running")
	}
	runningJobs[jobID] = true
	jobsMu.Unlock()

	defer func() {
		jobsMu.Lock()
		delete(runningJobs, jobID)
		jobsMu.Unlock()
	}()

	inputPath := filepath.Join("/data/uploads", jobID, "input.pdf")
	outputDir := filepath.Join("/data/outputs", jobID)
	logPath := filepath.Join("/data/logs", jobID+".log")
	workDir := filepath.Join("/data/work", jobID)

	ensureDir(outputDir)
	ensureDir(filepath.Join("/data/logs"))
	ensureDir(workDir)

	logFile, err := os.Create(logPath)
	if err != nil {
		return fmt.Errorf("failed to create log file: %v", err)
	}
	defer logFile.Close()

	args := []string{inputPath, "--output", outputDir, "--lang-out", "ja", "--watermark-output-mode", "no_watermark"}
	logArgs := []string{inputPath, "--output", outputDir, "--lang-out", "ja", "--watermark-output-mode", "no_watermark"}

	service := os.Getenv("PDF2ZH_TRANSLATOR_SERVICE")
	if service == "" {
		service = "openaicompatible"
	}

	switch service {
	case "openaicompatible":
		args = append(args, "--openaicompatible")
		logArgs = append(logArgs, "--openaicompatible")

		if model := os.Getenv("PDF2ZH_OPENAI_COMPATIBLE_MODEL"); model != "" {
			args = append(args, "--openai-compatible-model", model)
			logArgs = append(logArgs, "--openai-compatible-model", model)
		}
		if baseURL := os.Getenv("PDF2ZH_OPENAI_COMPATIBLE_BASE_URL"); baseURL != "" {
			args = append(args, "--openai-compatible-base-url", baseURL)
			logArgs = append(logArgs, "--openai-compatible-base-url", baseURL)
		}
		if apiKey := os.Getenv("PDF2ZH_OPENAI_COMPATIBLE_API_KEY"); apiKey != "" {
			args = append(args, "--openai-compatible-api-key", apiKey)
			logArgs = append(logArgs, "--openai-compatible-api-key", "(hidden)")
		}
	case "openai":
		args = append(args, "--openai")
		logArgs = append(logArgs, "--openai")
	case "deepseek":
		args = append(args, "--deepseek")
		logArgs = append(logArgs, "--deepseek")
	case "gemini":
		args = append(args, "--gemini")
		logArgs = append(logArgs, "--gemini")
	default:
		return fmt.Errorf("unsupported PDF2ZH_TRANSLATOR_SERVICE: %s", service)
	}

	cmd := exec.Command("pdf2zh_next", args...)
	cmd.Stdout = logFile
	cmd.Stderr = logFile

	log.Printf("pdf2zh_next command: pdf2zh_next %s", strings.Join(logArgs, " "))
	log.Printf("input: %s", inputPath)
	log.Printf("output_dir: %s", outputDir)
	log.Printf("work_dir: %s", workDir)

	startTime := time.Now()
	err = cmd.Run()
	duration := time.Since(startTime)
	
	exitCode := 0
	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			exitCode = exitError.ExitCode()
		} else {
			exitCode = -1
		}
	}
	
	log.Printf("pdf2zh_next finished: job_id=%s exit_code=%d duration_ms=%d", jobID, exitCode, duration.Milliseconds())

	logOutputTree(jobID, outputDir)

	if err != nil {
		return err
	}

	pdfs, _ := findOutputPDFs(outputDir)
	if len(pdfs) == 0 {
		return fmt.Errorf("pdf2zh_next exited successfully, but no non-empty PDF output was found")
	}

	return nil
}

// POST /internal/jobs/{job_id}/run
func handleRun(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 5 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	jobID := parts[3]

	// Async run for manual/webhook triggers
	go runJob(jobID)
	w.WriteHeader(http.StatusAccepted)
}

func resolveWorkerAPIBaseURL() string {
	mode := os.Getenv("PC_AGENT_MODE")

	if mode == "mock" {
		if v := os.Getenv("WORKER_API_BASE_URL_MOCK"); v != "" {
			return strings.TrimRight(v, "/")
		}
	}

	return strings.TrimRight(os.Getenv("WORKER_API_BASE_URL"), "/")
}

func agentLoop() {
	workerAPI := resolveWorkerAPIBaseURL()
	agentToken := os.Getenv("AGENT_TOKEN")
	workerID := os.Getenv("WORKER_ID")
	if workerID == "" {
		workerID = "pc-agent-1"
	}
	if workerAPI == "" || agentToken == "" {
		log.Println("Agent loop disabled (missing WORKER_API_URL or AGENT_TOKEN)")
		return
	}

	log.Println("Agent loop started, polling:", workerAPI)

	for {
		time.Sleep(5 * time.Second)
		
		req, _ := http.NewRequest("POST", workerAPI+"/agent/claim", strings.NewReader(`{"worker_id":"`+workerID+`"}`))
		req.Header.Set("Authorization", "Bearer "+agentToken)
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			log.Println("Agent claim error:", err)
			continue
		}
		
		var claimResp struct {
			Job *struct { ID string `json:"id"` } `json:"job"`
		}
		err = json.NewDecoder(resp.Body).Decode(&claimResp)
		resp.Body.Close()

		if err != nil || claimResp.Job == nil {
			continue
		}

		jobID := claimResp.Job.ID
		log.Println("Claimed job:", jobID)

		err = runJob(jobID)

		reportURL := workerAPI + "/agent/jobs/" + jobID + "/succeeded"
		body := ""
		if err != nil {
			log.Println("Job failed:", jobID, err)
			reportURL = workerAPI + "/agent/jobs/" + jobID + "/failed"
			// Escape error message for JSON
			errBytes, _ := json.Marshal(err.Error())
			body = `{"error": ` + string(errBytes) + `}`
		} else {
			log.Println("Job succeeded:", jobID)
		}
		
		req2, _ := http.NewRequest("POST", reportURL, strings.NewReader(body))
		req2.Header.Set("Authorization", "Bearer "+agentToken)
		req2.Header.Set("Content-Type", "application/json")
		resp2, err := http.DefaultClient.Do(req2)
		if err == nil {
			resp2.Body.Close()
		}
	}
}

func initDataDirs() {
	dirs := []string{
		"/data/uploads",
		"/data/outputs",
		"/data/logs",
		"/data/work",
		"/data/cache",
		"/data/tmp",
	}
	for _, d := range dirs {
		if err := os.MkdirAll(d, 0755); err != nil {
			log.Printf("Failed to create dir %s: %v", d, err)
		}
	}
}

func main() {
	initDataDirs()
	mux := http.NewServeMux()

	mux.HandleFunc("/internal/healthz", handleHealthz)
	mux.HandleFunc("/internal/files/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/input") && r.Method == http.MethodPut {
			handlePutInput(w, r)
		} else if strings.HasSuffix(r.URL.Path, "/delete") && r.Method == http.MethodPost {
			handleDelete(w, r)
		} else {
			http.NotFound(w, r)
		}
	})
	
	mux.HandleFunc("/internal/jobs/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/log") && r.Method == http.MethodGet {
			handleLog(w, r)
		} else if strings.HasSuffix(r.URL.Path, "/download") && r.Method == http.MethodGet {
			handleDownload(w, r)
		} else if strings.HasSuffix(r.URL.Path, "/run") && r.Method == http.MethodPost {
			handleRun(w, r)
		} else {
			http.NotFound(w, r)
		}
	})

	// Start agent polling loop in background
	if os.Getenv("PC_AGENT_AUTOSTART") != "false" {
		go agentLoop()
	} else {
		log.Printf("Agent loop disabled by PC_AGENT_AUTOSTART=false")
	}

	loggingMux := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("request received: method=%s path=%s", r.Method, r.URL.Path)
		mux.ServeHTTP(w, r)
	})

	log.Println("PC API starting on :8081")
	if err := http.ListenAndServe(":8081", verifySecret(loggingMux)); err != nil {
		log.Fatal(err)
	}
}
