package com.final_project.faculty_service.controllers;

import com.final_project.faculty_service.DTO.request.AcademicYearRequest;
import com.final_project.faculty_service.DTO.response.AcademicYearResponse;
import com.final_project.faculty_service.DTO.response.PageResponse;
import com.final_project.faculty_service.services.AcademicYearService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@AllArgsConstructor
@RequestMapping("/api/academic-year")
public class AcademicYearController {
    private final AcademicYearService academicYearService;
    @GetMapping
    public ResponseEntity<PageResponse<AcademicYearResponse>> findAll(Pageable pageable){
        return new ResponseEntity<>(academicYearService.findAll(pageable), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<AcademicYearResponse> create(@Valid @RequestBody AcademicYearRequest request){
        return new ResponseEntity<>(academicYearService.create(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AcademicYearResponse> findById(@PathVariable String id){
        return new ResponseEntity<>(academicYearService.findById(id), HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AcademicYearResponse> update(@PathVariable String id,@Valid @RequestBody AcademicYearRequest request){
        return new ResponseEntity<>(academicYearService.update(id, request), HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id){
        academicYearService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
