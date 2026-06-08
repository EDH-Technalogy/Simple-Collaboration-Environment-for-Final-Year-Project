package com.final_project.blog_service.utile;


import org.apache.commons.lang3.StringUtils;

public class SlugUtil {

    public static String generateSlug(String title) {
        if (StringUtils.isBlank(title)) {
            throw new IllegalArgumentException("Title cannot be blank");
        }

        return title
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }

    public static String slugify(String input) {
        return generateSlug(input);
    }
}

