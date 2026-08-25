package com.razorpay.autorecon.model;

import java.util.List;

public class ChatResponse {
    private String reply;
    private String intent;
    private List<String> keyInsights;
    private List<String> recommendedActions;
    private boolean disputeDraftAvailable;
    private DisputeDraft disputeDraft;

    public ChatResponse() {}

    public ChatResponse(String reply, String intent, List<String> keyInsights, List<String> recommendedActions) {
        this.reply = reply;
        this.intent = intent;
        this.keyInsights = keyInsights;
        this.recommendedActions = recommendedActions;
    }

    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }

    public String getIntent() { return intent; }
    public void setIntent(String intent) { this.intent = intent; }

    public List<String> getKeyInsights() { return keyInsights; }
    public void setKeyInsights(List<String> keyInsights) { this.keyInsights = keyInsights; }

    public List<String> getRecommendedActions() { return recommendedActions; }
    public void setRecommendedActions(List<String> recommendedActions) { this.recommendedActions = recommendedActions; }

    public boolean isDisputeDraftAvailable() { return disputeDraftAvailable; }
    public void setDisputeDraftAvailable(boolean disputeDraftAvailable) { this.disputeDraftAvailable = disputeDraftAvailable; }

    public DisputeDraft getDisputeDraft() { return disputeDraft; }
    public void setDisputeDraft(DisputeDraft disputeDraft) { this.disputeDraft = disputeDraft; }
}
