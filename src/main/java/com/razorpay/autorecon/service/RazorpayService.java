package com.razorpay.autorecon.service;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class RazorpayService {

    @Value("${autorecon.razorpay.key-id:rzp_test_mockKeyId}")
    private String keyId;

    @Value("${autorecon.razorpay.key-secret:mockSecretKey}")
    private String keySecret;

    @Value("${autorecon.razorpay.mock-mode:true}")
    private boolean mockMode;

    private RazorpayClient client;

    public Map<String, Object> verifyCredentials() {
        Map<String, Object> status = new HashMap<>();
        status.put("keyId", keyId != null && keyId.length() > 6 ? keyId.substring(0, 6) + "..." : "none");
        status.put("mockMode", mockMode);
        status.put("active", true);
        return status;
    }

    public RazorpayClient getClient() {
        if (client == null && !mockMode) {
            try {
                client = new RazorpayClient(keyId, keySecret);
            } catch (RazorpayException e) {
                System.err.println("Failed to initialize Razorpay Client: " + e.getMessage());
            }
        }
        return client;
    }
}
