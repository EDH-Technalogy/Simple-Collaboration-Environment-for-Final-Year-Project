package com.final_project.faculty_service.DTO.mapper;

import com.final_project.faculty_service.DTO.request.EmployeeRequest;
import com.final_project.faculty_service.DTO.response.EmployeeResponse;
import com.final_project.faculty_service.DTO.response.FacultyResponseEmployee;
import com.final_project.faculty_service.models.Employee;
import com.final_project.faculty_service.models.Faculty;
import org.springframework.stereotype.Component;

@Component
public class EmployeeMapper implements BaseMapper<EmployeeRequest, EmployeeResponse, Employee> {
    @Override
    public Employee toEntity(EmployeeRequest request) {
        Employee employee = new Employee();

        employee.setCode(request.getCode());
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setFatherName(request.getFatherName());
        employee.setGrandFatherName(request.getGrandFatherName());
        employee.setEmail(request.getEmail());
        employee.setPhone(request.getPhone());
        employee.setHireDate(request.getHireDate());
        employee.setEducationRank(request.getEducationRank());
        employee.setFacultyPosition(request.getFacultyPosition());
        employee.setAddress(request.getAddress());

        Faculty faculty = new Faculty();
        faculty.setId(request.getFaculty());
        employee.setFaculty(faculty);
        return employee;
    }

    @Override
    public EmployeeResponse toResponse(Employee employee) {
        EmployeeResponse res = new EmployeeResponse();
        res.setKeycloak(employee.getKeycloakId());
        res.setId(employee.getId());
        res.setCode(employee.getCode());
        res.setFirstName(employee.getFirstName());
        res.setLastName(employee.getLastName());
        res.setFatherName(employee.getFatherName());
        res.setGrandFatherName(employee.getGrandFatherName());
        res.setEmail(employee.getEmail());
        res.setPhone(employee.getPhone());
        res.setAddress(employee.getAddress());
        res.setFaculty(toFacultyResponse(employee.getFaculty()));
        res.setEducationRank(employee.getEducationRank());
        res.setFacultyPosition(employee.getFacultyPosition());
        res.setHireDate(employee.getHireDate());
        res.setPhotoUrl(employee.getImageUrl());
        return res;
    }

    private FacultyResponseEmployee toFacultyResponse(Faculty faculty) {
        if (faculty == null) {
            return null;
        }
        FacultyResponseEmployee response = new FacultyResponseEmployee();
        response.setId(faculty.getId());
        response.setName(faculty.getName());
        response.setCode(faculty.getCode());
        response.setEmail(faculty.getEmail());
        response.setPhone(faculty.getPhone());
        response.setShortName(faculty.getShortName());
        if (faculty.getUniversity() != null) {
            response.setUniversity(faculty.getUniversity().getName());
        }
        return response;
    }
}
