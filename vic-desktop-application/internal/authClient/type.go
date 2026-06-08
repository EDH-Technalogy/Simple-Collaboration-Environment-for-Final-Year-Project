package authclient

import "encoding/json"

type LoginResponse struct {
	ServerURL    string `json:"server_url"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
	TokenType    string `json:"token_type"`
	User         User   `json:"user"`
	Message      string `json:"message"`
}

type LoginRequest struct {
	UsernameOrEmail string `json:"username_or_email"`
	Password        string `json:"password"`
	RememberMe      bool   `json:"remember_me"`
}

type User struct {
	ID            string   `json:"id"`
	UserName      string   `json:"username"`
	Email         string   `json:"email"`
	FirstName     string   `json:"first_name"`
	LastName      string   `json:"last_name"`
	Image         string   `json:"image"`
	ProfileImage  string   `json:"profile_image"`
	AvatarURL     string   `json:"avatar_url"`
	PhotoURL      string   `json:"photoUrl"`
	Status        string   `json:"status"`
	EmailVerified bool     `json:"email_verified"`
	Roles         []string `json:"roles"`
}

func (u *User) UnmarshalJSON(data []byte) error {
	type userAlias User
	var raw struct {
		userAlias
		UserNameSnake string `json:"user_name"`
		PhotoURLSnake string `json:"photo_url"`
	}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	*u = User(raw.userAlias)
	if u.UserName == "" {
		u.UserName = raw.UserNameSnake
	}
	if u.PhotoURL == "" {
		u.PhotoURL = raw.PhotoURLSnake
	}
	return nil
}
