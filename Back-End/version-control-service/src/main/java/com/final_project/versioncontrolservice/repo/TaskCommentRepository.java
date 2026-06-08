package com.final_project.versioncontrolservice.repo;


import com.final_project.versioncontrolservice.model.TaskComment;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskCommentRepository extends MongoRepository<TaskComment, String > {
    List<TaskComment> findByTaskIdOrderByCreatedAtAsc(String  taskId);
    long countByTaskId(String  taskId);

    
}

