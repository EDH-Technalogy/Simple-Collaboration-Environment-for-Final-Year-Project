package com.final_project.faculty_service.DTO.mapper;

import com.final_project.faculty_service.DTO.request.AcademicYearRequest;
import com.final_project.faculty_service.DTO.response.AcademicYearResponse;
import com.final_project.faculty_service.models.AcademicYear;
import org.springframework.stereotype.Component;

@Component
public class AcademicYearMapper implements BaseMapper<AcademicYearRequest, AcademicYearResponse, AcademicYear>{
    @Override
    public AcademicYear toEntity(AcademicYearRequest request) {
        AcademicYear academicYear = new AcademicYear();
        academicYear.setName(request.getName());
        academicYear.setCalendarType(request.getCalendarType());
        academicYear.setStartDate(request.getStartDate());
        academicYear.setEndDate(request.getEndDate());
        return academicYear;
    }

    @Override
    public AcademicYearResponse toResponse(AcademicYear academicYear) {
        AcademicYearResponse academicYearResponse = new AcademicYearResponse();
        academicYearResponse.setId(academicYear.getId());
        academicYearResponse.setName(academicYear.getName());
        academicYearResponse.setCalendarType(academicYear.getCalendarType());
        academicYearResponse.setStartDate(academicYear.getStartDate());
        academicYearResponse.setEndDate(academicYear.getEndDate());
        return academicYearResponse;
    }
}
