package com.final_project.versioncontrolservice.repo;
import com.final_project.versioncontrolservice.model.Invitation;
import com.final_project.versioncontrolservice.model.InvitationStatus;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvitationRepository extends MongoRepository<Invitation, String> {

    long countByRepository_UserNameIgnoreCaseAndRepository_RepositoryNameIgnoreCaseAndGuestUser_IdAndStatus(
            String ownerUsername,
            String repositoryName,
            String guestUserId,
            InvitationStatus status
    );


    Optional<Invitation> findByHostUser_UsernameIgnoreCaseAndRepository_UserNameIgnoreCaseAndRepository_RepositoryNameIgnoreCase(
            String hostUsername,
            String ownerUsername,
            String repositoryName
    );
    List<Invitation> findByGuestUser_IdAndStatus(
            String guestUserId,
            InvitationStatus status
    );

    List<Invitation> findByRepository_UserNameIgnoreCaseAndRepository_RepositoryNameIgnoreCase(
            String ownerUsername,
            String repositoryName
    );

    List<Invitation> findByHostUser_IdAndStatus(
            String hostUserId,
            InvitationStatus status
    );
}
