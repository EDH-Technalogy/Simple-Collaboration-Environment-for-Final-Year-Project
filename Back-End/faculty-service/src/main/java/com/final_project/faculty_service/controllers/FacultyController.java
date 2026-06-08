package com.final_project.faculty_service.controllers;


import com.final_project.faculty_service.DTO.request.FacultyRequest;
import com.final_project.faculty_service.DTO.response.DepartmentResponse;
import com.final_project.faculty_service.DTO.response.FacultyResponse;
import com.final_project.faculty_service.DTO.response.PageResponse;
import com.final_project.faculty_service.services.FacultyService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


@RequestMapping("/api/faculty")
@RestController
@AllArgsConstructor
public class FacultyController {

    private final FacultyService facultyService;

    @GetMapping
    public ResponseEntity<PageResponse<FacultyResponse>> getAllFaculty(Pageable pageable){
        return ResponseEntity.ok(facultyService.findAll(pageable));
    }
    @PostMapping
    public ResponseEntity<FacultyResponse> createFaculty(@Valid @RequestBody FacultyRequest faculty){
        return new ResponseEntity<>(facultyService.createFaculty(faculty), HttpStatus.CREATED);
    }

    @PostMapping("/logo/{id}")
    public ResponseEntity<FacultyResponse> updateLogo(@PathVariable String id,
                                                         @RequestParam("file") MultipartFile logo){
        return new ResponseEntity<>(facultyService.updateLogo(id ,logo), HttpStatus.OK);
    }
    @GetMapping("/{id}")
    public ResponseEntity<FacultyResponse> getFacultyById(@Valid @PathVariable String  id){
        return new ResponseEntity<>(facultyService.findById(id), HttpStatus.OK);
    }
    @PutMapping("/{id}")
    public ResponseEntity<FacultyResponse> updateFaculty(@PathVariable String id,  @RequestBody FacultyRequest faculty){
        return new ResponseEntity<>(facultyService.updateFaculty(id, faculty), HttpStatus.OK);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFaculty(@PathVariable String id){
        facultyService.deleteFaculty(id);
       return  ResponseEntity.noContent().build();
    }
    @GetMapping("/university/{id}")
    public ResponseEntity<PageResponse<FacultyResponse>> facultyByUniversity(@PathVariable String  id,  Pageable pageable){
        return ResponseEntity.ok(facultyService.findAllByUniversity(id, pageable)) ;
    }

}
