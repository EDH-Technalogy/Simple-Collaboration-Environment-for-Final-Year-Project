package com.final_project.faculty_service.services;

import com.final_project.faculty_service.DTO.mapper.SemesterMapper;
import com.final_project.faculty_service.DTO.request.SemesterRequest;
import com.final_project.faculty_service.DTO.response.PageResponse;
import com.final_project.faculty_service.DTO.response.SemesterResponse;
import com.final_project.faculty_service.models.AcademicYear;
import com.final_project.faculty_service.models.Semester;
import com.final_project.faculty_service.repository.AcademicYearRepository;
import com.final_project.faculty_service.repository.SemesterRepository;
import com.final_project.faculty_service.services.exception.ResourceNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class SemesterService {

    private final SemesterRepository semesterRepository;
    private final SequenceGeneratorService sequenceGeneratorService;
    private final AcademicYearRepository academicYearRepository;
    private final SemesterMapper semesterMapper;
    public PageResponse<SemesterResponse> findAll(Pageable pageable) {
        Page<Semester> semesterPage = semesterRepository.findByIsDeletedIsFalse(pageable);
        List<SemesterResponse> semesterResponses = semesterPage
                .getContent()
                .stream()
                .map(semesterMapper::toResponse)
                .toList();
        return PageResponse.<SemesterResponse>builder()
                .data(semesterResponses)
                .page(semesterPage.getNumber())
                .size(semesterPage.getSize())
                .totalElements(semesterPage.getTotalElements())
                .totalPages(semesterPage.getTotalPages())
                .last(semesterPage.isLast())
                .build();
    }

    public List<SemesterResponse> getSemestersByAcademicYearId(String academicYearId) {
        List<Semester> semesters =  semesterRepository.findByAcademicYearIdAndIsDeletedFalse(academicYearId);
        return semesters.stream().map(semesterMapper::toResponse).toList();
    }
    public SemesterResponse update(String id , SemesterRequest request){

        Semester currentSemester = semesterRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Semester not found"));
        AcademicYear academicYear = academicYearRepository.findByIdAndIsDeletedIsFalse(currentSemester.getAcademicYear().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Academic Year not found"));

        Semester mappedSemester = semesterMapper.toEntity(request);
        mappedSemester.setAcademicYear(academicYear);
        mappedSemester.setId(id);
        semesterRepository.save(mappedSemester);

        return semesterMapper.toResponse(mappedSemester);
    }

    public SemesterResponse findById(String id){
        Semester current = semesterRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Semester not found"));
        return semesterMapper.toResponse(current);
    }

    public SemesterResponse create(SemesterRequest semesterRequest){
        AcademicYear academicYear = academicYearRepository.findByIdAndIsDeletedIsFalse(semesterRequest.getAcademicYear())
                .orElseThrow(() -> new ResourceNotFoundException("Academic Year not found"));
        Semester semester = semesterMapper.toEntity(semesterRequest);
        semester.setAcademicYear(academicYear);

        long sequence = sequenceGeneratorService.generateSequence("semester_seq");
        semester.setCode("SEM-"+academicYear.getName().split("-")[0].toUpperCase()+"-"+sequence);
        Semester updatedValue = semesterRepository.save(semester);
        return semesterMapper.toResponse(updatedValue);
    }

    public void delete(String id){
        Semester curr = semesterRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Semester not found"));
        curr.setDeleted(true);
        semesterRepository.save(curr);
    }

}
