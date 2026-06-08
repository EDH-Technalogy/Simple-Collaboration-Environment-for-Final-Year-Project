package com.final_project.faculty_service.models;


import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@Document
public class AcademicYear {
    @Id
    private String id;
    private boolean isActive;
    private String name;
    private Date startDate;
    private Date endDate;
    private String calendarType;
    private boolean isDeleted;
}
