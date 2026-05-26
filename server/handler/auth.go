package handler

import (
	"encoding/json"
	"net/http"

	"github.com/leemwood/tarui-novel-studio/server/middleware"
	"github.com/leemwood/tarui-novel-studio/server/model"
)

type authRequest struct {
	Password string `json:"password"`
}

type authResponse struct {
	Token string `json:"token"`
}

func HealthCheck(w http.ResponseWriter, r *http.Request) {
	initialized, _ := model.IsInitialized()
	json.NewEncoder(w).Encode(map[string]interface{}{
		"initialized": initialized,
	})
}

func Setup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}
	init, _ := model.IsInitialized()
	if init {
		http.Error(w, `{"error":"already initialized"}`, http.StatusBadRequest)
		return
	}
	var req authRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Password == "" {
		http.Error(w, `{"error":"password required"}`, http.StatusBadRequest)
		return
	}
	if len(req.Password) < 4 {
		http.Error(w, `{"error":"password too short (min 4 chars)"}`, http.StatusBadRequest)
		return
	}
	if err := model.SetupPassword(req.Password); err != nil {
		http.Error(w, `{"error":"setup failed"}`, http.StatusInternalServerError)
		return
	}
	token, err := middleware.GenerateToken()
	if err != nil {
		http.Error(w, `{"error":"token generation failed"}`, http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(authResponse{Token: token})
}

func Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}
	var req authRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Password == "" {
		http.Error(w, `{"error":"password required"}`, http.StatusBadRequest)
		return
	}
	if err := model.VerifyPassword(req.Password); err != nil {
		http.Error(w, `{"error":"invalid password"}`, http.StatusUnauthorized)
		return
	}
	token, err := middleware.GenerateToken()
	if err != nil {
		http.Error(w, `{"error":"token generation failed"}`, http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(authResponse{Token: token})
}
