package com.final_project.notification_service.kafka.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.final_project.notification_service.event.UserRegisteredEvent;
import com.final_project.notification_service.service.IdempotencyService;
import com.final_project.notification_service.service.strategy.UserRegisteredProcessor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserRegisteredConsumer {

    private final UserRegisteredProcessor processor;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics      = "${app.kafka.topics.user-registered}",
            groupId     = "notification-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(
            ConsumerRecord<String, Object> record,
            Acknowledgment ack,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset
    ) {
        log.info("Received USER_REGISTERED event. Topic={} Partition={} Offset={} Key={}",
                topic, partition, offset, record.key());
        try {
            UserRegisteredEvent event = objectMapper.convertValue(record.value(), UserRegisteredEvent.class);

            String idempotencyKey = "consumer:user-registered:" + event.getEventId();
            if (!idempotencyService.tryAcquire(idempotencyKey)) {
                log.warn("Duplicate USER_REGISTERED event skipped. EventId={}", event.getEventId());
                ack.acknowledge();
                return;
            }

            processor.process(event);
            ack.acknowledge();
            log.info("USER_REGISTERED event processed successfully. EventId={}", event.getEventId());

        } catch (Exception ex) {
            log.error("Failed to process USER_REGISTERED event. Key={} Error={}",
                    record.key(), ex.getMessage(), ex);
            // Don't ack — let the error handler apply backoff / DLQ logic
            throw new RuntimeException("Failed to process USER_REGISTERED event", ex);
        }
    }
}