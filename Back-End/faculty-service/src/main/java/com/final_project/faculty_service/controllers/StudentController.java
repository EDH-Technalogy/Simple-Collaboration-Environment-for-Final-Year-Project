package com.final_project.faculty_service.controllers;

import com.final_project.faculty_service.DTO.request.StudentRequest;
import com.final_project.faculty_service.DTO.response.EmployeeResponse;
import com.final_project.faculty_service.DTO.response.PageResponse;
import com.final_project.faculty_service.DTO.response.StudentResponse;
import com.final_project.faculty_service.services.StudentService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/student")
@AllArgsConstructor
@CrossOrigin
public class StudentController {
    private StudentService studentService;
    @GetMapping
    public ResponseEntity<PageResponse<StudentResponse>> getAll(Pageable pageable){
        return ResponseEntity.ok(studentService.findAll(pageable));
    }

    @GetMapping("/faculty/{id}")
    public ResponseEntity<PageResponse<StudentResponse>> getStudentsByFaculty(Pageable pageable,@PathVariable String id){
        return ResponseEntity.ok(studentService.getStudentsByFaculty(pageable, id));
    }

    @PostMapping("/profile/{id}")
    public ResponseEntity<StudentResponse> updateLogo(@PathVariable String id,
                                                       @RequestParam("file") MultipartFile profile){
        return new ResponseEntity<>(studentService.updateProfile(id ,profile), HttpStatus.OK);
    }
    @PostMapping
    public ResponseEntity<StudentResponse> create(@Valid @RequestBody StudentRequest request){
        return new ResponseEntity<>(studentService.create(request), HttpStatus.CREATED);
    }

    @GetMapping("/search")
    public ResponseEntity<List<StudentResponse>> searchStudents(@RequestParam("keyword") String keyword) {
        // Assuming your service method is named searchStudents
        List<StudentResponse> results = studentService.searchStudent(keyword);
        return ResponseEntity.ok(results);
    }
    @GetMapping("/{id}")
    public ResponseEntity<StudentResponse> getById(@PathVariable String  id){
        return new ResponseEntity<>(studentService.findById(id), HttpStatus.OK);
    }
    @PutMapping("/{id}")
    public ResponseEntity<StudentResponse> update(@PathVariable String id,@Valid  @RequestBody StudentRequest request){
        return new ResponseEntity<>(studentService.update(id, request), HttpStatus.OK);
    }
    @PutMapping("/user/{id}")
    public ResponseEntity<StudentResponse> getStudentByKeycloakId(@PathVariable String id){
        return new ResponseEntity<>(studentService.getStudentByKeycloak(id), HttpStatus.OK);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id){
        studentService.delete(id);
        return  ResponseEntity.noContent().build();
    }
}
