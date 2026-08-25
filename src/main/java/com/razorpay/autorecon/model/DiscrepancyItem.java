package com.razorpay.autorecon.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "discrepancy_items")
public class DiscrepancyItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String orderId;

    private String batchId = "batch_demo";

    private String paymentId;
    private String settlementId;
    private String bankUtr;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DiscrepancyType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;

    @Column(precision = 12, scale = 2)
    private BigDecimal expectedAmount;

    @Column(precision = 12, scale = 2)
    private BigDecimal actualAmount;

    @Column(precision = 12, scale = 2)
    private BigDecimal varianceAmount; // Difference

    @Column(length = 1000)
    private String rootCause;

    @Column(length = 1000)
    private String suggestedAction;

    private LocalDateTime detectedAt;
    private boolean resolved = false;

    public enum DiscrepancyType {
        MDR_FEE_OVERCHARGE,
        GST_TAX_MISMATCH,
        DELAYED_SETTLEMENT_SLA,
        MISSING_BANK_CREDIT,
        AMOUNT_MISMATCH,
        UNSETTLED_REFUND,
        ORPHAN_TRANSACTION
    }

    public enum Severity {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    public DiscrepancyItem() {}

    public DiscrepancyItem(String orderId, String paymentId, String settlementId, String bankUtr, DiscrepancyType type, Severity severity, BigDecimal expectedAmount, BigDecimal actualAmount, BigDecimal varianceAmount, String rootCause, String suggestedAction) {
        this.orderId = orderId;
        this.paymentId = paymentId;
        this.settlementId = settlementId;
        this.bankUtr = bankUtr;
        this.type = type;
        this.severity = severity;
        this.expectedAmount = expectedAmount;
        this.actualAmount = actualAmount;
        this.varianceAmount = varianceAmount;
        this.rootCause = rootCause;
        this.suggestedAction = suggestedAction;
        this.detectedAt = LocalDateTime.now();
        this.resolved = false;
        this.batchId = "batch_demo";
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getBatchId() { return batchId; }
    public void setBatchId(String batchId) { this.batchId = batchId; }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public String getSettlementId() { return settlementId; }
    public void setSettlementId(String settlementId) { this.settlementId = settlementId; }

    public String getBankUtr() { return bankUtr; }
    public void setBankUtr(String bankUtr) { this.bankUtr = bankUtr; }

    public DiscrepancyType getType() { return type; }
    public void setType(DiscrepancyType type) { this.type = type; }

    public Severity getSeverity() { return severity; }
    public void setSeverity(Severity severity) { this.severity = severity; }

    public BigDecimal getExpectedAmount() { return expectedAmount; }
    public void setExpectedAmount(BigDecimal expectedAmount) { this.expectedAmount = expectedAmount; }

    public BigDecimal getActualAmount() { return actualAmount; }
    public void setActualAmount(BigDecimal actualAmount) { this.actualAmount = actualAmount; }

    public BigDecimal getVarianceAmount() { return varianceAmount; }
    public void setVarianceAmount(BigDecimal varianceAmount) { this.varianceAmount = varianceAmount; }

    public String getRootCause() { return rootCause; }
    public void setRootCause(String rootCause) { this.rootCause = rootCause; }

    public String getSuggestedAction() { return suggestedAction; }
    public void setSuggestedAction(String suggestedAction) { this.suggestedAction = suggestedAction; }

    public LocalDateTime getDetectedAt() { return detectedAt; }
    public void setDetectedAt(LocalDateTime detectedAt) { this.detectedAt = detectedAt; }

    public boolean isResolved() { return resolved; }
    public void setResolved(boolean resolved) { this.resolved = resolved; }
}
