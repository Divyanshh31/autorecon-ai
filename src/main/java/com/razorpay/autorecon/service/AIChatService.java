package com.razorpay.autorecon.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.razorpay.autorecon.model.*;
import com.razorpay.autorecon.repository.DiscrepancyItemRepository;
import com.razorpay.autorecon.repository.OrderRecordRepository;
import com.razorpay.autorecon.repository.RazorpaySettlementRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AIChatService {

    private final ReconciliationService reconService;
    private final DiscrepancyItemRepository discrepancyRepo;
    private final OrderRecordRepository orderRepo;
    private final RazorpaySettlementRepository settlementRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${autorecon.ai.gemini-api-key:}")
    private String geminiApiKey;

    public AIChatService(ReconciliationService reconService,
                         DiscrepancyItemRepository discrepancyRepo,
                         OrderRecordRepository orderRepo,
                         RazorpaySettlementRepository settlementRepo) {
        this.reconService = reconService;
        this.discrepancyRepo = discrepancyRepo;
        this.orderRepo = orderRepo;
        this.settlementRepo = settlementRepo;
    }

    public synchronized void setGeminiApiKey(String apiKey) {
        this.geminiApiKey = apiKey != null ? apiKey.trim() : "";
    }

    public synchronized String getGeminiApiKeyMasked() {
        if (geminiApiKey != null && geminiApiKey.length() > 8) {
            return geminiApiKey.substring(0, 4) + "..." + geminiApiKey.substring(geminiApiKey.length() - 4);
        }
        return (geminiApiKey != null && !geminiApiKey.isBlank()) ? "Configured" : "None (Using Local AI)";
    }

    public synchronized boolean hasGeminiApiKey() {
        return geminiApiKey != null && !geminiApiKey.isBlank();
    }

    public ChatResponse processUserQuery(ChatMessage request) {
        String query = request.getMessage() != null ? request.getMessage().trim() : "";
        ReconciliationSummary summary = reconService.getSummary();
        List<DiscrepancyItem> discrepancies = discrepancyRepo.findByResolvedFalseOrderByDetectedAtDesc();

        // 1. If user explicitly asks for a dispute letter, always generate it
        if (query.toLowerCase().contains("dispute") || query.toLowerCase().contains("draft letter") || query.toLowerCase().contains("support email")) {
            ChatResponse response = new ChatResponse();
            response.setIntent("DRAFT_DISPUTE_LETTER");
            DisputeDraft draft = generateDisputeDraft(discrepancies);
            response.setDisputeDraftAvailable(true);
            response.setDisputeDraft(draft);
            response.setReply("I have generated a formal dispute audit letter for Razorpay Merchant Support covering "
                    + draft.getAffectedTransactionsCount() + " affected transaction(s) worth ₹" + draft.getTotalDisputedAmount() + ".");
            response.setKeyInsights(List.of("Dispute letter includes exact UTRs, order IDs, and contractual 2% MDR calculations."));
            response.setRecommendedActions(List.of("Click 'View & Export Dispute Draft' below to view and copy."));
            return response;
        }

        // 2. If Gemini API Key is configured, use Gemini Cloud LLM for unrestricted conversational responses
        if (hasGeminiApiKey()) {
            try {
                return callGeminiLLM(query, summary, discrepancies);
            } catch (Exception e) {
                System.err.println("Gemini API call error: " + e.getMessage() + ", falling back to local reasoning engine.");
            }
        }

        // 3. Fallback to Local Financial AI Engine
        return evaluateLocalFinancialAI(query.toLowerCase(), summary, discrepancies);
    }

    private ChatResponse evaluateLocalFinancialAI(String q, ReconciliationSummary summary, List<DiscrepancyItem> discrepancies) {
        ChatResponse response = new ChatResponse();
        List<String> insights = new ArrayList<>();
        List<String> actions = new ArrayList<>();

        if (q.contains("health") || q.contains("score") || q.contains("status") || q.contains("overview")) {
            response.setIntent("HEALTH_OVERVIEW");
            response.setReply(String.format("Our current 3-Way Reconciliation Health Score is **%.1f%%**. Out of %d total orders, %d are fully reconciled and %d require financial controller attention with a total variance of ₹%.2f.",
                    summary.getHealthScorePercentage(), summary.getTotalOrders(), summary.getReconciledOrders(), summary.getDiscrepancyCount(), summary.getTotalDiscrepancyAmount()));

            insights.add(String.format("Total Gross Volume: ₹%.2f across %d sales orders.", summary.getTotalGrossVolume(), summary.getTotalOrders()));
            insights.add(String.format("Total Net Settled to Bank: ₹%.2f across verified UTR credits.", summary.getTotalSettledToBank()));
            insights.add(String.format("Gateway Fee & GST Deductions: ₹%.2f (Fee) + ₹%.2f (GST).", summary.getTotalActualMdrFee(), summary.getTotalGstTax()));

            if (summary.getDiscrepancyCount() > 0) {
                actions.add("Review the " + summary.getDiscrepancyCount() + " flagged anomalies in the Discrepancies table below.");
                actions.add("Generate a dispute ticket for fee overcharges and missing bank credits.");
            } else {
                actions.add("All books are 100% balanced for current settlement cycle.");
            }
        } else if (q.contains("fee") || q.contains("mdr") || q.contains("overcharge") || q.contains("rate") || q.contains("commission")) {
            response.setIntent("FEE_AUDIT");
            long feeMismatches = summary.getMdrFeeMismatches();
            BigDecimal diff = summary.getTotalActualMdrFee().subtract(summary.getTotalExpectedMdrFee());

            response.setReply(String.format("We audited all gateway fees against our agreed **2.0%% MDR + 18%% GST** policy. We detected **%d transaction(s)** with fee deviations. Total actual MDR charged is ₹%.2f vs expected ₹%.2f (Variance: ₹%.2f).",
                    feeMismatches, summary.getTotalActualMdrFee(), summary.getTotalExpectedMdrFee(), diff));

            insights.add("Expected MDR is strictly 2.00% of order gross + 18% GST on fee.");
            insights.add(String.format("Identified %d transactions where Razorpay charged a higher fee rate (e.g. 3.5%%).", feeMismatches));
            actions.add("Request automated refund credit for excess MDR deductions from Razorpay.");
            actions.add("Ask me to 'Draft dispute letter' to generate the official claim.");
        } else if (q.contains("delayed") || q.contains("sla") || q.contains("payout") || q.contains("late")) {
            response.setIntent("DELAYED_SETTLEMENTS");
            long delayed = summary.getDelayedSettlements();
            response.setReply(String.format("We detected **%d transaction(s)** exceeding our contractual **T+2 settlement SLA**. These payments were captured over 2 business days ago but have not yet been batched into a bank settlement.", delayed));

            insights.add("Normal Razorpay settlement cycle is T+2 working days.");
            insights.add("Delays may be caused by bank holidays, nodal clearing pauses, or risk reserve holdbacks.");
            actions.add("Check Razorpay Dashboard > Settlements tab for any temporary risk holds.");
            actions.add("Escalate delayed settlements to Merchant Account Manager.");
        } else if (q.contains("bank") || q.contains("utr") || q.contains("credit") || q.contains("missing")) {
            response.setIntent("BANK_CREDIT_AUDIT");
            long missing = summary.getMissingBankCredits();
            response.setReply(String.format("We found **%d transaction(s)** where Razorpay marked the payout as completed with a settlement UTR, but the corresponding credit is **missing from our bank statement ledger**.", missing));

            insights.add("Razorpay payout status is 'processed' but Bank has no matching UTR entry.");
            actions.add("Initiate an urgent Nodal bank trace with your receiving bank (HDFC/ICICI/SBI) using the UTR reference number.");
        } else if (q.contains("gst") || q.contains("tax") || q.contains("invoice")) {
            response.setIntent("GST_TAX_REPORT");
            response.setReply(String.format("Total GST paid on Razorpay payment gateway fees stands at **₹%.2f** on total MDR fees of **₹%.2f** (effective 18%% GST on services).",
                    summary.getTotalGstTax(), summary.getTotalActualMdrFee()));

            insights.add("Input Tax Credit (ITC) can be claimed against Razorpay monthly GST invoices (Form GSTR-2B).");
            actions.add("Export GST breakdown report for monthly tax filing close.");
        } else {
            response.setIntent("GENERAL_FINANCE_COPILOT");
            response.setReply(String.format("Hello! I am your **AutoRecon AI Finance Controller**. Currently, we are tracking **%d sales orders** worth **₹%.2f**. Health score is at **%.1f%%** with **%d discrepancy items** requiring resolution. *(Tip: You can connect your free Gemini API key using the 'AI Key' button in the top navbar to unlock full conversational AI!)*",
                    summary.getTotalOrders(), summary.getTotalGrossVolume(), summary.getHealthScorePercentage(), summary.getDiscrepancyCount()));

            insights.add("I monitor 3-way matching: Store Orders ⟷ Razorpay Settlements ⟷ Bank Statement Credits.");
            insights.add("I continuously audit 2% MDR fees, 18% GST tax, and T+2 settlement SLAs.");
            actions.add("Try asking: 'Which transactions had fee overcharges?'");
            actions.add("Try asking: 'Explain missing bank credits'");
            actions.add("Try asking: 'Draft a dispute letter for Razorpay support'");
        }

        response.setKeyInsights(insights);
        response.setRecommendedActions(actions);
        return response;
    }

    public DisputeDraft generateDisputeDraft(List<DiscrepancyItem> discrepancies) {
        BigDecimal totalDisputeAmount = discrepancies.stream()
                .map(d -> d.getVarianceAmount() != null ? d.getVarianceAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<String> affectedIds = discrepancies.stream()
                .map(d -> d.getOrderId() + " (" + (d.getPaymentId() != null ? d.getPaymentId() : "N/A") + ")")
                .collect(Collectors.toList());

        StringBuilder body = new StringBuilder();
        body.append("Dear Razorpay Merchant Support & Settlement Team,\n\n");
        body.append("Merchant ID: MID_RAZORPAY_ENTERPRISE_DEMO\n");
        body.append("Date of Audit: ").append(LocalDate.now()).append("\n\n");
        body.append("We have completed our automated 3-way financial reconciliation cycle using AutoRecon AI. We have identified ")
                .append(discrepancies.size()).append(" discrepancy items totaling INR ")
                .append(String.format("%.2f", totalDisputeAmount)).append(" that require immediate investigation and credit adjustment.\n\n");

        body.append("--- SUMMARY OF DISCREPANCIES ---\n");
        for (int i = 0; i < discrepancies.size(); i++) {
            DiscrepancyItem d = discrepancies.get(i);
            body.append(String.format("%d. Order ID: %s | Payment ID: %s\n", i + 1, d.getOrderId(), d.getPaymentId() != null ? d.getPaymentId() : "N/A"));
            body.append(String.format("   Type: %s | Severity: %s\n", d.getType(), d.getSeverity()));
            body.append(String.format("   Expected: INR %.2f | Actual: INR %.2f | Variance: INR %.2f\n", d.getExpectedAmount(), d.getActualAmount(), d.getVarianceAmount()));
            body.append(String.format("   Root Cause: %s\n", d.getRootCause()));
            body.append(String.format("   Required Resolution: %s\n\n", d.getSuggestedAction()));
        }

        body.append("Please verify these records against the Nodal settlement ledger and credit the excess deductions to our registered settlement bank account.\n\n");
        body.append("Best regards,\n");
        body.append("Finance Controller & Accounting Team\n");
        body.append("AutoRecon AI Settlement Copilot");

        return new DisputeDraft(
                "DISP-" + System.currentTimeMillis() % 100000,
                "Formal Dispute & Settlement Discrepancy Notice - Ref: " + discrepancies.size() + " Item(s)",
                "settlements-support@razorpay.com",
                "MID_RAZORPAY_ENTERPRISE_DEMO",
                LocalDate.now(),
                totalDisputeAmount,
                discrepancies.size(),
                body.toString(),
                affectedIds
        );
    }

    private ChatResponse callGeminiLLM(String query, ReconciliationSummary summary, List<DiscrepancyItem> discrepancies) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

        String systemContext = String.format(
                "You are AutoRecon AI, an expert CFO and financial controller assistant for a Razorpay merchant. " +
                "Current Live Database State:\n" +
                "- Total Orders: %d\n" +
                "- Reconciled Orders: %d\n" +
                "- Discrepancies: %d\n" +
                "- Health Score: %.1f%%\n" +
                "- Total Gross Volume: INR %.2f\n" +
                "- Actual MDR Fee Deducted: INR %.2f\n" +
                "- Expected MDR Fee (2.00%%): INR %.2f\n" +
                "- Total GST (18%%): INR %.2f\n" +
                "- Total Net Settled to Bank: INR %.2f\n" +
                "- Total Disputed Variance: INR %.2f\n" +
                "- Active Anomaly Types: MDR Fee Overcharges: %d, Delayed SLA (>T+2): %d, Missing Bank Credits: %d\n\n" +
                "Rules:\n" +
                "1. Answer the user's financial question directly, using the live data above.\n" +
                "2. Format your response cleanly using bolding and bullet points.\n" +
                "3. Be helpful, authoritative, and concise as a CFO controller.",
                summary.getTotalOrders(), summary.getReconciledOrders(), summary.getDiscrepancyCount(), summary.getHealthScorePercentage(),
                summary.getTotalGrossVolume(), summary.getTotalActualMdrFee(), summary.getTotalExpectedMdrFee(), summary.getTotalGstTax(),
                summary.getTotalSettledToBank(), summary.getTotalDiscrepancyAmount(),
                summary.getMdrFeeMismatches(), summary.getDelayedSettlements(), summary.getMissingBankCredits()
        );

        Map<String, Object> body = new HashMap<>();
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> contentMap = new HashMap<>();
        List<Map<String, String>> parts = new ArrayList<>();
        parts.add(Map.of("text", systemContext + "\nUser Question: " + query));
        contentMap.put("parts", parts);
        contents.add(contentMap);
        body.put("contents", contents);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<String> responseEntity = restTemplate.postForEntity(url, requestEntity, String.class);
        JsonNode root = objectMapper.readTree(responseEntity.getBody());
        String generatedText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

        ChatResponse res = new ChatResponse();
        res.setReply(generatedText);
        res.setIntent("GEMINI_LIVE_LLM");
        res.setKeyInsights(List.of("Generated live with Google Gemini 1.5 Flash grounded on settlement data."));
        res.setRecommendedActions(List.of("You can continue asking any open-ended financial questions or request dispute drafts."));
        return res;
    }
}
