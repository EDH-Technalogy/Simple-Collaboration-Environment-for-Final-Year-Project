package com.final_project.versioncontrolservice.kafka.consumer;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.final_project.versioncontrolservice.event.RepositoryOperationEvent;
import com.final_project.versioncontrolservice.model.RepositoryEventType;
import com.final_project.versioncontrolservice.model.Task;
import com.final_project.versioncontrolservice.repo.TaskRepository;
import com.final_project.versioncontrolservice.service.TaskService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
@AllArgsConstructor
public class RepositoryOperationConsumer {

    private final ObjectMapper objectMapper;
    private final TaskRepository taskRepository;
    private final TaskService taskService;

    @KafkaListener(
            topics = "${app.kafka.topics.repository.operation}",
            groupId = "version-control-service-task-auto-complete",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(
            ConsumerRecord<String, Object> record,
            Acknowledgment ack,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.OFFSET) long offset,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition
    ) {
        log.info("Received REPOSITORY event. Topic={} Partition={} Offset={}", topic, partition, offset);

        try {
            RepositoryOperationEvent event =
                    objectMapper.convertValue(record.value(), RepositoryOperationEvent.class);

            if (event.getEventType() != RepositoryEventType.PULL_REQUEST_MERGED) {
                ack.acknowledge();
                return;
            }

            String prId = event.getPullRequestId();
            if (prId == null || prId.isBlank()) {
                ack.acknowledge();
                return;
            }

            // Find tasks explicitly linked to this PR and attempt to complete them.
            List<Task> linkedTasks = taskRepository.findByLinkedPrId(prId);
            for (Task task : linkedTasks) {
                try {
                    TaskService.CompleteTaskRequest req = TaskService.CompleteTaskRequest.builder()
                            .pullRequestId(prId)
                            .feedback("Auto-completed on PR merge (event-driven)")
                            .score(null)
                            .build();

                    // Use repository owner name as reviewer identity (must be admin)
                    String reviewer = event.getOwnerName() == null ? event.getOwnerUserId() : event.getOwnerName();
                    if (reviewer == null) reviewer = "system";

                    taskService.completeTask(
                            event.getOwnerName() == null ? event.getOwnerUserId() : event.getOwnerName(),
                            event.getRepositoryName(),
                            task.getNumber(),
                            req,
                            reviewer
                    );
                } catch (Exception ex) {
                    log.warn("Failed to auto-complete task #{} for PR {}: {}", task.getNumber(), prId, ex.getMessage());
                }
            }

            ack.acknowledge();
        } catch (Exception ex) {
            log.error("Failed to process REPOSITORY event. Key={} Error={}", record.key(), ex.getMessage(), ex);
            throw new RuntimeException("Failed to process REPOSITORY event", ex);
        }
    }
}
