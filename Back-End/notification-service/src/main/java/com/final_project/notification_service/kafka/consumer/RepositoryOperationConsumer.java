package com.final_project.notification_service.kafka.consumer;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.final_project.notification_service.event.RepositoryOperationEvent;
import com.final_project.notification_service.service.IdempotencyService;
import com.final_project.notification_service.service.strategy.RepositoryOperationProcessor;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@AllArgsConstructor
public class RepositoryOperationConsumer {

    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;
    private final RepositoryOperationProcessor repositoryOperationProcessor;

    @KafkaListener(
            topics = "${app.kafka.topics.repository.operation}",
            groupId = "notification-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(
            ConsumerRecord<String, Object> record,
            Acknowledgment ack,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.OFFSET) long offset,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition
    ) {
        log.info("Received REPOSITORY event. Topic={} Partition={} Offset={}",
                topic, partition, offset);

        try {
            RepositoryOperationEvent event =
                    objectMapper.convertValue(record.value(), RepositoryOperationEvent.class);

            String idempotencyKey = "consumer:repository-operation:" + event.getEventId();

            if (!idempotencyService.tryAcquire(idempotencyKey)) {
                log.warn("Duplicate REPOSITORY event skipped. EventId={}", event.getEventId());
                ack.acknowledge();
                return;
            }

            repositoryOperationProcessor.process(event);

            ack.acknowledge();

        } catch (Exception ex) {
            log.error("Failed to process REPOSITORY event. Key={} Error={}",
                    record.key(), ex.getMessage(), ex);
            throw new RuntimeException("Failed to process REPOSITORY event", ex);
        }
    }
}