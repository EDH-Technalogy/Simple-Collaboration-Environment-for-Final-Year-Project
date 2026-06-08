package com.final_project.faculty_service.controllers;

import com.final_project.faculty_service.DTO.request.EmployeeRequest;
import com.final_project.faculty_service.DTO.response.DepartmentResponse;
import com.final_project.faculty_service.DTO.response.EmployeeResponse;
import com.final_project.faculty_service.DTO.response.PageResponse;
import com.final_project.faculty_service.services.EmployeeService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@AllArgsConstructor
@RestController
@RequestMapping("/api/employee")

public class EmployeeController {
    private final EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<PageResponse<EmployeeResponse>> findAll(Pageable pageable){

        return new ResponseEntity<>(employeeService.findAll(pageable), HttpStatus.OK);
    }

    @GetMapping("/search")
    public ResponseEntity<List<EmployeeResponse>> searchEmployees(@RequestParam("keyword") String keyword) {
        List<EmployeeResponse> results = employeeService.searchUniversities(keyword);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/faculty/{id}")
    public ResponseEntity<PageResponse<EmployeeResponse>> getAllEmployeeByFaculty(Pageable pageable, @PathVariable String id){
        return new ResponseEntity<>(employeeService.getEmployeesByFaculty(pageable, id), HttpStatus.OK);
    }
    @PostMapping("/profile/{id}")
    public ResponseEntity<EmployeeResponse> updateLogo(@PathVariable String id,
                                                         @RequestParam("file") MultipartFile profile){
        return new ResponseEntity<>(employeeService.updateProfile(id ,profile), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<EmployeeResponse> createDepartment(@Valid @RequestBody EmployeeRequest employeeRequest){
        return new ResponseEntity<>(employeeService.createEmployee(employeeRequest), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponse> findById(@PathVariable String id){
        return new ResponseEntity<>(employeeService.findById(id), HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeResponse> updateDepartment(@PathVariable String id,@Valid @RequestBody EmployeeRequest employeeRequest){
        return new ResponseEntity<>(employeeService.updateEmployee(id, employeeRequest), HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<EmployeeResponse> deleteDepartment(@PathVariable String id){
        employeeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
