package com.final_project.faculty_service.helper;

public class Helper {
    public static String generateAbbreviation(String name) {
        if (name == null || name.isBlank()) {
            return "";
        }

        StringBuilder abbreviation = new StringBuilder();

        String[] words = name.trim().split("\\s+");

        for (String word : words) {
            abbreviation.append(Character.toUpperCase(word.charAt(0)));
        }

        return abbreviation.toString();
    }
}
