package com.final_project.faculty_service.controllers;


import com.final_project.faculty_service.DTO.response.PageResponse;
import com.final_project.faculty_service.DTO.request.UniversityRequest;
import com.final_project.faculty_service.DTO.response.UniversityResponse;
import com.final_project.faculty_service.services.UniversityService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/university")
public class UniversityController {
    private final UniversityService universityService;

    @PostMapping
    public ResponseEntity<UniversityResponse> createUniversity(@Valid @RequestBody UniversityRequest university){
        return new ResponseEntity<>(universityService.createUniversity(university), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<PageResponse<UniversityResponse>> getAllUniversity(Pageable pageable){
        return ResponseEntity.ok(universityService.findAll(pageable));
    }
    @GetMapping("/{id}")
    public ResponseEntity<UniversityResponse> getUniversity(@PathVariable String id){
        return ResponseEntity.ok(universityService.findById(id));
    }
    @PutMapping("/{id}")
    public ResponseEntity<UniversityResponse>  updateUniversity(@PathVariable String id,@Valid @RequestBody UniversityRequest university){
        return ResponseEntity.ok(universityService.updateUniversity(id,university));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUniversity(@PathVariable String  id){
        universityService.deleteUniversity(id);
        return  ResponseEntity.noContent().build();
    }
//    api/university/search?keyword=tech
//    this should also return like paginated data
    @GetMapping("/search")
    public ResponseEntity<List<UniversityResponse>> searchUniversity(@RequestParam String keyword){
        return ResponseEntity.ok(universityService.searchUniversities(keyword));
    }

    @PutMapping("/{id}/logo")
    public ResponseEntity<UniversityResponse> updateLogo(@PathVariable String id, @RequestParam("file") MultipartFile logo){
        return ResponseEntity.ok(universityService.updateLogo(id, logo));
    }
    @GetMapping("/{id}/logo/download")
    public ResponseEntity<byte[]> downloadLogo(@PathVariable String id){
        return ResponseEntity.ok(universityService.downloadLogo(id));
    }
    @DeleteMapping("/{id}/logo")
    public ResponseEntity<Void> deleteLogo(@PathVariable String id){
        universityService.deleteLogo(id);
        return  ResponseEntity.noContent().build();
    }
}
