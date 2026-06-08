package com.final_project.faculty_service.DTO.mapper;

import com.final_project.faculty_service.DTO.request.StudentRequest;
import com.final_project.faculty_service.DTO.response.AcademicYearResponse;
import com.final_project.faculty_service.DTO.response.StudentDepartmentSemesterResponse;
import com.final_project.faculty_service.DTO.response.StudentResponse;
import com.final_project.faculty_service.DTO.response.StudentSemesterResponse;
import com.final_project.faculty_service.models.Department;
import com.final_project.faculty_service.models.Semester;
import com.final_project.faculty_service.models.Student;
import org.springframework.stereotype.Component;

@Component
public class StudentMapper implements BaseMapper<StudentRequest, StudentResponse, Student> {
    @Override
    public Student toEntity(StudentRequest studentRequest) {
        Student student = new Student();

        student.setFirstName(studentRequest.getFirstName());
        student.setFatherName(studentRequest.getFatherName());
        student.setGrandFatherName(studentRequest.getGrandFatherName());
        student.setLastName(studentRequest.getLastName());

        student.setNationality(studentRequest.getNationality());

        student.setGender(studentRequest.getGender());
        student.setDateOfBirth(studentRequest.getDateOfBirth());
        student.setAddress(studentRequest.getAddress());

        student.setEmail(studentRequest.getEmail());
        student.setPhone(studentRequest.getPhone());
        student.setCode(studentRequest.getCode());

        Department department = new Department();
        department.setId(studentRequest.getDepartment());
        student.setDepartment(department);

        Semester semester = new Semester();
        semester.setId(studentRequest.getSemester());
        student.setSemester(semester);
        student.setEnrollmentDate(studentRequest.getEnrollmentDate());
        student.setKankorId(studentRequest.getKankorId());
        student.setProfilePicture(studentRequest.getProfilePicture());
        student.setStatus(studentRequest.getStatus());
        return student;
    }

    @Override
    public StudentResponse toResponse(Student student) {

        StudentResponse studentResponse  = new StudentResponse();
        studentResponse.setKeycloak(student.getKeycloakId());
        studentResponse.setId(student.getId());
        studentResponse.setFirstName(student.getFirstName());
        studentResponse.setFatherName(student.getFatherName());
        studentResponse.setGrandFatherName(student.getGrandFatherName());
        studentResponse.setLastName(student.getLastName());
        studentResponse.setCode(student.getCode());
        studentResponse.setNationality(student.getNationality());
        studentResponse.setGender(student.getGender());
        studentResponse.setDateOfBirth(student.getDateOfBirth());
        studentResponse.setAddress(student.getAddress());
        studentResponse.setPhotoUrl(student.getProfilePicture());
        studentResponse.setEmail(student.getEmail());
        studentResponse.setPhone(student.getPhone());

        studentResponse.setEnrollmentDate(student.getEnrollmentDate());
        studentResponse.setKankorId(student.getKankorId());
        studentResponse.setPhotoUrl(student.getProfilePicture());

        studentResponse.setSemester(new StudentSemesterResponse(
                new AcademicYearResponse(
                       student.getSemester().getAcademicYear().getId(),
                        student.getSemester().getAcademicYear().getName(),
                        student.getSemester().getAcademicYear().getStartDate(),
                        student.getSemester().getAcademicYear().getEndDate(),
                        student.getSemester().getAcademicYear().getCalendarType()
                        ),
                student.getSemester().getType(),
                student.getSemester().getName(),
                student.getSemester().getStartDate(),
                student.getSemester().getEndDate(),
                student.getSemester().getCode()

        ));

        studentResponse.setDepartment(
                new StudentDepartmentSemesterResponse(
                        student.getDepartment().getId(),
                        student.getDepartment().getName(),
                        student.getDepartment().getField(),
                        student.getDepartment().getCode(),
                        student.getDepartment().getEmail()
                )
        );
        studentResponse.setStatus(student.getStatus());
        return studentResponse;
    }
}
