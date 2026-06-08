package com.final_project.faculty_service.services;

import com.final_project.faculty_service.DTO.mapper.UniversityMapper;
import com.final_project.faculty_service.DTO.request.UniversityRequest;
import com.final_project.faculty_service.DTO.response.AddressResponse;
import com.final_project.faculty_service.DTO.response.PageResponse;
import com.final_project.faculty_service.DTO.response.UniversityResponse;
import com.final_project.faculty_service.models.Address;
import com.final_project.faculty_service.models.University;
import com.final_project.faculty_service.repository.FacultyRepository;
import com.final_project.faculty_service.repository.UniversityRepository;
import com.final_project.faculty_service.services.exception.ResourceBadRequest;
import com.final_project.faculty_service.services.exception.ResourceNotFoundException;
import com.final_project.faculty_service.utils.FileServiceStorage;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UniversityService {
    private final UniversityRepository universityRepository;
    private final SequenceGeneratorService sequenceGeneratorService;
    private final UniversityMapper universityMapper;
    private final WebClient fileWebClient;

    public UniversityService(
            UniversityRepository universityRepository,
            SequenceGeneratorService sequenceGeneratorService,
            UniversityMapper universityMapper,
            @Qualifier("fileServiceClient") WebClient fileWebClient
    ) {
        this.universityRepository = universityRepository;
        this.sequenceGeneratorService = sequenceGeneratorService;
        this.universityMapper = universityMapper;
        this.fileWebClient = fileWebClient;
    }
    public PageResponse<UniversityResponse> findAll(Pageable pageable){
        Page<University> universityPage = universityRepository.findByIsDeletedIsFalse(pageable);
        List<UniversityResponse> uns = universityPage.getContent()
                .stream()
                .map((universityMapper::toResponse))
                .toList();

        return PageResponse.<UniversityResponse>builder()
                .data(uns)
                .page(universityPage.getNumber())
                .size(universityPage.getSize())
                .totalElements(universityPage.getTotalElements())
                .totalPages(universityPage.getTotalPages())
                .last(universityPage.isLast())
                .build();
    }

    public UniversityResponse createUniversity(UniversityRequest request){
        University un = new University();

        long seq = sequenceGeneratorService.generateSequence("university_seq");
        request.setCode("UN-" + request.getShortName().substring(0,2).toUpperCase()+"-"+ seq);
       University saved =  universityRepository.save(universityMapper.toEntity(request));
       return universityMapper.toResponse(saved);
    }

    public UniversityResponse findById(String id){
          University university = universityRepository.findByIdAndIsDeletedIsFalse(id)
                  .orElseThrow(() -> new ResourceNotFoundException("university Not Found with "+ id));
          return universityMapper.toResponse(university);
    }



    public UniversityResponse updateUniversity(String id,  UniversityRequest request){
        University un = universityRepository.findByIdAndIsDeletedIsFalse(id)
                        .orElseThrow(() -> new ResourceNotFoundException("University Not Found with "+ id));
        University mappedUniversity =  universityMapper.toEntity(request);
        mappedUniversity.setId(un.getId());
        mappedUniversity.setCode(un.getCode());
        mappedUniversity.setName(un.getName());
        mappedUniversity.setShortName(un.getShortName());
        return universityMapper.toResponse(universityRepository.save(mappedUniversity));
    }

    public void   deleteUniversity(String id){
        University university = universityRepository.findByIdAndIsDeletedIsFalse(id)
                        .orElseThrow(() -> new  ResourceNotFoundException("University Not Found with "+ id));
        university.setDeleted(true);
        universityRepository.save(university);
    }

    public List<UniversityResponse> searchUniversities(String keyword){
        List<University> universities = universityRepository.searchByNameOrAddressAndDeletedIsFalse(keyword);
        return universities.stream()
                .map(universityMapper::toResponse)
                .toList();
    }
    public UniversityResponse updateLogo(String university, MultipartFile logo){
       University un = universityRepository.findByIdAndIsDeletedIsFalse(university)
               .orElseThrow(() -> new ResourceNotFoundException("University Not Found with "+university));
        MultipartBodyBuilder bodyBuilder = new  MultipartBodyBuilder();
        bodyBuilder.part("file", logo.getResource());

       String updatedLogo =  fileWebClient.post()
                        .uri("/file/university/logo/{id}", un.getId())
                        .contentType(MediaType.MULTIPART_FORM_DATA)
                        .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();
        un.setLogo(updatedLogo);
        universityRepository.save(un);
        return universityMapper.toResponse(un);
    }
    public void  deleteLogo(String university){
        University un = universityRepository.findByIdAndIsDeletedIsFalse(university)
                .orElseThrow(() -> new ResourceNotFoundException("University Not Found with "+university));
        fileWebClient.delete()
                .uri("/file/university/logo/{id}", un.getId())
                        .retrieve()
                                .onStatus(HttpStatusCode::isError, res ->
                                        res.bodyToMono(String.class)
                                                .map(error -> new ResourceBadRequest("Error Not Deleting Logo"))
                                        );
        un.setLogo("");
        universityRepository.save(un);
    }
    public byte[] downloadLogo(String id){
        University un = universityRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("University Not Found with "+id));
        byte[] content =  fileWebClient.get()
                .uri("/file/university/logo/{id}/download", un.getId())

                .retrieve().bodyToMono(byte[].class)
                        .block();
       return content;
    }






}
