package com.final_project.faculty_service.DTO.response;

import com.final_project.faculty_service.models.SemesterType;
import lombok.Data;

import java.util.Date;

@Data
public class SemesterResponse {
    private String id;
    private AcademicYearGroupResponse academicYear;
    private SemesterType type;
    private String name;
    private Date startDate;
    private Date endDate;
    private String code;
}
