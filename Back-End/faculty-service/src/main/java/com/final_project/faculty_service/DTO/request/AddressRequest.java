package com.final_project.faculty_service.DTO.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AddressRequest {
    @NotBlank(message = "city should not be empty")
    @Size( min = 2, max = 50 , message = "City should be between 2 and 50 characters")
    private String city;

    @NotBlank(message = "Country should not be empty")
    @Size( min = 2, max = 50 , message = "Country should be between 2 and 50 characters")
    private String country;
    @NotBlank(message = "street is required")
    @Size( min = 2, max = 100 , message = "street should be between 2 and 100 characters")
    private String street;
    @NotBlank(message = "Zip code is required")
    @Pattern(regexp = "^[0-9]{4,10}$", message = "Zip code must be numeric and between 4 to 10 digits")
    private String zip;
    public AddressRequest(String city, String country, String street, String zip) {
        this.city = city;
        this.country = country;
        this.street = street;
        this.zip = zip;
    }
}
