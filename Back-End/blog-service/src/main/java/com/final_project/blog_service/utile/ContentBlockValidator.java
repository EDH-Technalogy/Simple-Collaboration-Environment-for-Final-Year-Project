package com.final_project.blog_service.utile;

import com.final_project.blog_service.dto.request.ArticleBlockRequest;
import com.final_project.blog_service.dto.ArticleBlockType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class ContentBlockValidator {

    public void validate(List<ArticleBlockRequest> blocks) {
        if (blocks == null || blocks.isEmpty()) {
            throw new IllegalArgumentException("Article must contain at least one content block");
        }

        for (ArticleBlockRequest block : blocks) {
            validateBlock(block);
        }
    }

    private void validateBlock(ArticleBlockRequest block) {
        if (block.getType() == null) {
            throw new IllegalArgumentException("Block type is required");
        }

        if (block.getData() == null) {
            throw new IllegalArgumentException("Block data is required");
        }

        Map<String, Object> data = block.getData();
        ArticleBlockType type = block.getType();

        switch (type) {
            case TEXT -> requireText(data, "text", "Text block requires text");
            case HEADING -> {
                requireText(data, "text", "Heading block requires text");
                Object level = data.get("level");
                if (!(level instanceof Number number) || number.intValue() < 1 || number.intValue() > 6) {
                    throw new IllegalArgumentException("Heading level must be between 1 and 6");
                }
            }
            case IMAGE -> {
                requireText(data, "fileId", "Image block requires fileId");
                requireText(data, "url", "Image block requires url");
                requireText(data, "alt", "Image block requires alt text");
            }
            case VIDEO -> {
                requireText(data, "fileId", "Video block requires fileId");
                requireText(data, "url", "Video block requires url");
            }
            case CODE -> {
                requireText(data, "code", "Code block requires code");
                requireText(data, "language", "Code block requires language");
            }
            case QUOTE -> requireText(data, "text", "Quote block requires text");
            case EMBED -> {
                requireText(data, "provider", "Embed block requires provider");
                requireText(data, "url", "Embed block requires url");
            }
            case DIVIDER -> {
                // no required fields
            }
        }
    }

    private void requireText(Map<String, Object> data, String key, String message) {
        Object value = data.get(key);
        if (!(value instanceof String text) || text.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }
}