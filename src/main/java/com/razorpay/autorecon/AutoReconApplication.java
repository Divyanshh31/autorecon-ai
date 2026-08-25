package com.razorpay.autorecon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AutoReconApplication {

    public static void main(String[] args) {
        SpringApplication.run(AutoReconApplication.class, args);
    }
}
