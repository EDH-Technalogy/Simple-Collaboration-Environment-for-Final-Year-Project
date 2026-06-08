package com.final_project.faculty_service.services;


import com.final_project.faculty_service.DTO.RoleDTO;
import com.final_project.faculty_service.DTO.UserDto;
import com.final_project.faculty_service.DTO.mapper.TeacherMapper;
import com.final_project.faculty_service.DTO.request.SignupRequest;
import com.final_project.faculty_service.DTO.request.TeacherRequest;
import com.final_project.faculty_service.DTO.response.PageResponse;
import com.final_project.faculty_service.DTO.response.StudentResponse;
import com.final_project.faculty_service.DTO.response.TeacherResponse;
import com.final_project.faculty_service.DTO.response.UniversityResponse;
import com.final_project.faculty_service.config.FileServerClient;
import com.final_project.faculty_service.models.Department;
import com.final_project.faculty_service.models.Student;
import com.final_project.faculty_service.models.Teacher;
import com.final_project.faculty_service.models.University;
import com.final_project.faculty_service.repository.DepartmentRepository;
import com.final_project.faculty_service.repository.StudentRepository;
import com.final_project.faculty_service.repository.TeacherRepository;
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
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Set;

@Service
public class TeacherService {
    private static final String TEACHER_ROLE = "teacher-user";
    private static final String AUTHOR_ROLE = "AUTHOR_USER";

    private final DepartmentRepository departmentRepository;
    private final TeacherRepository teacherRepository;
    private final TeacherMapper teacherMapper;
    private final SequenceGeneratorService sequenceGeneratorService;
    private final WebClient fileWebClient;
    private final StudentRepository studentRepository;
    private AuthService authService;

    public TeacherService(
            DepartmentRepository departmentRepository,
            TeacherRepository teacherRepository,
            TeacherMapper teacherMapper,
            @Qualifier("fileServiceClient") WebClient fileWebClient,
            StudentRepository studentRepository,
            AuthService authService,
            SequenceGeneratorService sequenceGeneratorService
    ){
        this.sequenceGeneratorService = sequenceGeneratorService;
        this.teacherRepository = teacherRepository;
        this.departmentRepository = departmentRepository;
        this.teacherMapper = teacherMapper;
        this.fileWebClient = fileWebClient;
        this.studentRepository = studentRepository;
        this.authService = authService;
    }
    public PageResponse<TeacherResponse> findAll(Pageable pageable) {
        Page<Teacher> teacherPage = teacherRepository.findByIsDeletedIsFalse(pageable);
        List<TeacherResponse> studentResponses = teacherPage
                .getContent()
                .stream()
                .map(teacherMapper::toResponse)
                .toList();
        return PageResponse.<TeacherResponse>builder()
                .data(studentResponses)
                .page(teacherPage.getNumber())
                .size(teacherPage.getSize())
                .totalElements(teacherPage.getTotalElements())
                .totalPages(teacherPage.getTotalPages())
                .last(teacherPage.isLast())
                .build();
    }

    public PageResponse<TeacherResponse> getTeachersByFaculty(Pageable pageable, String id) {
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

        Page<Teacher> teacherPage = teacherRepository.findAllByAggregation(operations, pageable);

        List<TeacherResponse> teacherResponses = teacherPage
                .getContent()
                .stream()
                .map(teacherMapper::toResponse)
                .toList();

        return PageResponse.<TeacherResponse>builder()
                .data(teacherResponses)
                .page(teacherPage.getNumber())
                .size(teacherPage.getSize())
                .totalElements(teacherPage.getTotalElements())
                .totalPages(teacherPage.getTotalPages())
                .last(teacherPage.isLast())
                .build();
    }
    public TeacherResponse update(String id , TeacherRequest request){
        Teacher currentRpoItem = teacherRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found:" + id));

        Department department = departmentRepository.findByIdAndIsDeletedIsFalse(request.getDepartment())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found:" + request.getDepartment()));
        Teacher teacher = teacherMapper.toEntity(request);
        teacher.setId(id);
        teacher.setDepartment(department);
        teacher.setCode(currentRpoItem.getCode());
        teacherRepository.save(teacher);
        return teacherMapper.toResponse(teacher);
    }

