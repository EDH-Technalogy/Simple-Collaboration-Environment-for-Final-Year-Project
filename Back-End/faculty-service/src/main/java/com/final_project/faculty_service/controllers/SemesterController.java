package com.final_project.faculty_service.controllers;


import com.final_project.faculty_service.DTO.request.SemesterRequest;
import com.final_project.faculty_service.DTO.response.PageResponse;
import com.final_project.faculty_service.DTO.response.SemesterResponse;
import com.final_project.faculty_service.services.SemesterService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/semester")
@AllArgsConstructor
public class SemesterController {
    private final SemesterService semesterService;

    @GetMapping
    public ResponseEntity<PageResponse<SemesterResponse>> findAll(Pageable pageable){
        return new ResponseEntity<>(semesterService.findAll(pageable), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<SemesterResponse> createDepartment( @Valid @RequestBody SemesterRequest request){
        return new ResponseEntity<>(semesterService.create(request), HttpStatus.CREATED);
    }

    @GetMapping("/academic-year/{academicYearId}")
    public ResponseEntity<List<SemesterResponse>> getSemestersByAcademicYearId(
            @PathVariable String academicYearId
    ) {
        return ResponseEntity.ok(
                semesterService.getSemestersByAcademicYearId(academicYearId)
        );
    }
    @GetMapping("/{id}")
    public ResponseEntity<SemesterResponse> findById(@PathVariable String id){
        return new ResponseEntity<>(semesterService.findById(id), HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SemesterResponse> updateDepartment(@PathVariable String id,@Valid @RequestBody SemesterRequest request){
        return new ResponseEntity<>(semesterService.update(id, request), HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<SemesterResponse> deleteDepartment(@PathVariable String id){
        semesterService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
