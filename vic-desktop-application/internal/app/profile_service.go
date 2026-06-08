package app

import (
	"github.com/elyasahmadi/vic/internal/authClient"
	"github.com/elyasahmadi/vic/internal/session"
)

type UserProfile struct {
	ID            string   `json:"id"`
	UserName      string   `json:"username"`
	Email         string   `json:"email"`
	FirstName     string   `json:"firstName"`
	LastName      string   `json:"lastName"`
	DisplayName   string   `json:"displayName"`
	Image         string   `json:"image"`
	PhotoURL      string   `json:"photoUrl"`
	Status        string   `json:"status"`
	EmailVerified bool     `json:"emailVerified"`
	Roles         []string `json:"roles"`
	LoggedIn      bool     `json:"loggedIn"`
}

func CurrentUserProfile(repoPath string) (*UserProfile, error) {
	_, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return &UserProfile{}, nil
	}
	user, ok, err := session.CurrentUser(vicDir)
	if err != nil {
		return nil, err
	}
	if !ok {
		return &UserProfile{}, nil
	}
	return profileFromUser(user), nil
}

func profileFromUser(user authclient.User) *UserProfile {
	displayName := user.UserName
	if user.FirstName != "" || user.LastName != "" {
		displayName = user.FirstName + " " + user.LastName
	}
	if displayName == "" {
		displayName = user.Email
	}
	image := user.Image
	if image == "" {
		image = user.ProfileImage
	}
	if image == "" {
		image = user.AvatarURL
	}
	if image == "" {
		image = user.PhotoURL
	}
	return &UserProfile{
		ID:            user.ID,
		UserName:      user.UserName,
		Email:         user.Email,
		FirstName:     user.FirstName,
		LastName:      user.LastName,
		DisplayName:   displayName,
		Image:         image,
		PhotoURL:      user.PhotoURL,
		Status:        user.Status,
		EmailVerified: user.EmailVerified,
		Roles:         user.Roles,
		LoggedIn:      true,
	}
}
