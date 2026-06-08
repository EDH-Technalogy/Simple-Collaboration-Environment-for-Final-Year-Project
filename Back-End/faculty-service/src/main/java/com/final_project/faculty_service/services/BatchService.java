package com.final_project.faculty_service.services;

import com.final_project.faculty_service.DTO.mapper.BatchMapper;
import com.final_project.faculty_service.DTO.request.BatchRequest;
import com.final_project.faculty_service.DTO.response.BatchResponse;
import com.final_project.faculty_service.DTO.response.PageResponse;
import com.final_project.faculty_service.models.AcademicYear;
import com.final_project.faculty_service.models.Batch;
import com.final_project.faculty_service.repository.BatchRepository;
import com.final_project.faculty_service.repository.AcademicYearRepository;
import com.final_project.faculty_service.services.exception.ResourceNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class BatchService {

    private final BatchRepository batchRepository;
    private final AcademicYearRepository academicYearRepository;
    private final BatchMapper batchMapper;
    // List with pagination
    public PageResponse<BatchResponse> findAll(Pageable pageable) {
        Page<Batch> batchPage = batchRepository.findByIsDeletedIsFalse(pageable);

        List<BatchResponse> batchResponses = batchPage
                .getContent()
                .stream()
                .map(batchMapper::toResponse)
                .toList();
        return PageResponse.<BatchResponse>builder()
                .data(batchResponses)
                .page(batchPage.getNumber())
                .size(batchPage.getSize())
                .totalElements(batchPage.getTotalElements())
                .totalPages(batchPage.getTotalPages())
                .last(batchPage.isLast())
                .build();
    }

    // Find batch by ID
    public BatchResponse findById(String id) {
        Batch batchOpt = batchRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch Not Found"));
//        AcademicYear academicYear = academicYearRepository.findByIdAndIsDeletedIsFalse(id)
//                .orElseThrow(() -> new ResourceNotFoundException("Academic Year Not Found"));
//        batchOpt
        return batchMapper.toResponse(batchOpt);
    }

    // Create new batch
    public BatchResponse create(BatchRequest batchRequest) {
        AcademicYear academicYear = academicYearRepository.findByIdAndIsDeletedIsFalse(batchRequest.getAcademicYear())
                .orElseThrow(() -> new ResourceNotFoundException("Academic Year Not Found"));
        Batch batch = batchMapper.toEntity(batchRequest);
        batch.setAcademicYear(academicYear);
        batchRepository.save(batch);
        return batchMapper.toResponse(batch);
    }

    // Update existing batch
    public BatchResponse update(String id, BatchRequest batchRequest) {
        Batch batchOpt = batchRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch Not Found"));
        Batch mappedBatch = batchMapper.toEntity(batchRequest);
        mappedBatch.setAcademicYear(batchOpt.getAcademicYear());
        mappedBatch.setId(id);
        batchRepository.save(mappedBatch);

        return batchMapper.toResponse(mappedBatch);
    }


    // Delete batch
    public void delete(String id) {
        var batchOpt = batchRepository.findByIdAndIsDeletedIsFalse(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Batch Not Found"));
        batchRepository.delete(batchOpt);
        batchRepository.save(batchOpt);
    }

}