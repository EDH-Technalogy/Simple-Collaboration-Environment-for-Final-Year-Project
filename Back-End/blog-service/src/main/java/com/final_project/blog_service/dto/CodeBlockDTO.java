package com.final_project.blog_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Code Block - Code snippets with syntax highlighting
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Schema(
        title = "Code Block",
        description = "Code snippet with language specification",
        example = "{\"type\": \"code\", \"data\": {\"language\": \"javascript\", \"code\": \"const x = 1;\"}}"
)
public class CodeBlockDTO extends ContentBlockDTO {

    @NotBlank(message = "Code content is required")
    @Size(max = 50000, message = "Code must not exceed 50000 characters")
    @Schema(
            title = "Code Content",
            description = "The code snippet",
            example = "const greeting = 'Hello, World!';\\nconsole.log(greeting);"
    )
    private String code;

    @Size(max = 100, message = "Language must not exceed 100 characters")
    @Schema(
            title = "Programming Language",
            description = "Language for syntax highlighting",
            example = "javascript",
            allowableValues = {
                    "javascript", "python", "java", "cpp", "csharp", "go", "rust",
                    "ruby", "php", "swift", "kotlin", "typescript", "sql", "html",
                    "css", "bash", "shell", "plaintext"
            }
    )
    private String language;

    @Builder.Default
    @Schema(
            title = "Show Line Numbers",
            description = "Whether to display line numbers",
            example = "true"
    )
    private Boolean showLineNumbers = false;

    public CodeBlockDTO(String type, String code, String language) {
        this.type = type;
        this.code = code;
        this.language = language;
    }
}