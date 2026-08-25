package com.razorpay.autorecon.model;

import java.math.BigDecimal;
import java.util.List;

public class ReconciliationSummary {

    private long totalOrders;
    private long reconciledOrders;
    private long discrepancyCount;
    private double healthScorePercentage; // e.g. 92.5%

    private BigDecimal totalGrossVolume = BigDecimal.ZERO;
    private BigDecimal totalExpectedMdrFee = BigDecimal.ZERO;
    private BigDecimal totalActualMdrFee = BigDecimal.ZERO;
    private BigDecimal totalGstTax = BigDecimal.ZERO;
    private BigDecimal totalSettledToBank = BigDecimal.ZERO;
    private BigDecimal totalDiscrepancyAmount = BigDecimal.ZERO;

    private long mdrFeeMismatches;
    private long delayedSettlements;
    private long missingBankCredits;
    private long unsettledRefunds;

    private List<DiscrepancyItem> recentDiscrepancies;

    public ReconciliationSummary() {}

    // Getters and Setters
    public long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }

    public long getReconciledOrders() { return reconciledOrders; }
    public void setReconciledOrders(long reconciledOrders) { this.reconciledOrders = reconciledOrders; }

    public long getDiscrepancyCount() { return discrepancyCount; }
    public void setDiscrepancyCount(long discrepancyCount) { this.discrepancyCount = discrepancyCount; }

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

    public long getMdrFeeMismatches() { return mdrFeeMismatches; }
    public void setMdrFeeMismatches(long mdrFeeMismatches) { this.mdrFeeMismatches = mdrFeeMismatches; }

    public long getDelayedSettlements() { return delayedSettlements; }
    public void setDelayedSettlements(long delayedSettlements) { this.delayedSettlements = delayedSettlements; }

    public long getMissingBankCredits() { return missingBankCredits; }
    public void setMissingBankCredits(long missingBankCredits) { this.missingBankCredits = missingBankCredits; }

    public long getUnsettledRefunds() { return unsettledRefunds; }
    public void setUnsettledRefunds(long unsettledRefunds) { this.unsettledRefunds = unsettledRefunds; }

    public List<DiscrepancyItem> getRecentDiscrepancies() { return recentDiscrepancies; }
    public void setRecentDiscrepancies(List<DiscrepancyItem> recentDiscrepancies) { this.recentDiscrepancies = recentDiscrepancies; }
}
