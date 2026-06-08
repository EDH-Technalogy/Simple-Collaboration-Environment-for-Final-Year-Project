package com.final_project.faculty_service.DTO.response;

import com.final_project.faculty_service.models.Address;
import com.final_project.faculty_service.models.EducationRank;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Date;

@Data
@AllArgsConstructor
public class GroupTeacherResponse {
    private String id;
    private String keycloakId;
    private String firstName;
    private String lastName;
    private String fatherName;
    private Date dateOfBirth;
    private String email;
    private String phone;
    private String code;
}
