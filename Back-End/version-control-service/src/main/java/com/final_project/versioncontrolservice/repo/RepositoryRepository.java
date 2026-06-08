package com.final_project.versioncontrolservice.repo;

import com.final_project.versioncontrolservice.model.RepositoryDocument;
import com.final_project.versioncontrolservice.model.RepositoryVisibility;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RepositoryRepository extends MongoRepository<RepositoryDocument, String> {

    Optional<RepositoryDocument> findByOwner_UsernameIgnoreCaseAndRepositoryNameIgnoreCase(
            String username,
            String repositoryName
    );

    boolean existsByOwner_UsernameIgnoreCaseAndRepositoryNameIgnoreCase(
            String username,
            String repositoryName
    );

    // Search repositories by name
    List<RepositoryDocument> findByRepositoryNameContainingIgnoreCase(String keyword);

    // Search repositories owned by user
    List<RepositoryDocument> findByOwner_UsernameIgnoreCaseAndRepositoryNameContainingIgnoreCase(
            String username,
            String keyword
    );

    // Find repositories where user is collaborator
    List<RepositoryDocument> findByCollaborators_UsernameIgnoreCase(String username);

    // Find repositories where collaborator has specific role if your ContributorUser has role
    List<RepositoryDocument> findByCollaborators_UsernameIgnoreCaseAndCollaborators_Role(
            String username,
            String role
    );

    List<RepositoryDocument> findAllByOwner_Username(String username);
    // Delete repo by owner + name
    void deleteByOwner_UsernameIgnoreCaseAndRepositoryNameIgnoreCase(
            String username,
            String repositoryName
    );

    // Count user's repositories
    long countByOwner_UsernameIgnoreCase(String username);

    // Count public/private repos
    long countByOwner_UsernameIgnoreCaseAndVisibility(
            String username,
            RepositoryVisibility visibility
    );
    @Query("{ '$or': [ " +
            "{ 'repositoryName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'description': { $regex: ?0, $options: 'i' } }, " +
            "{ 'owner.username': { $regex: ?0, $options: 'i' } }, " +
            "{ 'owner.email': { $regex: ?0, $options: 'i' } } " +
            "] }")
    List<RepositoryDocument> searchRepositories(String keyword);
}
