package com.final_project.versioncontrolservice.kafka;

import com.final_project.versioncontrolservice.config.AppProperties;
import com.final_project.versioncontrolservice.event.RepositoryOperationEvent;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@AllArgsConstructor
public class KafkaProducer {
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final AppProperties appProperties;

    public void produce(RepositoryOperationEvent repositoryOperationEvent) {
        kafkaTemplate.send(appProperties.getKafka().getTopics().getRepositoryOperation(), repositoryOperationEvent.getEventId(), repositoryOperationEvent)
                .whenComplete((res, ex) -> {
                    if (ex != null) {
                        log.error("Field to publish Blog interaction event. eventType {} eventId {} ", repositoryOperationEvent.getEventType(), repositoryOperationEvent.getEventId());
                    }
                    else{
                        log.info("PUBLISH Blog INteraction EVENT. topic {} partition {} offset {} and eventId {} ",
                                res.getProducerRecord().topic(),
                                res.getProducerRecord().partition(),
                                res.getRecordMetadata().hasOffset(),
                                repositoryOperationEvent.getEventId()
                        );
                    }

                });

    }

}
