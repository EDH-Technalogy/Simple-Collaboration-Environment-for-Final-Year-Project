package com.final_project.versioncontrolservice.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.final_project.versioncontrolservice.dto.*;
import com.final_project.versioncontrolservice.config.AppProperties;
import com.final_project.versioncontrolservice.event.RepositoryOperationEvent;
import com.final_project.versioncontrolservice.kafka.KafkaProducer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import com.final_project.versioncontrolservice.model.*;
import com.final_project.versioncontrolservice.exception.BadRequestException;
import com.final_project.versioncontrolservice.exception.ForbiddenException;
import com.final_project.versioncontrolservice.exception.NotFoundException;
import com.final_project.versioncontrolservice.repo.InvitationRepository;

import lombok.AllArgsConstructor;

@Slf4j
@Service
@AllArgsConstructor
public class InvitationApplicationService {
    private final InvitationRepository invitationRepository;
    private final AuthService authService;
    private final RepositoryService repositoryService;
    private final KafkaProducer kafkaProducer;
    private final AppProperties appProperties;
    public InvitationResponse create(InvitationRequest request) {

        ContributorUser guest = authService.getContributorUser(request.getGuest());
        if (guest == null){
            throw new NotFoundException("The Guest User Not Found");
        }
        ContributorUser host = authService.getContributorUser(request.getHostId());
        if (host == null){
            throw new NotFoundException("The Host user Not Found");
        }

        RepositoryDTO repo = repositoryService.repositoryByOwnerAndRepoName(host.getUsername(), request.getRepository());
        long pending = invitationRepository
                .countByRepository_UserNameIgnoreCaseAndRepository_RepositoryNameIgnoreCaseAndGuestUser_IdAndStatus(
                repo.getOwner(), repo.getRepositoryName(), guest.getId(), InvitationStatus.PENDING);

        if (pending > 0 ) {

            throw new BadRequestException("pending invitation already exists");
        }

        Invitation invitation = Invitation
                .builder()
                .repository(
                        RepositoryMetadata
                                .builder()
                                .description(repo.getDescription())
                                .type(repo.getVisibility())
                                .userName(repo.getOwner())
                                .repositoryName(repo.getRepositoryName())
                                .build()
                )
                .status(InvitationStatus.PENDING)
                .guestUser(UserDTO.builder()
                        .email(guest.getEmail())
                        .status(guest.getStatus())
                        .username(guest.getUsername())
                        .id(guest.getId())
                        .profile(guest.getProfile())
                        .firstName(guest.getFirstName())
                        .lastName(guest.getLastName())
                        .roles(guest.getRoles())
                        .build())
                .hostUser(UserDTO
                        .builder()
                        .username(host.getUsername())
                        .id(host.getId())
                        .email(host.getEmail())
                        .status(host.getStatus())
                        .lastName(host.getLastName())
                        .firstName(host.getFirstName())
                        .roles(host.getRoles())
                        .profile(host.getProfile())
                        .build())
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(1))
                .build();
       Invitation saved =  invitationRepository.save(invitation);
        Map<String, Object> invitationSentMetadata = new java.util.LinkedHashMap<>();
        invitationSentMetadata.put("actionType", "REPOSITORY_INVITATION");
        invitationSentMetadata.put("invitationId", saved.getId());
        invitationSentMetadata.put("acceptEndpoint", buildGatewayUrl("/api/v1/repos/invitations/" + saved.getId() + "/accept/" + guest.getId()));
        invitationSentMetadata.put("rejectEndpoint", buildGatewayUrl("/api/v1/repos/invitations/" + saved.getId() + "/reject/" + guest.getId()));
        invitationSentMetadata.put("viewEndpoint", buildGatewayUrl("/api/v1/repos/" + repo.getOwner() + "/" + repo.getRepositoryName()));
        invitationSentMetadata.put("uiPath", "/student/repository/" + repo.getOwner() + "/" + repo.getRepositoryName() + "/contributors");
        invitationSentMetadata.put("repositoryOwner", repo.getOwner());
        invitationSentMetadata.put("repositoryName", repo.getRepositoryName());
        invitationSentMetadata.put("senderUserId", host.getId());
        invitationSentMetadata.put("senderName", host.getUsername());
        invitationSentMetadata.put("senderEmail", host.getEmail());
        invitationSentMetadata.put("receiverUserId", guest.getId());
        invitationSentMetadata.put("receiverName", guest.getUsername());
        invitationSentMetadata.put("receiverEmail", guest.getEmail());
        invitationSentMetadata.put("operationBy", host.getUsername());
        invitationSentMetadata.put("message", host.getUsername() + " invited you to join " + invitation.getRepository().getRepositoryName());

