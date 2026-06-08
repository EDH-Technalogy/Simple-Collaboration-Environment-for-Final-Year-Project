package com.final_project.faculty_service.config;

import com.final_project.faculty_service.models.University;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertEvent;
import org.springframework.stereotype.Component;

@Component
public class UniversityModelListener extends AbstractMongoEventListener<University> {
    @Override
    public void onBeforeConvert(BeforeConvertEvent<University> event) {
       University uni = event.getSource();
       if( !uni.isDeleted()){
           uni.setDeleted(false);
       }
    }
}
