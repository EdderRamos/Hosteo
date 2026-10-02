package com.edlabcode.hosteo.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI hosteoOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Hosteo API")
                .description("API del MVP de gestión de propiedades y reservas de Hosteo. Pagos simulados.")
                .version("v1"));
    }
}