       kafkaProducer.produce(RepositoryOperationEvent
               .builder()
                       .eventId(UUID.randomUUID().toString())
                       .eventType(RepositoryEventType.REPOSITORY_INVITATION_SENT)
                       .repositoryId(repo.getId())
                       .repositoryName(repo.getRepositoryName())
                       .repositoryUrl(buildGatewayUrl("/api/v1/repos/" + repo.getOwner() + "/" + repo.getRepositoryName()))
                       .actorEmail(host.getEmail())
                       .actorName(host.getUsername())
                       .actorUserId(host.getId())

                       .invitedUserEmail(guest.getEmail())
                       .invitedUserId(guest.getId())
                       .invitedUserName(guest.getUsername())
                       .ownerUserId(host.getId())
                       .ownerName(host.getUsername())
                       .ownerEmail(host.getEmail())
                       .metadata(invitationSentMetadata)
                       .occurredAt(LocalDateTime.now())
                .build());
        return InvitationResponse.from(saved);
    }



    public List<InvitationResponse> listPendingForUser(String userId) {
        ContributorUser user = authService.getContributorUser(userId);
        List<Invitation> pendingInvitation =  invitationRepository.findByGuestUser_IdAndStatus(user.getId(), InvitationStatus.PENDING);
        if (pendingInvitation.isEmpty()){
            return List.of();
        }
        return pendingInvitation
                .stream()
                .map(InvitationResponse::from).toList();
    }

    public List<InvitationResponse> listForRepository(String owner, String repo) {
        return invitationRepository
                .findByRepository_UserNameIgnoreCaseAndRepository_RepositoryNameIgnoreCase(owner, repo)
                .stream()
                .sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt()))
                .map(InvitationResponse::from)
                .toList();
    }

    public InvitationResponse findById(String id) {
        Invitation invitation = invitationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("The Invitation With this not found"));
        return InvitationResponse.from(invitation);
    }


    public InvitationResponse accept(String invitationId, String userId) {

        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new NotFoundException("Invitation not found"));

        log.info(invitation.getStatus().name());
        if (!invitation.getGuestUser().getId().equals(userId)) {
            throw new ForbiddenException("You cannot accept this invitation");
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new BadRequestException("Invitation is not pending");
        }

        if (invitation.getExpiresAt() != null &&
                invitation.getExpiresAt().isBefore(LocalDateTime.now())) {

            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);

            throw new BadRequestException("Invitation has expired");
        }

        repositoryService.addCollaborator(
                invitation.getRepository().getUserName(),
                invitation.getRepository().getRepositoryName(),
                ContributorRequest
                        .builder()
                        .email(invitation.getGuestUser().getEmail())
                        .username(invitation.getGuestUser().getUsername())
                        .id(invitation.getGuestUser().getId())
                        .build()
        );
        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitationRepository.save(invitation);
        Map<String, Object> invitationAcceptedMetadata = new java.util.LinkedHashMap<>();
        invitationAcceptedMetadata.put("actionType", "REPOSITORY_INVITATION_ACCEPTED");
        invitationAcceptedMetadata.put("viewEndpoint", buildGatewayUrl("/api/v1/repos/" + invitation.getRepository().getUserName() + "/" + invitation.getRepository().getRepositoryName()));
        invitationAcceptedMetadata.put("uiPath", "/student/repository/" + invitation.getRepository().getUserName() + "/" + invitation.getRepository().getRepositoryName() + "/contributors");
        invitationAcceptedMetadata.put("senderUserId", invitation.getGuestUser().getId());
        invitationAcceptedMetadata.put("senderName", invitation.getGuestUser().getUsername());
        invitationAcceptedMetadata.put("senderEmail", invitation.getGuestUser().getEmail());
        invitationAcceptedMetadata.put("receiverUserId", invitation.getHostUser().getId());
        invitationAcceptedMetadata.put("receiverName", invitation.getHostUser().getUsername());
        invitationAcceptedMetadata.put("receiverEmail", invitation.getHostUser().getEmail());
        invitationAcceptedMetadata.put("operationBy", invitation.getHostUser().getUsername());
        invitationAcceptedMetadata.put("message", invitation.getGuestUser().getUsername() + " accepted the invitation to join " + invitation.getRepository().getRepositoryName());

        kafkaProducer.produce(RepositoryOperationEvent
                .builder()
                        .eventId(UUID.randomUUID().toString())
                        .eventType(RepositoryEventType.REPOSITORY_INVITATION_ACCEPTED)
                        .repositoryName(invitation.getRepository().getRepositoryName())
                        .repositoryUrl(buildGatewayUrl("/api/v1/repos/" + invitation.getRepository().getUserName() + "/" + invitation.getRepository().getRepositoryName()))
                        .actorEmail(invitation.getGuestUser().getEmail())
                        .actorName(invitation.getGuestUser().getUsername())
                        .actorUserId(invitation.getGuestUser().getId())
                        .invitedUserId(invitation.getGuestUser().getId())
                        .invitedUserName(invitation.getGuestUser().getUsername())
                        .invitedUserEmail(invitation.getGuestUser().getEmail())

                        .metadata(invitationAcceptedMetadata)
                        .ownerUserId(invitation.getHostUser().getId())
                        .ownerName(invitation.getHostUser().getUsername())
                        .ownerEmail(invitation.getHostUser().getEmail())
                        .occurredAt(LocalDateTime.now())
                .build());
        return InvitationResponse.from(invitation);
    }

    public InvitationResponse reject(String invitationId, String userId) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new NotFoundException("Invitation not found"));

        if (!invitation.getGuestUser().getId().equals(userId)) {
            throw new ForbiddenException("You cannot reject this invitation");
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new BadRequestException("Invitation is not pending");
        }

        Map<String, Object> invitationDeclinedMetadata = new java.util.LinkedHashMap<>();
        invitationDeclinedMetadata.put("actionType", "REPOSITORY_INVITATION_DECLINED");
        invitationDeclinedMetadata.put("viewEndpoint", buildGatewayUrl("/api/v1/repos/" + invitation.getRepository().getUserName() + "/" + invitation.getRepository().getRepositoryName()));
        invitationDeclinedMetadata.put("uiPath", "/student/repository/" + invitation.getRepository().getUserName() + "/" + invitation.getRepository().getRepositoryName() + "/contributors");
        invitationDeclinedMetadata.put("senderUserId", invitation.getGuestUser().getId());
        invitationDeclinedMetadata.put("senderName", invitation.getGuestUser().getUsername());
        invitationDeclinedMetadata.put("senderEmail", invitation.getGuestUser().getEmail());
        invitationDeclinedMetadata.put("receiverUserId", invitation.getHostUser().getId());
        invitationDeclinedMetadata.put("receiverName", invitation.getHostUser().getUsername());
        invitationDeclinedMetadata.put("receiverEmail", invitation.getHostUser().getEmail());
        invitationDeclinedMetadata.put("operationBy", invitation.getHostUser().getUsername());
        invitationDeclinedMetadata.put("message", invitation.getGuestUser().getUsername() + " rejected the invitation to join " + invitation.getRepository().getRepositoryName());

        kafkaProducer.produce(RepositoryOperationEvent
                .builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(RepositoryEventType.REPOSITORY_INVITATION_DECLINED)
                .repositoryName(invitation.getRepository().getRepositoryName())
                .repositoryUrl(buildGatewayUrl("/api/v1/repos/" + invitation.getRepository().getUserName() + "/" + invitation.getRepository().getRepositoryName()))
                .actorEmail(invitation.getGuestUser().getEmail())
                .actorName(invitation.getGuestUser().getUsername())
                .actorUserId(invitation.getGuestUser().getId())
                .invitedUserId(invitation.getGuestUser().getId())
                .invitedUserName(invitation.getGuestUser().getUsername())
                .invitedUserEmail(invitation.getGuestUser().getEmail())

                .metadata(invitationDeclinedMetadata)
                .ownerUserId(invitation.getHostUser().getId())
                .ownerName(invitation.getHostUser().getUsername())
                .ownerEmail(invitation.getHostUser().getEmail())
                .occurredAt(LocalDateTime.now())
                .build());
        invitation.setStatus(InvitationStatus.REJECTED);
        Invitation saved =  invitationRepository.save(invitation);
        return InvitationResponse.from(saved);
    }

    private String buildGatewayUrl(String path) {
        String base = appProperties.getGatewayBaseUrl() == null
                ? "http://localhost:8080"
                : appProperties.getGatewayBaseUrl().trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        if (path == null || path.isBlank()) {
            return base;
        }
        return path.startsWith("/") ? base + path : base + "/" + path;
    }
}
