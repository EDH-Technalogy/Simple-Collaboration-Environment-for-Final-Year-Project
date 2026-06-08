package com.final_project.faculty_service.DTO.response;

import com.final_project.faculty_service.models.AcademicYear;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AcademicYearResponse {
    private String id;
    private String name;
    private Date startDate;
    private Date endDate;
    private String calendarType;
}
