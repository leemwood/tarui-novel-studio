package model

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID           int    `json:"id"`
	PasswordHash string `json:"-"`
	CreatedAt    string `json:"created_at"`
}

func SetupPassword(password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	_, err = DB.Exec("DELETE FROM users") // ensure single user
	if err != nil {
		return err
	}
	_, err = DB.Exec("INSERT INTO users (password_hash) VALUES (?)", string(hash))
	return err
}

func VerifyPassword(password string) error {
	var hash string
	err := DB.QueryRow("SELECT password_hash FROM users LIMIT 1").Scan(&hash)
	if err != nil {
		return errors.New("no user configured")
	}
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}
