package com.final_project.faculty_service.DTO.response;

import com.final_project.faculty_service.models.EducationRank;
import com.final_project.faculty_service.models.FacultyPosition;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class EmployeeResponseInFaculty {
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private EducationRank educationRank;
    private FacultyPosition facultyPosition;
}
