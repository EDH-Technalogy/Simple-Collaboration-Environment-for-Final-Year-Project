package com.final_project.gatewayservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(
	properties = {
		"spring.main.web-application-type=reactive",
		"eureka.client.enabled=false",
		"eureka.client.register-with-eureka=false",
		"eureka.client.fetch-registry=false"
	}
)
class GatewayServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}
