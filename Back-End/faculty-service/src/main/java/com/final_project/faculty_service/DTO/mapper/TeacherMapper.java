package com.final_project.faculty_service.DTO.mapper;

import com.final_project.faculty_service.DTO.request.TeacherRequest;
import com.final_project.faculty_service.DTO.response.FacultyResponseInDepartment;
import com.final_project.faculty_service.DTO.response.TeacherDepartmentResponse;
import com.final_project.faculty_service.DTO.response.TeacherResponse;
import com.final_project.faculty_service.models.Department;
import com.final_project.faculty_service.models.Teacher;
import org.springframework.stereotype.Component;

@Component
public class TeacherMapper implements BaseMapper<TeacherRequest, TeacherResponse, Teacher> {
    @Override
    public Teacher toEntity(TeacherRequest request) {
        Teacher teacher = new Teacher();
        teacher.setFirstName(request.getFirstName());

        Department department = new Department();
        department.setId(request.getDepartment());

        teacher.setDepartment(department);
        teacher.setLastName(request.getLastName());
        teacher.setAddress(request.getAddress());
        teacher.setFatherName(request.getFatherName());
        teacher.setGrandFatherName(request.getGrandFatherName());
        teacher.setDateOfBirth(request.getDateOfBirth());
        teacher.setEnrollmentDate(request.getEnrollmentDate());
        teacher.setEmail(request.getEmail());
        teacher.setPhone(request.getPhone());
        teacher.setEducationRank(request.getEducationRank());
        teacher.setImageUrl(request.getProfileUrl());
        return teacher;
    }

    @Override
    public TeacherResponse toResponse(Teacher teacher) {
        TeacherResponse teacherResponse = new TeacherResponse();
        teacherResponse.setId(teacher.getId());
        teacherResponse.setFirstName(teacher.getFirstName());
        teacherResponse.setLastName(teacher.getLastName());
        teacherResponse.setAddress(teacher.getAddress());
        teacherResponse.setFatherName(teacher.getFatherName());
        teacherResponse.setGrandFatherName(teacher.getGrandFatherName());
        teacherResponse.setDateOfBirth(teacher.getDateOfBirth());
        teacherResponse.setEnrollmentDate(teacher.getEnrollmentDate());
        teacherResponse.setCreatedAt(teacher.getCreatedAt().toString());
        teacherResponse.setUpdatedAt(teacher.getCreatedAt().toString());
        teacherResponse.setCreatedBy(teacher.getCreatedBy());
        teacherResponse.setPhone(teacher.getPhone());
        teacherResponse.setEmail(teacher.getEmail());
        teacherResponse.setKeycloak(teacher.getKeycloakId());
        teacherResponse.setDepartment( new TeacherDepartmentResponse(
                teacher.getDepartment().getId(),
                teacher.getDepartment().getName(),
                teacher.getDepartment().getField(),
                new FacultyResponseInDepartment(
                        teacher.getDepartment().getFaculty().getId(),
                        teacher.getDepartment().getFaculty().getName(),
                        teacher.getDepartment().getFaculty().getEmail(),
                        teacher.getDepartment().getFaculty().getPhone(),
                        teacher.getDepartment().getFaculty().getCreatedBy()
                ),
                teacher.getDepartment().getCode(),
                teacher.getDepartment().getEmail(),
                teacher.getDepartment().getPhone()
                ));
        teacherResponse.setCode(teacher.getCode());
        teacherResponse.setPhotoUrl(teacher.getImageUrl());
        teacherResponse.setEducationRank(teacher.getEducationRank());
        return teacherResponse;
    }
}
