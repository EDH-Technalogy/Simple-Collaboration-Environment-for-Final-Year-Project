package com.final_project.faculty_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;


public class DynamicAggregationRepositoryImpl<T>
        implements DynamicAggregationRepository<T> {

    private final MongoTemplate mongoTemplate;
    private final Class<T> entityClass;
    private final String collectionName;

    public DynamicAggregationRepositoryImpl(
            MongoTemplate mongoTemplate,
            Class<T> entityClass
    ) {
        this.mongoTemplate = mongoTemplate;
        this.entityClass = entityClass;
        this.collectionName = resolveCollectionName(entityClass);
    }

    @Override
    public Page<T> findAllByAggregation(
            List<AggregationOperation> operations,
            Pageable pageable
    ) {
        List<AggregationOperation> dataOperations = new ArrayList<>(operations);
        dataOperations.add(skip(pageable.getOffset()));
        dataOperations.add(limit(pageable.getPageSize()));

        Aggregation dataAggregation = newAggregation(dataOperations);

        List<T> data = mongoTemplate
                .aggregate(dataAggregation, collectionName, entityClass)
                .getMappedResults();

        List<AggregationOperation> countOperations = new ArrayList<>(operations);
        countOperations.add(count().as("total"));

        Aggregation countAggregation = newAggregation(countOperations);

        CountResult countResult = mongoTemplate
                .aggregate(countAggregation, collectionName, CountResult.class)
                .getUniqueMappedResult();

        long total = countResult == null ? 0 : countResult.getTotal();

        return new PageImpl<>(data, pageable, total);
    }

    private String resolveCollectionName(Class<T> entityClass) {
        Document document = entityClass.getAnnotation(Document.class);

        if (document != null && !document.collection().isBlank()) {
            return document.collection();
        }

        return entityClass.getSimpleName()
                .substring(0, 1)
                .toLowerCase()
                + entityClass.getSimpleName().substring(1);
    }

    private static class CountResult {
        private long total;

        public long getTotal() {
            return total;
        }
    }
}