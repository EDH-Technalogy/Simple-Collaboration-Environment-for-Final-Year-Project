package com.final_project.faculty_service.services;

import com.final_project.faculty_service.DTO.RepositoryDTO;
import com.final_project.faculty_service.DTO.mapper.GroupMapper;
import com.final_project.faculty_service.DTO.mapper.ProjectInvitationRequest;
import com.final_project.faculty_service.DTO.mapper.ProjectMapper;
import com.final_project.faculty_service.DTO.request.ProjectRequest;
import com.final_project.faculty_service.DTO.request.ProjectPublicResultRequest;
import com.final_project.faculty_service.DTO.response.GroupMemberResponse;
import com.final_project.faculty_service.DTO.response.GroupResponse;
import com.final_project.faculty_service.DTO.response.PageResponse;
import com.final_project.faculty_service.DTO.response.ProjectResponse;
import com.final_project.faculty_service.models.Group;
import com.final_project.faculty_service.models.Project;
import com.final_project.faculty_service.models.ProjectStatus;
import com.final_project.faculty_service.models.Student;
import com.final_project.faculty_service.models.Teacher;
import com.final_project.faculty_service.repository.GroupRepository;
import com.final_project.faculty_service.repository.ProjectRepository;
import com.final_project.faculty_service.repository.StudentRepository;
import com.final_project.faculty_service.repository.TeacherRepository;
import com.final_project.faculty_service.services.exception.ResourceBadRequest;
import com.final_project.faculty_service.services.exception.ResourceNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class ProjectService {
    private  final ProjectRepository projectRepository;
    private final GroupMapper groupMapper;
    private final TeacherRepository teacherRepository;
    private final GroupRepository groupRepository;
    private final ProjectMapper projectMapper;
    private StudentRepository studentRepository;
    private final VersionContolService versionContolService;
    private final ProjectNotificationService projectNotificationService;
    public PageResponse<ProjectResponse> findAll(Pageable pageable) {
        Page<Project> projectPage = projectRepository.findByIsDeletedIsFalse(pageable);
        return toPageResponse(projectPage);
    }

    public PageResponse<ProjectResponse> findPublished(Pageable pageable) {
        return findPublished(pageable, null);
    }

    public PageResponse<ProjectResponse> findPublished(Pageable pageable, String search) {
        Page<Project> projectPage = projectRepository.findByPublishedIsTrueAndIsDeletedIsFalse(pageable);
        if (search != null && !search.isBlank()) {
            projectPage = projectRepository.searchPublished(search.trim(), pageable);
        }
        return toPageResponse(projectPage);
    }

    private PageResponse<ProjectResponse> toPageResponse(Page<Project> projectPage) {
        List<ProjectResponse> projectResponses = projectPage
                .getContent()
                .stream()
                .map(projectMapper::toResponse)
                .toList();
        return PageResponse.<ProjectResponse>builder()
                .data(projectResponses)
                .page(projectPage.getNumber())
                .size(projectPage.getSize())
                .totalElements(projectPage.getTotalElements())
                .totalPages(projectPage.getTotalPages())
                .last(projectPage.isLast())
                .build();
    }

    public ProjectResponse update(String id , ProjectRequest request){
        Project current = projectRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        Project project = projectMapper.toEntity(request);

        Teacher teacher = teacherRepository.findByIdAndIsDeletedIsFalse(request.getTeacher())
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found"));
        project.setTeacher(teacher);
        Group group = groupRepository.findByIdAndIsDeletedIsFalse(request.getGroup())
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));
        RepositoryDTO rep = current.getProjectRepository();
        if (request.getProjectRepository() != null && !request.getProjectRepository().isBlank()) {
            rep = versionContolService.getRpoById(request.getProjectRepository());
            if(rep == null){
                throw new ResourceNotFoundException("Repository Doesn't exist");
            }
        }
        if(rep == null){
            throw new ResourceNotFoundException("Repository Doesn't exist");
        }
        project.setProjectRepository(rep);
        project.setGroup(group);
        project.setId(id);
        project.setDeleted(current.isDeleted());
        applyProjectMetadata(project, request, current);

        projectRepository.save(project);
        return projectMapper.toResponse(project);
    }

    public ProjectResponse connectProjectWithRepsitory(String projectId, String repositoryId){
       RepositoryDTO currentRepo =  versionContolService.getRpoById(repositoryId);
       if (currentRepo == null){
           throw new ResourceNotFoundException("Rop Not Found");
       }
       Project project =  projectRepository.findByIdAndIsDeletedIsFalse(projectId).orElseThrow(() -> new ResourceNotFoundException("Project Not found"));
       if (project.getProjectRepository().equals(currentRepo) || project.getProjectRepository().getId().equals(currentRepo.getId())){
           throw new ResourceBadRequest("Already assign to this repo");
       }
       project.setProjectRepository(currentRepo);
       Project result = projectRepository.save(project);
       return projectMapper.toResponse(result);
    }

    public GroupResponse inviteMembers(String projectId, ProjectInvitationRequest request) {

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Group group = project.getGroup();

        if (group == null) {
            throw new RuntimeException("Project has no group");
        }

        // Ensure list is initialized
        if (group.getGroupMembers() == null) {
            group.setGroupMembers(new ArrayList<>());
        }

        // Use Set for faster lookup
        Set<String> existingMemberIds = group.getGroupMembers()
                .stream()
                .map(Student::getId)
                .collect(Collectors.toSet());

        List<String> requestedUserIds = request.getInvitations();

        List<GroupMemberResponse> responses = new ArrayList<>();

        for (String userId : requestedUserIds) {

            // Already a member
            if (existingMemberIds.contains(userId)) {
                continue;
            }

            // Fetch student
            Student student = studentRepository.findByIdAndIsDeletedIsFalse(userId)
                    .orElseThrow(() -> new RuntimeException("Student not found: " + userId));

            // Add to group
            group.getGroupMembers().add(student);

            // Update set to avoid duplicates in same request
            existingMemberIds.add(userId);

        }

        // Save changes
       Group currentProject =  groupRepository.save(group);

        return groupMapper.toResponse(currentProject);
    }

    // group by student id
    public ProjectResponse getProjectByStudentId(String projectId, String studentId){
        studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("The student not found"));
        Project project = projectRepository.findProjectByIdAndStudentInGroup(projectId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Not found"));
        return projectMapper.toResponse(project);
    }
    public ProjectResponse getProjectByTeacherId(String projectId, String studentId){
         teacherRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("The student not found"));
        Project project = projectRepository.findProjectByIdAndTeacher(projectId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Not found"));
        return projectMapper.toResponse(project);
    }
    public List<ProjectResponse> getProjectsByTeacherId(String teacherId){
        Teacher teacher = teacherRepository.findByIdAndIsDeletedIsFalse(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher Not Found"));
        List<Project> projects = projectRepository.findAllByTeacherId(teacherId);
        return projects.stream().map(projectMapper::toResponse).collect(Collectors.toList());
    }

    public List<ProjectResponse> getProjectsByStudentId(String student){
        Student student1 = studentRepository.findByIdAndIsDeletedIsFalse(student)
                .orElseThrow(() -> new ResourceNotFoundException("The student not exist"));
        List<Project> projects = projectRepository.findAllByStudentId(student1.getId());
        return projects.stream().map(projectMapper::toResponse).collect(Collectors.toList());
    }
    public ProjectResponse findProjectByteacherAndStudent(String teacherId, String student){
        Student student1 = studentRepository.findByIdAndIsDeletedIsFalse(student)
                .orElseThrow(() -> new ResourceNotFoundException("The student not exist"));
        Teacher teacher = teacherRepository.findByIdAndIsDeletedIsFalse(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher Not Found"));
        Project project = projectRepository.findByTeacherIdAndStudentId(student1.getId(), teacher.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Not found"));
        return projectMapper.toResponse(project);
    }

    public ProjectResponse findById(String id){
        Project current = projectRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        return projectMapper.toResponse(current);
    }

    public ProjectResponse findPublishedById(String id){
        Project current = projectRepository.findByIdAndPublishedIsTrueAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        return projectMapper.toResponse(current);
    }

    public URI getPublishedDownloadUri(String id){
        Project current = projectRepository.findByIdAndPublishedIsTrueAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        if (current.getFinalFileDownloadUrl() != null && !current.getFinalFileDownloadUrl().isBlank()) {
            return URI.create(current.getFinalFileDownloadUrl());
        }
        throw new ResourceNotFoundException("Project final file download URL not found");
    }

    public ProjectResponse findByRepositoryId(String repositoryId) {
        Project current = projectRepository.findByProjectRepository_IdAndIsDeletedIsFalse(repositoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        return projectMapper.toResponse(current);
    }

    public ProjectResponse create(ProjectRequest request){
        Group group = groupRepository.findByIdAndIsDeletedIsFalse(request.getGroup())
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));
        Teacher teacher = teacherRepository.findByIdAndIsDeletedIsFalse(request.getTeacher())
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found"));
        RepositoryDTO repo = versionContolService.getRpoById(request.getProjectRepository());
        if (repo == null){
            throw new ResourceNotFoundException("Repo doesn't exist");
        }

        Project project = projectMapper.toEntity(request);
        project.setProjectRepository(repo);
        project.setTeacher(teacher);
        project.setGroup(group);
        applyProjectMetadata(project, request, null);
        projectRepository.save(project);

        return projectMapper.toResponse(project);
    }

    public ProjectResponse publish(String id){
        Project project = projectRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        if (project.getStatus() != ProjectStatus.COMPLETED) {
            throw new ResourceBadRequest("Only completed projects can be published");
        }
        if (project.getAbstractText() == null || project.getAbstractText().isBlank()) {
            throw new ResourceBadRequest("Project abstract is required before publishing");
        }
        if (project.getFinalFileDownloadUrl() == null || project.getFinalFileDownloadUrl().isBlank()) {
            throw new ResourceBadRequest("Project final result file is required before publishing");
        }
        project.setPublished(true);
        project.setPublishedAt(LocalDateTime.now());
        Project saved = projectRepository.save(project);
        projectNotificationService.notifyStudentsProjectPublished(saved);
        return projectMapper.toResponse(saved);
    }

    public ProjectResponse updatePublicResult(String id, ProjectPublicResultRequest request){
        Project project = projectRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        project.setAbstractText(firstNonBlank(request.getAbstractText(), project.getAbstractText()));
        project.setFinalFileName(firstNonBlank(request.getFinalFileName(), project.getFinalFileName()));
        project.setFinalFileDownloadUrl(firstNonBlank(
                request.getFinalFileDownloadUrl(),
                project.getFinalFileDownloadUrl()
        ));
        return projectMapper.toResponse(projectRepository.save(project));
    }

    public ProjectResponse complete(String id){
        Project project = projectRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        project.setStatus(ProjectStatus.COMPLETED);
        project.setProgress(100);
        project.setCompletion(100);
        Project saved = projectRepository.save(project);
        projectNotificationService.notifyAdminsProjectCompleted(saved);
        return projectMapper.toResponse(saved);
    }

    public ProjectResponse unpublish(String id){
        Project project = projectRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        project.setPublished(false);
        project.setPublishedAt(null);
        return projectMapper.toResponse(projectRepository.save(project));
    }

    private void applyProjectMetadata(Project project, ProjectRequest request, Project current) {
        project.setStatus(request.getStatus() != null
                ? request.getStatus()
                : current != null ? current.getStatus() : ProjectStatus.PLANNED);
        project.setProgress(request.getProgress() != null
                ? request.getProgress()
                : current != null ? current.getProgress() : 0);
        project.setCompletion(request.getCompletion() != null
                ? request.getCompletion()
                : current != null ? current.getCompletion() : 0);
        project.setAbstractText(firstNonBlank(
                request.getAbstractText(),
                current != null ? current.getAbstractText() : null
        ));
        project.setFinalFileName(firstNonBlank(
                request.getFinalFileName(),
                current != null ? current.getFinalFileName() : null
        ));
        project.setFinalFileDownloadUrl(firstNonBlank(
                request.getFinalFileDownloadUrl(),
                current != null ? current.getFinalFileDownloadUrl() : null
        ));

        boolean nextPublished = request.getPublished() != null
                ? request.getPublished()
                : current != null && current.isPublished();
        project.setPublished(nextPublished);

        if (nextPublished) {
            project.setPublishedAt(current != null && current.getPublishedAt() != null
                    ? current.getPublishedAt()
                    : LocalDateTime.now());
        } else {
            project.setPublishedAt(null);
        }
    }

    private String firstNonBlank(String preferred, String fallback) {
        if (preferred != null && !preferred.isBlank()) {
            return preferred.trim();
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback.trim();
        }
        return null;
    }

    public void delete(String id){
        Project curr = projectRepository.findByIdAndIsDeletedIsFalse(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        curr.setDeleted(true);
        projectRepository.save(curr);
    }



}
