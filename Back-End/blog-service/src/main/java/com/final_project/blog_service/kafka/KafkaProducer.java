package com.final_project.blog_service.kafka;


import com.final_project.blog_service.config.AppProperties;
import com.final_project.blog_service.event.BlogInteractionEvent;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@AllArgsConstructor
@Slf4j
public class KafkaProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final AppProperties appProperties;

    public void produce(BlogInteractionEvent blogInteractionEvent) {
        kafkaTemplate.send(appProperties.getKafka().getTopics().getArticleOperations(), blogInteractionEvent.getEventId(), blogInteractionEvent)
                .whenComplete((res, ex) -> {

                    if (ex != null) {
                        log.error("Field to publish Blog interaction event. eventType {} eventId {} ", blogInteractionEvent.getEventType(), blogInteractionEvent.getEventId());
                    }
                    else{
                        log.info("PUBLISH Blog INteraction EVENT. topic {} partition {} offset {} and eventId {} ",
                                res.getProducerRecord().topic(),
                                res.getProducerRecord().partition(),
                                res.getRecordMetadata().hasOffset(),
                                blogInteractionEvent.getEventId()
                        );
                    }

                });

    }

}
