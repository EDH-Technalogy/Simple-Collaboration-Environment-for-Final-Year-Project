package com.final_project.faculty_service.DTO.response;

import com.final_project.faculty_service.models.AcademicYear;
import com.final_project.faculty_service.models.SemesterType;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;

import java.util.Date;

@Data
@AllArgsConstructor
public class StudentSemesterResponse {
    private AcademicYearResponse academicYear;
    private SemesterType type;
    private String name;
    private Date startDate;
    private Date endDate;
    private String code;
}
