package com.heavenstay.hswrms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HswrmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(HswrmsApplication.class, args);
    }
}
