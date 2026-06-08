package com.final_project.faculty_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;

import java.util.List;

public interface DynamicAggregationRepository<T> {
    Page<T> findAllByAggregation(
            List<AggregationOperation> operations,
            Pageable pageable
    );
}