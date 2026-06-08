package com.final_project.faculty_service.services;

import com.final_project.faculty_service.DTO.RoleDTO;
import com.final_project.faculty_service.DTO.UserDto;
import com.final_project.faculty_service.DTO.mapper.StudentMapper;
import com.final_project.faculty_service.DTO.request.SignupRequest;
import com.final_project.faculty_service.DTO.request.StudentRequest;
import com.final_project.faculty_service.DTO.response.AuthResponse;
import com.final_project.faculty_service.DTO.response.PageResponse;
import com.final_project.faculty_service.DTO.response.StudentResponse;
import com.final_project.faculty_service.DTO.response.UniversityResponse;
import com.final_project.faculty_service.helper.Helper;
import com.final_project.faculty_service.models.*;
import com.final_project.faculty_service.repository.BatchRepository;
import com.final_project.faculty_service.repository.DepartmentRepository;
import com.final_project.faculty_service.repository.SemesterRepository;
import com.final_project.faculty_service.repository.StudentRepository;
import com.final_project.faculty_service.services.exception.ResourceExist;
import com.final_project.faculty_service.services.exception.ResourceNotFoundException;
import com.final_project.faculty_service.services.exception.UserWithEmailExsit;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class StudentService {
    private static final String STUDENT_ROLE = "student-user";
    private static final String AUTHOR_ROLE = "AUTHOR_USER";

    private final AuthService authService;
    private final StudentRepository studentRepository;
    private final SemesterRepository   semesterRepository;
    private final DepartmentRepository departmentRepository;
    private final SequenceGeneratorService sequenceGeneratorService;
    private final BatchRepository batchRepository;
    private final StudentMapper studentMapper;
    private final WebClient fileWebClient;

    public StudentService(AuthService authService, StudentRepository studentRepository, SemesterRepository semesterRepository, DepartmentRepository departmentRepository, SequenceGeneratorService sequenceGeneratorService, BatchRepository batchRepository, StudentMapper studentMapper, @Qualifier("fileServiceClient") WebClient fileWebClient) {
        this.authService = authService;
        this.studentRepository = studentRepository;
        this.semesterRepository = semesterRepository;
        this.departmentRepository = departmentRepository;
        this.sequenceGeneratorService = sequenceGeneratorService;
        this.batchRepository = batchRepository;
        this.studentMapper = studentMapper;
        this.fileWebClient = fileWebClient;
    }
    public PageResponse<StudentResponse> findAll(Pageable pageable) {
        Page<Student> studentPage = studentRepository.findByIsDeletedIsFalse(pageable);
        List<StudentResponse> studentResponses = studentPage
                .getContent()
                .stream()
                .map(studentMapper::toResponse)
                .toList();
        return PageResponse.<StudentResponse>builder()
                .data(studentResponses)
                .page(studentPage.getNumber())
                .size(studentPage.getSize())
                .totalElements(studentPage.getTotalElements())
                .totalPages(studentPage.getTotalPages())
                .last(studentPage.isLast())
                .build();
    }

    public PageResponse<StudentResponse> getStudentsByFaculty(Pageable pageable, String id) {
        List<AggregationOperation> operations = List.of(
                Aggregation.lookup(
                        "department",
                        "department.$id",
                        "_id",
                        "departmentData"
                ),
                Aggregation.unwind("departmentData"),
                Aggregation.match(
                        Criteria.where("isDeleted").is(false)
                                .and("departmentData.isDeleted").is(false)
                                .and("departmentData.faculty.$id").is(id)
                )
        );

        Page<Student> studentPage = studentRepository.findAllByAggregation(operations, pageable);

        List<StudentResponse> studentResponses = studentPage
                .getContent()
                .stream()
                .map(studentMapper::toResponse)
                .toList();

        return PageResponse.<StudentResponse>builder()
                .data(studentResponses)
                .page(studentPage.getNumber())
                .size(studentPage.getSize())
                .totalElements(studentPage.getTotalElements())
                .totalPages(studentPage.getTotalPages())
                .last(studentPage.isLast())
                .build();
    }
    public StudentResponse update(String id , StudentRequest studentRequest){
        Student currentStudent = studentRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        Student mappedStudent = studentMapper.toEntity(studentRequest);
        Department currentDepartment = departmentRepository.findByIdAndIsDeletedIsFalse(mappedStudent.getDepartment().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        Semester semester = semesterRepository.findByIdAndIsDeletedIsFalse(mappedStudent.getSemester().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Semester not found"));
        mappedStudent.setDepartment(currentDepartment);
        mappedStudent.setId(id);
        mappedStudent.setSemester(semester);
        mappedStudent.setBatch(currentStudent.getBatch());
        mappedStudent.setCode(currentStudent.getCode());
        studentRepository.save(mappedStudent);
        return studentMapper.toResponse(mappedStudent);
    }

    public StudentResponse findById(String id){
        Student current = studentRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        return studentMapper.toResponse(current);
    }

    public  StudentResponse getStudentByKeycloak(String userId){
        Student student = studentRepository.findStudentByKeycloakId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        return studentMapper.toResponse(student);
    }
    public StudentResponse create(StudentRequest studentRequest){
        boolean isExistByEmail =   studentRepository.existsStudentByEmailAndIsDeletedIsFalse(studentRequest.getEmail());
        if (isExistByEmail){
            throw new UserWithEmailExsit("User with this email Exist");
        }

        boolean isExistByPersonalInformation = studentRepository.existsStudentByFirstNameAndFatherNameAndLastName(
                studentRequest.getFirstName(),
                studentRequest.getFatherName(),
                studentRequest.getLastName()
                );
        if (isExistByPersonalInformation){
            throw new ResourceExist("User with this information exsit");
        }

        Semester seme = semesterRepository.findByIdAndIsDeletedIsFalse(studentRequest.getSemester())
                .orElseThrow(() -> new ResourceNotFoundException("Semester not found"));
        Department dep =  departmentRepository.findByIdAndIsDeletedIsFalse(studentRequest.getDepartment())
                .orElseThrow(() ->  new ResourceNotFoundException("Department not found"));
        Batch batch = batchRepository.findByIdAndIsDeletedIsFalse(studentRequest.getBatch())
                .orElseThrow(() ->  new ResourceNotFoundException("Batch not found"));
        SignupRequest signupRequest = getSignupRequest(studentRequest);
        UserDto response = authService.createUser(signupRequest);
        if(response.getId().isEmpty()){
            throw new ResourceNotFoundException("User couldn't save ");
        }
        authService.assignRoleToUser(response.getId(), STUDENT_ROLE);
        authService.assignRoleToUser(response.getId(), AUTHOR_ROLE);

        long seq = sequenceGeneratorService.generateSequence("sequence_student");
        Student student = studentMapper.toEntity(studentRequest);
        student.setKeycloakId(response.getId());
        String abb = Helper.generateAbbreviation(dep.getFaculty().getName());

        student.setBatch(batch);
        student.setSemester(seme);
        student.setDepartment(dep);
        student.setCode(abb +"-" + batch.getName()+"-"+ seq);

        Student result = studentRepository.save(student);

        return studentMapper.toResponse(result);
    }

    private static SignupRequest getSignupRequest(StudentRequest studentRequest) {
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setProfile(studentRequest.getProfilePicture());
        signupRequest.setFirstName(studentRequest.getFirstName());
        signupRequest.setLastName(studentRequest.getLastName());
        signupRequest.setPhoneNumber(studentRequest.getPhone());
        signupRequest.setEmail(studentRequest.getEmail());
        signupRequest.setPassword(studentRequest.getPassword());
        signupRequest.setUsername(studentRequest.getUsername());
        signupRequest.setPrivacyAgreed(true);
        signupRequest.setTermsAgreed(true);
        signupRequest.setRoleNames(Set.of(STUDENT_ROLE, AUTHOR_ROLE));
        return signupRequest;
    }

    public void delete(String id){
        Student curr = studentRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        authService.deleteUser(curr.getKeycloakId());
        curr.setDeleted(true);
        studentRepository.save(curr);
    }
    public StudentResponse updateProfile(String student, MultipartFile logo){
        Student st = studentRepository.findStudentByKeycloakIdAndIsDeletedIsFalse(student)
                .orElseThrow(() -> new ResourceNotFoundException("student Not Found with "+student));
        MultipartBodyBuilder bodyBuilder = new  MultipartBodyBuilder();
        bodyBuilder.part("file", logo.getResource());
        String updatedLogo =  fileWebClient.post()
                .uri("/file/student/profile/{id}", st.getId())
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                .retrieve()
                .bodyToMono(String.class)
                .block();
        st.setProfilePicture(updatedLogo);
        studentRepository.save(st);
        authService.updateProfile(st.getKeycloakId(), updatedLogo);
        return studentMapper.toResponse(st);
    }
    public List<StudentResponse> searchStudent(String keyword){
        List<Student> students = studentRepository.searchByKeyword(keyword);
        return students.stream()
                .map(studentMapper::toResponse)
                .toList();
    }


}
