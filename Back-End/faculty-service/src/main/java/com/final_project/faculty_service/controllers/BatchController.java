package com.final_project.faculty_service.controllers;

import com.final_project.faculty_service.DTO.request.BatchRequest;
import com.final_project.faculty_service.DTO.response.BatchResponse;
import com.final_project.faculty_service.DTO.response.PageResponse;
import com.final_project.faculty_service.services.BatchService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/batch")
@AllArgsConstructor
public class BatchController {
    private BatchService batchService;

    @GetMapping
    public ResponseEntity<PageResponse<BatchResponse>> findAll(Pageable pageable){
        return new ResponseEntity<>(batchService.findAll(pageable), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<BatchResponse> createDepartment(@Valid @RequestBody BatchRequest request){
        return new ResponseEntity<>(batchService.create(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BatchResponse> findById(@PathVariable String id){
        return new ResponseEntity<>(batchService.findById(id), HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BatchResponse> updateDepartment(@PathVariable String id,@Valid @RequestBody BatchRequest request){
        return new ResponseEntity<>(batchService.update(id, request), HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<BatchResponse> deleteDepartment(@PathVariable String id){
        batchService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
