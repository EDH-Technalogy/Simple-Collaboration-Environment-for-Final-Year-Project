package com.final_project.faculty_service.services;

import com.final_project.faculty_service.DTO.RoleDTO;
import com.final_project.faculty_service.DTO.UserDto;
import com.final_project.faculty_service.DTO.mapper.EmployeeMapper;
import com.final_project.faculty_service.DTO.request.EmployeeRequest;
import com.final_project.faculty_service.DTO.request.SignupRequest;
import com.final_project.faculty_service.DTO.request.TeacherRequest;
import com.final_project.faculty_service.DTO.response.*;
import com.final_project.faculty_service.helper.Helper;
import com.final_project.faculty_service.models.Employee;
import com.final_project.faculty_service.models.Faculty;
import com.final_project.faculty_service.models.Student;
import com.final_project.faculty_service.models.Teacher;
import com.final_project.faculty_service.repository.EmployeeRepository;
import com.final_project.faculty_service.repository.FacultyRepository;
import com.final_project.faculty_service.services.exception.ResourceExist;
import com.final_project.faculty_service.services.exception.ResourceNotFoundException;
import com.final_project.faculty_service.services.exception.UserWithEmailExsit;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Set;

@Service
public class EmployeeService {
    private static final String EMPLOYEE_ROLE = "faculty-user";
    private static final String AUTHOR_ROLE = "AUTHOR_USER";

    private final EmployeeRepository employeeRepository;
    private final FacultyRepository facultyRepository;
    private final SequenceGeneratorService sequenceGeneratorService;
    private final EmployeeMapper employeeMapper;
    private final AuthService authService;
    private final WebClient fileWebClient;

    public EmployeeService(EmployeeRepository employeeRepository, FacultyRepository facultyRepository, SequenceGeneratorService sequenceGeneratorService, EmployeeMapper employeeMapper, AuthService authService, @Qualifier("fileServiceClient") WebClient fileWebClient) {
        this.employeeRepository = employeeRepository;
        this.facultyRepository = facultyRepository;
        this.sequenceGeneratorService = sequenceGeneratorService;
        this.employeeMapper = employeeMapper;
        this.authService = authService;
        this.fileWebClient = fileWebClient;
    }

    public PageResponse<EmployeeResponse> getEmployeesByFaculty(Pageable pageable, String id) {
        List<AggregationOperation> operations = List.of(
                Aggregation.match(
                        Criteria.where("isDeleted").is(false)
                                .and("faculty.$id").is(id)
                )
        );

        Page<Employee> employeePage = employeeRepository.findAllByAggregation(operations, pageable);

        List<EmployeeResponse> employeeResponses = employeePage
                .getContent()
                .stream()
                .map(employeeMapper::toResponse)
                .toList();

        return PageResponse.<EmployeeResponse>builder()
                .data(employeeResponses)
                .page(employeePage.getNumber())
                .size(employeePage.getSize())
                .totalElements(employeePage.getTotalElements())
                .totalPages(employeePage.getTotalPages())
                .last(employeePage.isLast())
                .build();
    }

