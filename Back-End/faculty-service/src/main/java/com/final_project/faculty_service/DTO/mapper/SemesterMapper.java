package com.final_project.faculty_service.DTO.mapper;

import com.final_project.faculty_service.DTO.request.SemesterRequest;
import com.final_project.faculty_service.DTO.response.AcademicYearGroupResponse;
import com.final_project.faculty_service.DTO.response.SemesterResponse;
import com.final_project.faculty_service.models.AcademicYear;
import com.final_project.faculty_service.models.Semester;
import org.springframework.stereotype.Component;

@Component
public class SemesterMapper implements BaseMapper<SemesterRequest, SemesterResponse, Semester> {
    @Override
    public Semester toEntity(SemesterRequest semesterRequest) {
        Semester semester = new Semester();

        AcademicYear academicYear = new AcademicYear();
        academicYear.setId(semesterRequest.getAcademicYear());
        semester.setAcademicYear(academicYear);

        semester.setName(semesterRequest.getName());
        semester.setType(semesterRequest.getType());
        semester.setCode(semester.getCode());

        semester.setStartDate(semesterRequest.getStartDate());
        semester.setEndDate(semesterRequest.getEndDate());

        return semester;
    }

    @Override
    public SemesterResponse toResponse(Semester semester) {


        SemesterResponse response = new SemesterResponse();

        response.setType(semester.getType());
        response.setCode(semester.getCode());

        AcademicYear academicYear = semester.getAcademicYear();
        AcademicYearGroupResponse academicYearResponse = academicYear != null
                ? new AcademicYearGroupResponse(
                academicYear.getId(),
                academicYear.getName(),
                academicYear.getStartDate(),
                academicYear.getEndDate()
        )
                : null;

        response.setAcademicYear(academicYearResponse);
        response.setName(semester.getName());
        response.setStartDate(semester.getStartDate());
        response.setId(semester.getId());
        response.setEndDate(semester.getEndDate());
        response.setCode(semester.getCode());
        return response;
    }
}
