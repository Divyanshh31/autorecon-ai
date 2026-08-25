package com.razorpay.autorecon.service;

import com.razorpay.autorecon.model.*;
import com.razorpay.autorecon.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ReconciliationService {

    private final OrderRecordRepository orderRepo;
    private final RazorpaySettlementRepository settlementRepo;
    private final BankTransactionRepository bankRepo;
    private final DiscrepancyItemRepository discrepancyRepo;

    @Value("${autorecon.sla.mdr-rate-percent:2.00}")
    private double expectedMdrPercent;

    @Value("${autorecon.sla.gst-rate-percent:18.00}")
    private double expectedGstPercent;

    @Value("${autorecon.sla.settlement-sla-days:2}")
    private int settlementSlaDays;

    public ReconciliationService(OrderRecordRepository orderRepo,
                                 RazorpaySettlementRepository settlementRepo,
                                 BankTransactionRepository bankRepo,
                                 DiscrepancyItemRepository discrepancyRepo) {
        this.orderRepo = orderRepo;
        this.settlementRepo = settlementRepo;
        this.bankRepo = bankRepo;
        this.discrepancyRepo = discrepancyRepo;
    }

    @Transactional
    public ReconciliationSummary runReconciliation() {
        discrepancyRepo.deleteAll();

        List<OrderRecord> orders = orderRepo.findAll();
        List<DiscrepancyItem> discrepancies = reconcileOrderList(orders);
        discrepancyRepo.saveAll(discrepancies);
        return getSummary();
    }

    @Transactional
    public ReconciliationSummary runReconciliationForBatch(String batchId) {
        List<DiscrepancyItem> oldDiscrepancies = discrepancyRepo.findByBatchId(batchId);
        discrepancyRepo.deleteAll(oldDiscrepancies);

        List<OrderRecord> orders = orderRepo.findByBatchId(batchId);
        List<DiscrepancyItem> discrepancies = reconcileOrderList(orders);
        for (DiscrepancyItem d : discrepancies) {
            d.setBatchId(batchId);
        }
        discrepancyRepo.saveAll(discrepancies);
        return getSummaryForBatch(batchId);
    }

    private List<DiscrepancyItem> reconcileOrderList(List<OrderRecord> orders) {
        List<DiscrepancyItem> discrepancies = new ArrayList<>();

        for (OrderRecord order : orders) {
            Optional<RazorpaySettlement> settlementOpt = settlementRepo.findByOrderId(order.getOrderId());
            if (settlementOpt.isEmpty() && order.getPaymentId() != null) {
                settlementOpt = settlementRepo.findByPaymentId(order.getPaymentId());
            }

            if (settlementOpt.isEmpty()) {
                if ("PAID".equalsIgnoreCase(order.getStatus())) {
                    order.setReconStatus(OrderRecord.ReconStatus.MISSING_PAYMENT);
                    DiscrepancyItem d = new DiscrepancyItem(
                            order.getOrderId(),
                            null,
                            null,
                            null,
                            DiscrepancyItem.DiscrepancyType.ORPHAN_TRANSACTION,
                            DiscrepancyItem.Severity.CRITICAL,
                            order.getAmount(),
                            BigDecimal.ZERO,
                            order.getAmount(),
                            "Store order is marked PAID but has no linked Razorpay settlement record.",
                            "Inspect webhook logs or trigger Razorpay Payment Fetch API by order ID."
                    );
                    d.setBatchId(order.getBatchId());
                    discrepancies.add(d);
                }
                orderRepo.save(order);
                continue;
            }

            RazorpaySettlement settlement = settlementOpt.get();

            // RULE 1: Verify Gross Transaction Amount
            if (order.getAmount().compareTo(settlement.getGrossAmount()) != 0) {
                order.setReconStatus(OrderRecord.ReconStatus.UNRECONCILED);
                BigDecimal diff = order.getAmount().subtract(settlement.getGrossAmount()).abs();
                DiscrepancyItem d = new DiscrepancyItem(
                        order.getOrderId(),
                        settlement.getPaymentId(),
                        settlement.getSettlementId(),
                        settlement.getBankUtr(),
                        DiscrepancyItem.DiscrepancyType.AMOUNT_MISMATCH,
                        DiscrepancyItem.Severity.CRITICAL,
                        order.getAmount(),
                        settlement.getGrossAmount(),
                        diff,
                        "Gross amount in store (" + order.getAmount() + ") does not match Razorpay gross (" + settlement.getGrossAmount() + ").",
                        "Check for partial capture or unauthorized price modification during checkout."
                );
                d.setBatchId(order.getBatchId());
                discrepancies.add(d);
            }

            // RULE 2: Contractual MDR Fee Validation (Expected vs Actual)
            BigDecimal expectedFee = order.getAmount().multiply(BigDecimal.valueOf(expectedMdrPercent)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal feeDifference = settlement.getFee().subtract(expectedFee);

            if (feeDifference.compareTo(BigDecimal.valueOf(0.50)) > 0) {
                order.setReconStatus(OrderRecord.ReconStatus.FEE_MISMATCH);
                DiscrepancyItem d = new DiscrepancyItem(
                        order.getOrderId(),
                        settlement.getPaymentId(),
                        settlement.getSettlementId(),
                        settlement.getBankUtr(),
                        DiscrepancyItem.DiscrepancyType.MDR_FEE_OVERCHARGE,
                        DiscrepancyItem.Severity.MEDIUM,
                        expectedFee,
                        settlement.getFee(),
                        feeDifference,
                        "MDR Fee charged (" + settlement.getFee() + " INR) exceeds contracted " + expectedMdrPercent + "% SLA (expected: " + expectedFee + " INR).",
                        "Raise automated fee dispute ticket with Razorpay Merchant Account Manager."
                );
                d.setBatchId(order.getBatchId());
                discrepancies.add(d);
            }

            // RULE 3: 3-Way Triangulation with Bank Statement Credits
            if (settlement.getBankUtr() != null && !settlement.getBankUtr().isEmpty()) {
                Optional<BankTransaction> bankTxOpt = bankRepo.findByBankUtr(settlement.getBankUtr());
                if (bankTxOpt.isEmpty()) {
                    order.setReconStatus(OrderRecord.ReconStatus.MISSING_BANK_CREDIT);
                    DiscrepancyItem d = new DiscrepancyItem(
                            order.getOrderId(),
                            settlement.getPaymentId(),
                            settlement.getSettlementId(),
                            settlement.getBankUtr(),
                            DiscrepancyItem.DiscrepancyType.MISSING_BANK_CREDIT,
                            DiscrepancyItem.Severity.CRITICAL,
                            settlement.getNetAmount(),
                            BigDecimal.ZERO,
                            settlement.getNetAmount(),
                            "Razorpay marked payout complete under UTR " + settlement.getBankUtr() + ", but no matching credit exists in Bank Statement.",
                            "Contact Nodal banking desk at Razorpay with UTR reference for trace inquiry."
                    );
                    d.setBatchId(order.getBatchId());
                    discrepancies.add(d);
                } else {
                    BankTransaction bankTx = bankTxOpt.get();
                    if (bankTx.getCreditedAmount().compareTo(settlement.getNetAmount()) != 0) {
                        bankTx.setMatchStatus(BankTransaction.MatchStatus.AMOUNT_MISMATCH);
                        bankRepo.save(bankTx);
                    } else {
                        bankTx.setMatchStatus(BankTransaction.MatchStatus.MATCHED);
                        bankRepo.save(bankTx);
                    }
                }
            }

            // RULE 4: Settlement SLA Latency Verification (T+2 SLA)
            if (settlement.getPaymentCreatedAt() != null) {
                LocalDateTime settlementTime = settlement.getSettledAt() != null ? settlement.getSettledAt() : LocalDateTime.now();
                long daysTaken = Duration.between(settlement.getPaymentCreatedAt(), settlementTime).toDays();
                if (daysTaken > settlementSlaDays && settlement.getSettledAt() == null) {
                    order.setReconStatus(OrderRecord.ReconStatus.DELAYED_SETTLEMENT);
                    DiscrepancyItem d = new DiscrepancyItem(
                            order.getOrderId(),
                            settlement.getPaymentId(),
                            settlement.getSettlementId(),
                            settlement.getBankUtr(),
                            DiscrepancyItem.DiscrepancyType.DELAYED_SETTLEMENT_SLA,
                            DiscrepancyItem.Severity.HIGH,
                            settlement.getNetAmount(),
                            BigDecimal.ZERO,
                            settlement.getNetAmount(),
                            "Payment captured " + daysTaken + " days ago, breaching standard T+" + settlementSlaDays + " settlement SLA.",
                            "Check if merchant account has active risk reserve hold or bank holiday delays."
                    );
                    d.setBatchId(order.getBatchId());
                    discrepancies.add(d);
                }
            }

            if (order.getReconStatus() == OrderRecord.ReconStatus.UNRECONCILED) {
                order.setReconStatus(OrderRecord.ReconStatus.RECONCILED);
            }

            orderRepo.save(order);
        }

        return discrepancies;
    }

    public ReconciliationSummary getSummary() {
        List<OrderRecord> orders = orderRepo.findAll();
        List<RazorpaySettlement> settlements = settlementRepo.findAll();
        List<DiscrepancyItem> discrepancies = discrepancyRepo.findAll();
        return computeSummary(orders, settlements, discrepancies);
    }

    public ReconciliationSummary getSummaryForBatch(String batchId) {
        List<OrderRecord> orders = orderRepo.findByBatchId(batchId);
        List<RazorpaySettlement> settlements = settlementRepo.findByBatchId(batchId);
        List<DiscrepancyItem> discrepancies = discrepancyRepo.findByBatchId(batchId);
        return computeSummary(orders, settlements, discrepancies);
    }

    private ReconciliationSummary computeSummary(List<OrderRecord> orders, List<RazorpaySettlement> settlements, List<DiscrepancyItem> discrepancies) {
        ReconciliationSummary summary = new ReconciliationSummary();
        summary.setTotalOrders(orders.size());

        long reconciledCount = orders.stream().filter(o -> o.getReconStatus() == OrderRecord.ReconStatus.RECONCILED).count();
        summary.setReconciledOrders(reconciledCount);
        summary.setDiscrepancyCount(discrepancies.size());

        double health = orders.isEmpty() ? 100.0 : ((double) reconciledCount / orders.size()) * 100.0;
        summary.setHealthScorePercentage(Math.round(health * 10.0) / 10.0);

        BigDecimal gross = BigDecimal.ZERO;
        BigDecimal actualFee = BigDecimal.ZERO;
        BigDecimal gstTax = BigDecimal.ZERO;
        BigDecimal settledToBank = BigDecimal.ZERO;

        for (RazorpaySettlement s : settlements) {
            if (s.getGrossAmount() != null) gross = gross.add(s.getGrossAmount());
            if (s.getFee() != null) actualFee = actualFee.add(s.getFee());
            if (s.getTax() != null) gstTax = gstTax.add(s.getTax());
            if (s.getNetAmount() != null && s.getSettledAt() != null) settledToBank = settledToBank.add(s.getNetAmount());
        }

        summary.setTotalGrossVolume(gross);
        summary.setTotalActualMdrFee(actualFee);
        summary.setTotalGstTax(gstTax);
        summary.setTotalSettledToBank(settledToBank);

        BigDecimal expectedMdr = gross.multiply(BigDecimal.valueOf(expectedMdrPercent)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        summary.setTotalExpectedMdrFee(expectedMdr);

        BigDecimal totalDiscrepancyVal = discrepancies.stream()
                .map(d -> d.getVarianceAmount() != null ? d.getVarianceAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        summary.setTotalDiscrepancyAmount(totalDiscrepancyVal);

        summary.setMdrFeeMismatches(discrepancies.stream().filter(d -> d.getType() == DiscrepancyItem.DiscrepancyType.MDR_FEE_OVERCHARGE).count());
        summary.setDelayedSettlements(discrepancies.stream().filter(d -> d.getType() == DiscrepancyItem.DiscrepancyType.DELAYED_SETTLEMENT_SLA).count());
        summary.setMissingBankCredits(discrepancies.stream().filter(d -> d.getType() == DiscrepancyItem.DiscrepancyType.MISSING_BANK_CREDIT).count());
        summary.setUnsettledRefunds(discrepancies.stream().filter(d -> d.getType() == DiscrepancyItem.DiscrepancyType.UNSETTLED_REFUND).count());

        summary.setRecentDiscrepancies(discrepancies);
        return summary;
    }
}
