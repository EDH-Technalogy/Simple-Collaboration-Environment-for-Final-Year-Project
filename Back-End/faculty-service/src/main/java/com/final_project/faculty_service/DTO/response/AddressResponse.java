package com.final_project.faculty_service.DTO.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AddressResponse {
    private String city;
    private String country;
    private String street;
    private String zip;

}
