package com.final_project.faculty_service.controllers;

import com.final_project.faculty_service.DTO.request.DepartmentRequest;
import com.final_project.faculty_service.DTO.response.DepartmentResponse;
import com.final_project.faculty_service.DTO.response.PageResponse;
import com.final_project.faculty_service.services.DepartmentService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/department")
@AllArgsConstructor
public class DepartmentController {
    private final DepartmentService  departmentService;

    @GetMapping
    public ResponseEntity<PageResponse<DepartmentResponse>> findAll(Pageable pageable){
        return new ResponseEntity<>(departmentService.findAll(pageable), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<DepartmentResponse> createDepartment(@Valid @RequestBody DepartmentRequest departmentRequest){
        return new ResponseEntity<>(departmentService.createDepartment(departmentRequest), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DepartmentResponse> findById(@PathVariable String id){
        return new ResponseEntity<>(departmentService.findById(id), HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DepartmentResponse> updateDepartment(@PathVariable String id,@Valid @RequestBody DepartmentRequest departmentRequest){
        return new ResponseEntity<>(departmentService.updateDepartment(id, departmentRequest), HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<DepartmentResponse> deleteDepartment(@PathVariable String id){
        departmentService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logo/{id}")
    public ResponseEntity<DepartmentResponse> updateLogo(@PathVariable String id,
                                                         @RequestParam("file") MultipartFile logo){
        return new ResponseEntity<>(departmentService.updateLogo(id ,logo), HttpStatus.OK);
    }
}