    public PageResponse<EmployeeResponse> findAll(Pageable pageable) {
        Page<Employee> page = employeeRepository.findByIsDeletedIsFalse(pageable);

        List<EmployeeResponse> data = page.getContent()
                .stream()
                .filter(emp -> !emp.isDeleted())
                .map(employeeMapper::toResponse)
                .toList();

        return PageResponse.<EmployeeResponse>builder()
                .data(data)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(data.size()) // FIX: filtered size
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public EmployeeResponse updateProfile(String em, MultipartFile logo){
        Employee st = employeeRepository.findEmployeeByKeycloakIdAndIsDeletedIsFalse(em)
                .orElseThrow(() -> new ResourceNotFoundException("University Not Found with "+em));
        MultipartBodyBuilder bodyBuilder = new  MultipartBodyBuilder();
        bodyBuilder.part("file", logo.getResource());
        String updatedLogo =  fileWebClient.post()
                .uri("/file/employee/profile/{id}", st.getId())
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                .retrieve()
                .bodyToMono(String.class)
                .block();
        st.setImageUrl(updatedLogo);
        employeeRepository.save(st);
        authService.updateProfile(st.getKeycloakId(), updatedLogo);
        return employeeMapper.toResponse(st);
    }


    public EmployeeResponse findById(String id) {
        Employee employee = getEmployeeOrThrow(id);
        return employeeMapper.toResponse(employee);
    }


    public EmployeeResponse createEmployee(EmployeeRequest request) {
       boolean isExistByEmail =  employeeRepository.existsEmployeeByEmailAndIsDeletedIsFalse(request.getEmail())
                ;
       if (isExistByEmail){
           throw new UserWithEmailExsit("User with this email exist");
       }
       boolean isExistByPersonalInformation =  employeeRepository.existsEmployeeByFirstNameAndFatherNameAndLastName(
                request.getFirstName(),
                request.getFatherName(),
                request.getLastName()
        );
       if (isExistByPersonalInformation){
           throw new ResourceExist("user exist with this information");
       }

        Employee employee = employeeMapper.toEntity(request);
        Faculty faculty = facultyRepository.findByIdAndIsDeletedIsFalse(employee.getFaculty().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));
        SignupRequest signupRequest = mapToSignupRequest(request);
        UserDto response = authService.createUser(signupRequest);
        if(response.getId().isEmpty()){
            throw new ResourceNotFoundException("User couldn't save ");
        }
        authService.assignRoleToUser(response.getId(), EMPLOYEE_ROLE);
        authService.assignRoleToUser(response.getId(), AUTHOR_ROLE);
        long seq = sequenceGeneratorService.generateSequence("sequence_employee");
        String code = buildEmployeeCode(faculty, seq);
        employee.setCode(code);
        employee.setFaculty(faculty);
        employee.setKeycloakId(response.getId());
        Employee result = employeeRepository.save(employee);
        return employeeMapper.toResponse(result);
    }

    public EmployeeResponse updateEmployee(String id, EmployeeRequest request) {
        Employee employee = employeeRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        Employee mappedEmployee = employeeMapper.toEntity(request);

        Faculty faculty = getFacultyOrThrow(mappedEmployee.getFaculty().getId());
        mappedEmployee.setCode(employee.getCode());
        employee.setFaculty(faculty);
        mappedEmployee.setId(id);
        return employeeMapper.toResponse(employeeRepository.save(mappedEmployee));
    }
    public void delete(String id) {
        Employee employee = getEmployeeOrThrow(id);
        authService.deleteUser(employee.getKeycloakId());
        employee.setDeleted(true);
        employeeRepository.save(employee);
    }



    private Employee getEmployeeOrThrow(String id) {
        return employeeRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + id));
    }

    private Faculty getFacultyOrThrow(String facultyId) {
        return facultyRepository.findByIdAndIsDeletedIsFalse(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found: " + facultyId));
    }

    private String buildEmployeeCode(Faculty faculty, long seq) {
        String uniAbbr = Helper.generateAbbreviation(faculty.getUniversity().getName());
        String facAbbr = Helper.generateAbbreviation(faculty.getName());
        return "EMP-" + uniAbbr + "-" + facAbbr + "-" + seq;
    }

    private static SignupRequest mapToSignupRequest(EmployeeRequest request){
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setFirstName(request.getProfileUrl());
        signupRequest.setLastName(request.getLastName());
        signupRequest.setFirstName(request.getFirstName());
        signupRequest.setPassword(request.getPassword());
        signupRequest.setPrivacyAgreed(true);
        signupRequest.setUsername(request.getUserName());
        signupRequest.setTermsAgreed(true);
        signupRequest.setEmail(request.getEmail());
        signupRequest.setPhoneNumber(request.getPhone());
        signupRequest.setRoleNames(Set.of(EMPLOYEE_ROLE, AUTHOR_ROLE));
        return signupRequest;
    }

    public List<EmployeeResponse> searchUniversities(String keyword){
        List<Employee> employees = employeeRepository.searchByKeyword(keyword);
        return employees.stream()
                .map(employeeMapper::toResponse)
                .toList();
    }

}