    public TeacherResponse findById(String id){
        var current = teacherRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found:" + id));

        return teacherMapper.toResponse(current);
    }

    @Transactional
    public TeacherResponse create(TeacherRequest request){
        boolean isExistByEmail = teacherRepository.existsTeacherByEmailAndIsDeletedIsFalse(request.getEmail())
                ;
        if (isExistByEmail){
            throw new UserWithEmailExsit("All Ready user with this email exsit");
        }
        boolean isExistByPersonalInformation = teacherRepository.existsTeacherByFirstNameAndFatherNameAndLastName(request.getFirstName(), request.getFatherName(), request.getLastName());
        if (isExistByPersonalInformation){
         throw   new ResourceExist("User with this infomratione exist");
        }
        SignupRequest signupRequest = mapToSignupRequest(request);
        UserDto response = authService.createUser(signupRequest);
        if(response.getId().isEmpty()){
            throw new ResourceNotFoundException("User couldn't save ");
        }
        authService.assignRoleToUser(response.getId(), TEACHER_ROLE);
        authService.assignRoleToUser(response.getId(), AUTHOR_ROLE);

        Teacher mappedTeacher = teacherMapper.toEntity(request);

        Department department = departmentRepository.findByIdAndIsDeletedIsFalse(request.getDepartment())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found:" + request.getDepartment()));

        mappedTeacher.setDepartment(department);
        mappedTeacher.setKeycloakId(response.getId());
        long sequ = sequenceGeneratorService.generateSequence("sequence_teacher");
        mappedTeacher.setCode(mappedTeacher.getDepartment().getCode()+"-"+sequ);
        Teacher result =  teacherRepository.save(mappedTeacher);
        return teacherMapper.toResponse(result);
    }

    public void delete(String id){
        Teacher curr = teacherRepository.findByIdAndIsDeletedIsFalse(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Teacher not found:" + id));
        authService.deleteUser(curr.getKeycloakId());
        curr.setDeleted(true);
        teacherRepository.save(curr);
    }
    private static SignupRequest mapToSignupRequest(TeacherRequest request){
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setFirstName(request.getProfileUrl());
        signupRequest.setLastName(request.getLastName());
        signupRequest.setFirstName(request.getFirstName());
        signupRequest.setPrivacyAgreed(true);
        signupRequest.setUsername(request.getUserName());
        signupRequest.setTermsAgreed(true);
        signupRequest.setEmail(request.getEmail());
        signupRequest.setPassword(request.getPassword());
        signupRequest.setPhoneNumber(request.getPhone());
        signupRequest.setRoleNames(Set.of(TEACHER_ROLE, AUTHOR_ROLE));
        return signupRequest;
    }
    public TeacherResponse updateProfile(String teacher, MultipartFile logo){
        Teacher st = teacherRepository.findTeacherByKeycloakIdAndIsDeletedIsFalse(teacher)
                .orElseThrow(() -> new ResourceNotFoundException("University Not Found with "+teacher));
        MultipartBodyBuilder bodyBuilder = new  MultipartBodyBuilder();
        bodyBuilder.part("file", logo.getResource());
        String updatedLogo =  fileWebClient.post()
                .uri("/file/teacher/profile/{id}", st.getId())
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                .retrieve()
                .bodyToMono(String.class)
                .block();
        st.setImageUrl(updatedLogo);
        teacherRepository.save(st);
        authService.updateProfile(st.getKeycloakId(), updatedLogo);
        return teacherMapper.toResponse(st);
    }

    public List<TeacherResponse> searchTeacher(String keyword){
        List<Teacher> teachers = teacherRepository.searchByKeyword(keyword);
        return teachers.stream()
                .map(teacherMapper::toResponse)
                .toList();
    }


}
