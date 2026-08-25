package com.razorpay.autorecon.controller;

import com.razorpay.autorecon.model.ReconciliationSummary;
import com.razorpay.autorecon.service.DataIngestionService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/ingest")
@CrossOrigin(origins = "*")
public class IngestionController {

    private final DataIngestionService ingestionService;

    public IngestionController(DataIngestionService ingestionService) {
        this.ingestionService = ingestionService;
    }

    @PostMapping("/demo")
    public ResponseEntity<ReconciliationSummary> loadDemoData() {
        ReconciliationSummary summary = ingestionService.loadRealisticDemoData();
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/simulate")
    public ResponseEntity<ReconciliationSummary> simulateTransaction(@RequestBody Map<String, Object> body) {
        String customer = (String) body.getOrDefault("customerName", "Rohit Sharma");
        BigDecimal amount = new BigDecimal(body.getOrDefault("amount", 7500).toString());
        String method = (String) body.getOrDefault("paymentMethod", "upi");
        String scenario = (String) body.getOrDefault("scenario", "NORMAL");

        ReconciliationSummary summary = ingestionService.simulateTransaction(customer, amount, method, scenario);
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> resetData() {
        ingestionService.resetAllData();
        return ResponseEntity.ok(Map.of("message", "Database reset successful. Ready for fresh ingestion."));
    }

    @PostMapping("/upload-orders")
    public ResponseEntity<Map<String, Object>> uploadOrdersCsv(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> result = ingestionService.parseOrdersCsv(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "CSV Processing Error: " + e.getMessage()));
        }
    }

    @GetMapping("/sample-csv")
    public ResponseEntity<byte[]> downloadSampleCsv() {
        String csv = ingestionService.generateSampleCsvContent();
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=autorecon_sample_orders.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }
}
