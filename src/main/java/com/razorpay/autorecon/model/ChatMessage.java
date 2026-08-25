package com.razorpay.autorecon.model;

import java.util.List;

public class ChatMessage {
    private String message;
    private String contextFilter; // optional filter like "fee_mismatch", "delayed", etc.

    public ChatMessage() {}
    public ChatMessage(String message) { this.message = message; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getContextFilter() { return contextFilter; }
    public void setContextFilter(String contextFilter) { this.contextFilter = contextFilter; }
}
