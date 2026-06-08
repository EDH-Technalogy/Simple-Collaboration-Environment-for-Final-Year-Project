package com.final_project.faculty_service.DTO.mapper;

import com.final_project.faculty_service.DTO.request.DepartmentRequest;
import com.final_project.faculty_service.DTO.response.DepartmentResponse;
import com.final_project.faculty_service.DTO.response.EmployeeResponseInFaculty;
import com.final_project.faculty_service.DTO.response.FacultyResponseInDepartment;
import com.final_project.faculty_service.models.Department;
import com.final_project.faculty_service.models.Employee;
import com.final_project.faculty_service.models.Faculty;
import org.springframework.stereotype.Component;

@Component
public class  DepartmentMapper implements BaseMapper<DepartmentRequest, DepartmentResponse, Department> {
    @Override
    public Department toEntity(DepartmentRequest departmentRequest) {
        Department currentDepartment = new  Department();
        return getDepartment(departmentRequest, currentDepartment);
    }

    private  Department getDepartment(DepartmentRequest departmentRequest, Department currentDepartment) {
        currentDepartment.setShortName(departmentRequest.getShortName());

        Faculty faculty = new Faculty();
        faculty.setId(departmentRequest.getFaculty());
        currentDepartment.setFaculty(faculty);


        Employee employee = new Employee();
        employee.setId(departmentRequest.getHeadOfDepartment());
        currentDepartment.setHeadOfDepartment(employee);

        currentDepartment.setName(departmentRequest.getName());
        currentDepartment.setField(departmentRequest.getField());
        currentDepartment.setDescription(departmentRequest.getDescription());
        currentDepartment.setEmail(departmentRequest.getEmail());
        currentDepartment.setPhone(departmentRequest.getPhone());
        currentDepartment.setShortName(departmentRequest.getShortName());
        currentDepartment.setCode(departmentRequest.getCode());
        return  currentDepartment;
    }

    @Override
    public DepartmentResponse toResponse(Department department) {
        DepartmentResponse departmentResponse = exchangeDepartment(department);
        departmentResponse.setFaculty(new FacultyResponseInDepartment(
                department.getId(),
                department.getName(),
                department.getEmail(),
                department.getPhone(),
                department.getCreatedAt().toString()
        ));
        departmentResponse.setHeadOfDepartment(
                new EmployeeResponseInFaculty(
                        department.getHeadOfDepartment().getId(),
                        department.getHeadOfDepartment().getFirstName(),
                        department.getHeadOfDepartment().getLastName(),
                        department.getHeadOfDepartment().getEmail(),
                        department.getHeadOfDepartment().getPhone(),
                        department.getHeadOfDepartment().getEducationRank(),
                        department.getHeadOfDepartment().getFacultyPosition()

                ));
        return departmentResponse;
    }

    private  DepartmentResponse exchangeDepartment(Department department) {
        DepartmentResponse departmentResponse = new DepartmentResponse();
        departmentResponse.setDescription(department.getDescription());
        departmentResponse.setName(department.getName());
        departmentResponse.setShortName(department.getShortName());
        departmentResponse.setCode(department.getCode());
        departmentResponse.setPhone(department.getPhone());
        departmentResponse.setEmail(department.getEmail());
        departmentResponse.setName(department.getName());
        departmentResponse.setField(department.getField());
        departmentResponse.setId(department.getId());
        departmentResponse.setCreatedAt(department.getCreatedBy());
        departmentResponse.setUpdateAt(department.getUpdatedAt().toString());
        departmentResponse.setCreatedBy(department.getCreatedBy());


        return departmentResponse;
    }
}
