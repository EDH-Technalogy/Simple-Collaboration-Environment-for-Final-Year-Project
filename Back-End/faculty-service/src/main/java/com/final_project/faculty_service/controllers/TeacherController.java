package com.final_project.faculty_service.controllers;

import com.final_project.faculty_service.DTO.request.TeacherRequest;
import com.final_project.faculty_service.DTO.response.EmployeeResponse;
import com.final_project.faculty_service.DTO.response.PageResponse;
import com.final_project.faculty_service.DTO.response.TeacherResponse;
import com.final_project.faculty_service.services.TeacherService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/teacher")
@AllArgsConstructor
public class TeacherController {
    private final TeacherService teacherService;
    @GetMapping
    public ResponseEntity<PageResponse<TeacherResponse>> findAll(Pageable pageable){
        return new ResponseEntity<>(teacherService.findAll(pageable), HttpStatus.OK);
    }

    @GetMapping("/faculty/{id}")
    public ResponseEntity<PageResponse<TeacherResponse>> getAllTeacherByFaculty(Pageable pageable, @PathVariable String id){
        return new ResponseEntity<>(teacherService.getTeachersByFaculty(pageable, id), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<TeacherResponse> create(@Valid @RequestBody TeacherRequest request){
        return new ResponseEntity<>(teacherService.create(request), HttpStatus.CREATED);
    }

    @PostMapping("/profile/{id}")
    public ResponseEntity<TeacherResponse> updateLogo(@PathVariable String id,
                                                       @RequestParam("file") MultipartFile profile){
        return new ResponseEntity<>(teacherService.updateProfile(id ,profile), HttpStatus.OK);
    }


    @GetMapping("/{id}")
    public ResponseEntity<TeacherResponse> findById(@PathVariable String id){
        return new ResponseEntity<>(teacherService.findById(id), HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeacherResponse> update(@PathVariable String id,@Valid @RequestBody TeacherRequest request){
        return new ResponseEntity<>(teacherService.update(id, request), HttpStatus.OK);
    }

    @GetMapping("/search")
    public ResponseEntity<List<TeacherResponse>> searchTeachers(@RequestParam("keyword") String keyword) {

        List<TeacherResponse> results = teacherService.searchTeacher(keyword);
        return ResponseEntity.ok(results);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id){
        teacherService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

