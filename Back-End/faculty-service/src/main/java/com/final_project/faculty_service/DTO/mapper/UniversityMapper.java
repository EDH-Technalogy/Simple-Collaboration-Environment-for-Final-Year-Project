package com.final_project.faculty_service.DTO.mapper;

import com.final_project.faculty_service.DTO.request.UniversityRequest;
import com.final_project.faculty_service.DTO.response.AddressResponse;
import com.final_project.faculty_service.DTO.response.UniversityResponse;
import com.final_project.faculty_service.models.Address;
import com.final_project.faculty_service.models.University;
import org.springframework.stereotype.Component;

@Component
public class UniversityMapper implements BaseMapper<UniversityRequest, UniversityResponse, University> {

    @Override
    public University toEntity(UniversityRequest request) {
        University university = new University();
        university.setName(request.getName());
        university.setEmail(request.getEmail());
        university.setShortName(request.getName().toLowerCase());
        university.setLogo(request.getLogo());
        university.setCode(request.getCode());
        university.setEstablishYear(request.getEstablishYear());
        university.setAddress(new Address(
                request.getAddress().getCity(),
                request.getAddress().getCountry(),
                request.getAddress().getStreet(),
                request.getAddress().getZip()));
        return university;
    }

    @Override
    public UniversityResponse toResponse(University university) {
        UniversityResponse universityResponse = new UniversityResponse();
        universityResponse.setName(university.getName());
        universityResponse.setId(university.getId());
        universityResponse.setEmail(university.getEmail());
        universityResponse.setLogo(university.getLogo());
        universityResponse.setEstablishYear(university.getEstablishYear());
        universityResponse.setCode(university.getCode());
        universityResponse.setShortName(university.getShortName());
        university.setUpdatedAt(university.getUpdatedAt());
        universityResponse.setCreatedAt(university.getCreatedAt());
        university.setCreatedBy(university.getCreatedBy());
        universityResponse.setAddress(new AddressResponse(
                university.getAddress().getCity(),
                university.getAddress().getCountry(),
                university.getAddress().getStreet(),
                university.getAddress().getZip()));
        return universityResponse;
    }
}
