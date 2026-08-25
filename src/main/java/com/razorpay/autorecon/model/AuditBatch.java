package com.razorpay.autorecon.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_batches")
public class AuditBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String batchId;

    private String fileName;
    private LocalDateTime uploadedAt;

    private int totalOrders;
    private int reconciledOrders;
    private int discrepancyCount;
    private double healthScorePercentage;

    private BigDecimal totalGrossVolume = BigDecimal.ZERO;
    private BigDecimal totalExpectedMdrFee = BigDecimal.ZERO;
    private BigDecimal totalActualMdrFee = BigDecimal.ZERO;
    private BigDecimal totalGstTax = BigDecimal.ZERO;
    private BigDecimal totalSettledToBank = BigDecimal.ZERO;
    private BigDecimal totalDiscrepancyAmount = BigDecimal.ZERO;

    private int mdrFeeMismatches;
    private int delayedSettlements;
    private int missingBankCredits;

    public AuditBatch() {}

    public AuditBatch(String batchId, String fileName, LocalDateTime uploadedAt) {
        this.batchId = batchId;
        this.fileName = fileName;
        this.uploadedAt = uploadedAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBatchId() { return batchId; }
    public void setBatchId(String batchId) { this.batchId = batchId; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }

    public int getTotalOrders() { return totalOrders; }
    public void setTotalOrders(int totalOrders) { this.totalOrders = totalOrders; }

    public int getReconciledOrders() { return reconciledOrders; }
    public void setReconciledOrders(int reconciledOrders) { this.reconciledOrders = reconciledOrders; }

    public int getDiscrepancyCount() { return discrepancyCount; }
    public void setDiscrepancyCount(int discrepancyCount) { this.discrepancyCount = discrepancyCount; }

    public double getHealthScorePercentage() { return healthScorePercentage; }
    public void setHealthScorePercentage(double healthScorePercentage) { this.healthScorePercentage = healthScorePercentage; }

    public BigDecimal getTotalGrossVolume() { return totalGrossVolume; }
    public void setTotalGrossVolume(BigDecimal totalGrossVolume) { this.totalGrossVolume = totalGrossVolume; }

    public BigDecimal getTotalExpectedMdrFee() { return totalExpectedMdrFee; }
    public void setTotalExpectedMdrFee(BigDecimal totalExpectedMdrFee) { this.totalExpectedMdrFee = totalExpectedMdrFee; }

    public BigDecimal getTotalActualMdrFee() { return totalActualMdrFee; }
    public void setTotalActualMdrFee(BigDecimal totalActualMdrFee) { this.totalActualMdrFee = totalActualMdrFee; }

    public BigDecimal getTotalGstTax() { return totalGstTax; }
    public void setTotalGstTax(BigDecimal totalGstTax) { this.totalGstTax = totalGstTax; }

    public BigDecimal getTotalSettledToBank() { return totalSettledToBank; }
    public void setTotalSettledToBank(BigDecimal totalSettledToBank) { this.totalSettledToBank = totalSettledToBank; }

    public BigDecimal getTotalDiscrepancyAmount() { return totalDiscrepancyAmount; }
    public void setTotalDiscrepancyAmount(BigDecimal totalDiscrepancyAmount) { this.totalDiscrepancyAmount = totalDiscrepancyAmount; }

    public int getMdrFeeMismatches() { return mdrFeeMismatches; }
    public void setMdrFeeMismatches(int mdrFeeMismatches) { this.mdrFeeMismatches = mdrFeeMismatches; }

    public int getDelayedSettlements() { return delayedSettlements; }
    public void setDelayedSettlements(int delayedSettlements) { this.delayedSettlements = delayedSettlements; }

    public int getMissingBankCredits() { return missingBankCredits; }
    public void setMissingBankCredits(int missingBankCredits) { this.missingBankCredits = missingBankCredits; }
}
