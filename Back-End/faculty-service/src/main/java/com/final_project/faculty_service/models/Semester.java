package com.final_project.faculty_service.models;


import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@Document
public class Semester {

    @Id
    private String id;
    @DBRef
    private AcademicYear academicYear;
    private SemesterType type;
    private String name;
    private Date startDate;
    private Date endDate;
    private String code;
    private boolean isDeleted = false;
}
