package com.final_project.blog_service.config;

import com.final_project.blog_service.exception.UnauthorizedException;
import com.final_project.blog_service.exception.UserNotFoundException;
import com.final_project.blog_service.exception.UserServiceException;
import com.final_project.blog_service.exception.UserServiceUnavailableException;
import feign.RequestInterceptor;
import feign.codec.ErrorDecoder;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.Size;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;


@Service
@Slf4j
public class FileServiceFeignConfig {

//    @Bean
//    public RequestInterceptor bearerRequestInterceptor() {
//        return template -> {
//            ServletRequestAttributes attributes =(ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
//            if (attributes == null){
//                return ;
//            }
//            HttpServletRequest request = attributes.getRequest();
//            String authorizationHeader = request.getHeader("Authorization");
//            if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
//                template.header("Authorization", authorizationHeader);
//            }
//        };
//    }

    @Bean
    public ErrorDecoder errorDecoderFileService() {
        return (methodKey, response) -> {
            log.error("User Service error: {} {}", response.status(), response.reason());

            switch (response.status()) {
                case 400:
                    return new UserServiceException("Bad request to File  Service");
                case 401:
                case 403:
                    return new UnauthorizedException("Unauthorized access to File Service");
                case 404:
                    return new UserNotFoundException("File not found in File Service");
                case 500:
                case 502:
                case 503:
                case 504:
                    return new UserServiceUnavailableException("File Service is unavailable");
                default:
                    return new UserServiceException("File Service error: " + response.reason());
            }
        };
    }
}
