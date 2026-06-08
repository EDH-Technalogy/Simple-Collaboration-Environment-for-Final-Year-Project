package com.final_project.faculty_service.DTO.mapper;

import java.util.List;
import java.util.stream.Collectors;

public interface BaseMapper<RQ, RS,E> {
    E toEntity(RQ request);
    RS toResponse(E entity);
    default List<RS> toResponseList(List<E> entities){
        if(entities==null){
            return null;
        }
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }
}
