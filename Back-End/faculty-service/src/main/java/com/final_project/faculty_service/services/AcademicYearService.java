package com.final_project.faculty_service.services;

import com.final_project.faculty_service.DTO.mapper.AcademicYearMapper;
import com.final_project.faculty_service.DTO.request.AcademicYearRequest;
import com.final_project.faculty_service.DTO.response.AcademicYearResponse;
import com.final_project.faculty_service.DTO.response.PageResponse;
import com.final_project.faculty_service.models.AcademicYear;
import com.final_project.faculty_service.repository.AcademicYearRepository;
import com.final_project.faculty_service.services.exception.ResourceNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class AcademicYearService {
    private final AcademicYearRepository academicYearRepository;
    private final AcademicYearMapper    academicYearMapper;
    public PageResponse<AcademicYearResponse> findAll(Pageable pageable) {
        Page<AcademicYear> academicYearPage = academicYearRepository.findByIsDeletedIsFalse(pageable);

        List<AcademicYearResponse> academicYearResponses = academicYearPage
                .getContent()
                .stream()
                .map(academicYearMapper::toResponse)
                .toList();
        return PageResponse.<AcademicYearResponse>builder()
                .data(academicYearResponses)
                .page(academicYearPage.getNumber())
                .size(academicYearPage.getSize())
                .totalElements(academicYearPage.getTotalElements())
                .totalPages(academicYearPage.getTotalPages())
                .last(academicYearPage.isLast())
                .build();
    }

    public AcademicYearResponse update(String id , AcademicYearRequest request){
        AcademicYear currentRpoItem = academicYearRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Academic Year Not Found"));
        AcademicYear mappedCurrent = academicYearMapper.toEntity(request);
        mappedCurrent.setId(id);
        return academicYearMapper.toResponse(academicYearRepository.save(mappedCurrent));
    }

    public AcademicYearResponse findById(String id){
        var current = academicYearRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Academic Year Not Found"));
        return academicYearMapper.toResponse(current);
    }

    public AcademicYearResponse create(AcademicYearRequest request){
        AcademicYear academicYear = academicYearMapper.toEntity(request);
        return academicYearMapper.toResponse(academicYearRepository.save(academicYear));
    }

    public void delete(String id){
        var curr = academicYearRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Academic Year Not Found"));
        curr.setDeleted(true);
        academicYearRepository.save(curr);
    }


}
