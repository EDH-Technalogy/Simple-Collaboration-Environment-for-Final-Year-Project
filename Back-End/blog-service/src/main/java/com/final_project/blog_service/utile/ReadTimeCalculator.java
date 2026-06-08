package com.final_project.blog_service.utile;


import com.final_project.blog_service.dto.request.ArticleBlockRequest;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ReadTimeCalculator {

    private static final int WORDS_PER_MINUTE = 200;

    public int calculateFromBlocks(List<ArticleBlockRequest> blocks) {
        if (blocks == null || blocks.isEmpty()) {
            return 1;
        }

        int words = 0;

        for (ArticleBlockRequest block : blocks) {
            if (block.getData() == null) continue;

            Object text = block.getData().get("text");
            if (text instanceof String value && !value.isBlank()) {
                words += value.trim().split("\s+").length;
            }

            Object code = block.getData().get("code");
            if (code instanceof String value && !value.isBlank()) {
                words += value.trim().split("\s+").length / 2;
            }
        }

        return Math.max(1, (int) Math.ceil(words / 200.0));
    }
}
