package com.final_project.faculty_service.DTO.mapper;

import com.final_project.faculty_service.DTO.request.BatchRequest;
import com.final_project.faculty_service.DTO.response.AcademicYearResponse;
import com.final_project.faculty_service.DTO.response.BatchResponse;
import com.final_project.faculty_service.models.AcademicYear;
import com.final_project.faculty_service.models.Batch;
import org.springframework.stereotype.Component;

@Component
public class BatchMapper implements BaseMapper<BatchRequest, BatchResponse, Batch> {
    @Override
    public Batch toEntity(BatchRequest request) {
        Batch batch = new Batch();

        batch.setName(request.getName());
        batch.setYear(request.getYear());
        batch.setType(request.getType());
        batch.setStartDate(request.getStartDate());
        batch.setEndDate(request.getEndDate());
        batch.setDescription(request.getDescription());
        batch.setActive(request.getIsActive() != null ? request.getIsActive() : true);

        AcademicYear academicYear = new AcademicYear();
        academicYear.setId(request.getAcademicYear());
        batch.setAcademicYear(academicYear);
        return batch;
    }

    @Override
    public BatchResponse toResponse(Batch batch) {

        BatchResponse response = new BatchResponse();

        response.setId(batch.getId());
        response.setName(batch.getName());
        response.setYear(batch.getYear());
        response.setType(batch.getType());
        response.setStartDate(batch.getStartDate());
        response.setEndDate(batch.getEndDate());
        response.setDescription(batch.getDescription());
        response.setIsActive(batch.isActive());
        response.setAcademicYear(new AcademicYearResponse(
                batch.getAcademicYear().getId(),
                batch.getAcademicYear().getName(),
                batch.getAcademicYear().getStartDate(),
                batch.getAcademicYear().getEndDate(),
                batch.getAcademicYear().getCalendarType()
        ));

        response.setCreatedAt(batch.getCreatedAt());
        response.setUpdatedAt(batch.getUpdatedAt());
        return response;

    }
}
