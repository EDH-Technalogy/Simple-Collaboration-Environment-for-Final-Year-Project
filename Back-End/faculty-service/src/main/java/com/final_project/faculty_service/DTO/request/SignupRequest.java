
package com.final_project.faculty_service.DTO.request;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.Set;

@Data
public class SignupRequest {

    @JsonProperty("username")
    private String username;

    @JsonProperty("email")
    private String email;

    @JsonProperty("password")
    private String password;

    @JsonProperty("first_name")
    private String firstName;

    @JsonProperty("last_name")
    private String lastName;

    @JsonProperty("phone_number")
    private String phoneNumber;

    @JsonProperty("terms_agreed")
    private Boolean termsAgreed;

    @JsonProperty("privacy_agreed")
    private Boolean privacyAgreed;

    @JsonProperty("profile")
    private String profile;

    @JsonProperty("role_names")
    private Set<String> roleNames;

}
