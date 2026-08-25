package com.razorpay.autorecon.controller;

import com.razorpay.autorecon.model.ChatMessage;
import com.razorpay.autorecon.model.ChatResponse;
import com.razorpay.autorecon.model.DisputeDraft;
import com.razorpay.autorecon.repository.DiscrepancyItemRepository;
import com.razorpay.autorecon.service.AIChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    private final AIChatService aiChatService;
    private final DiscrepancyItemRepository discrepancyRepo;

    public ChatController(AIChatService aiChatService, DiscrepancyItemRepository discrepancyRepo) {
        this.aiChatService = aiChatService;
        this.discrepancyRepo = discrepancyRepo;
    }

    @PostMapping
    public ResponseEntity<ChatResponse> askAssistant(@RequestBody ChatMessage request) {
        ChatResponse response = aiChatService.processUserQuery(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/dispute-draft")
    public ResponseEntity<DisputeDraft> getDisputeDraft() {
        var discrepancies = discrepancyRepo.findByResolvedFalseOrderByDetectedAtDesc();
        DisputeDraft draft = aiChatService.generateDisputeDraft(discrepancies);
        return ResponseEntity.ok(draft);
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getAiConfig() {
        boolean hasKey = aiChatService.hasGeminiApiKey();
        return ResponseEntity.ok(Map.of(
                "hasKey", hasKey,
                "mode", hasKey ? "Google Gemini 1.5 Flash (Live LLM)" : "Local Autonomous Financial Engine",
                "maskedKey", aiChatService.getGeminiApiKeyMasked()
        ));
    }

    @PostMapping("/config")
    public ResponseEntity<Map<String, Object>> setAiConfig(@RequestBody Map<String, String> body) {
        String key = body.get("apiKey");
        aiChatService.setGeminiApiKey(key);
        boolean hasKey = aiChatService.hasGeminiApiKey();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "hasKey", hasKey,
                "mode", hasKey ? "Google Gemini 1.5 Flash (Live LLM)" : "Local Autonomous Financial Engine",
                "maskedKey", aiChatService.getGeminiApiKeyMasked()
        ));
    }
}
