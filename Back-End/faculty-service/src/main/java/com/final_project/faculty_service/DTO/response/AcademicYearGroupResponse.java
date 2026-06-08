package com.final_project.faculty_service.DTO.response;

import lombok.Data;

import java.util.Date;

@Data
public class AcademicYearGroupResponse {
    private String id;
    private String name;
    private Date startDate;
    private Date endDate;

    public AcademicYearGroupResponse(String name, Date startDate, Date endDate) {
        this(null, name, startDate, endDate);
    }

    public AcademicYearGroupResponse(String id, String name, Date startDate, Date endDate) {
        this.id = id;
        this.name = name;
        this.startDate = startDate;
        this.endDate = endDate;
    }
}
