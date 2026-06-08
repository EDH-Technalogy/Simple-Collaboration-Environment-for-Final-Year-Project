package com.final_project.faculty_service.controllers;

import com.final_project.faculty_service.DTO.mapper.ProjectInvitationRequest;
import com.final_project.faculty_service.DTO.request.GroupRequest;
import com.final_project.faculty_service.DTO.response.GroupResponse;
import com.final_project.faculty_service.DTO.response.PageResponse;
import com.final_project.faculty_service.services.GroupService;
import com.final_project.faculty_service.services.ProjectService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/group")
@AllArgsConstructor
public class GroupController {
    private final GroupService groupService;
    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<PageResponse<GroupResponse>> findAll(Pageable pageable){
        return new ResponseEntity<>(groupService.findAll(pageable), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<GroupResponse> create(@Valid @RequestBody GroupRequest request){
        return new ResponseEntity<>(groupService.create(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupResponse> findById(@PathVariable String id){
        return new ResponseEntity<>(groupService.findById(id), HttpStatus.OK);
    }

    @GetMapping("/{id}/invite")
    public ResponseEntity<GroupResponse> addMemebers(@RequestBody ProjectInvitationRequest request, @PathVariable String  id){
        return new ResponseEntity<>(projectService.inviteMembers(id, request), HttpStatus.OK);
    }
    @PutMapping("/{id}")
    public ResponseEntity<GroupResponse> update(@PathVariable String id, @Valid @RequestBody GroupRequest request){
        return new ResponseEntity<>(groupService.update(id, request), HttpStatus.OK);
    }

    @PutMapping("/{id}/leader/{leader}")
    public ResponseEntity<GroupResponse> updateGroupLeader(@PathVariable String id, @PathVariable String leader){
        return new ResponseEntity<>(groupService.updateGroupLeader(id, leader), HttpStatus.OK);
    }

    @DeleteMapping("/{id}/members/{studentId}")
    public ResponseEntity<GroupResponse> removeGroupMember(@PathVariable String id, @PathVariable String studentId){
        return new ResponseEntity<>(groupService.removeGroupMember(id, studentId), HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id){
        groupService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
