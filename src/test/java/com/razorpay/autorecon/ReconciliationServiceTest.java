package com.razorpay.autorecon;

import com.razorpay.autorecon.model.*;
import com.razorpay.autorecon.repository.*;
import com.razorpay.autorecon.service.ReconciliationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ReconciliationServiceTest {

    @Autowired
    private ReconciliationService reconService;

    @Autowired
    private OrderRecordRepository orderRepo;

    @Autowired
    private RazorpaySettlementRepository settlementRepo;

    @Autowired
    private BankTransactionRepository bankRepo;

    @Autowired
    private DiscrepancyItemRepository discrepancyRepo;

    @BeforeEach
    void setup() {
        discrepancyRepo.deleteAll();
        orderRepo.deleteAll();
        settlementRepo.deleteAll();
        bankRepo.deleteAll();
    }

    @Test
    void testExactMatchReconciliation() {
        // Given
        String orderId = "order_TEST_001";
        String paymentId = "pay_TEST_001";
        String utr = "UTR_TEST_001";
        BigDecimal amount = new BigDecimal("1000.00");
        BigDecimal fee = new BigDecimal("20.00"); // 2% MDR
        BigDecimal tax = new BigDecimal("3.60");  // 18% GST on 20
        BigDecimal net = new BigDecimal("976.40");

        OrderRecord order = new OrderRecord(orderId, "Test User", "test@example.com", amount, "PAID", LocalDateTime.now(), paymentId);
        RazorpaySettlement settlement = new RazorpaySettlement(paymentId, orderId, amount, fee, tax, net, "upi", "setl_01", utr, LocalDateTime.now(), LocalDateTime.now().plusDays(1), "captured");
        BankTransaction bankTx = new BankTransaction(utr, net, "RAZORPAY NODAL", LocalDateTime.now().plusDays(1), "1234", "HDFC");

        orderRepo.save(order);
        settlementRepo.save(settlement);
        bankRepo.save(bankTx);

        // When
        ReconciliationSummary summary = reconService.runReconciliation();

        // Then
        assertEquals(1, summary.getTotalOrders());
        assertEquals(1, summary.getReconciledOrders());
        assertEquals(0, summary.getDiscrepancyCount());
        assertEquals(100.0, summary.getHealthScorePercentage());
    }

    @Test
    void testMdrFeeOverchargeDetection() {
        // Given: Overcharge fee charged at 40 INR (4%) instead of 20 INR (2%)
        String orderId = "order_FEE_OVERCHARGE";
        String paymentId = "pay_FEE_OVERCHARGE";
        String utr = "UTR_TEST_002";
        BigDecimal amount = new BigDecimal("1000.00");
        BigDecimal excessFee = new BigDecimal("40.00");
        BigDecimal excessTax = new BigDecimal("7.20");
        BigDecimal net = new BigDecimal("952.80");

        OrderRecord order = new OrderRecord(orderId, "Fee Test User", "fee@example.com", amount, "PAID", LocalDateTime.now(), paymentId);
        RazorpaySettlement settlement = new RazorpaySettlement(paymentId, orderId, amount, excessFee, excessTax, net, "card", "setl_02", utr, LocalDateTime.now(), LocalDateTime.now().plusDays(1), "captured");
        BankTransaction bankTx = new BankTransaction(utr, net, "RAZORPAY NODAL", LocalDateTime.now().plusDays(1), "1234", "ICICI");

        orderRepo.save(order);
        settlementRepo.save(settlement);
        bankRepo.save(bankTx);

        // When
        ReconciliationSummary summary = reconService.runReconciliation();

        // Then
        assertEquals(1, summary.getTotalOrders());
        assertEquals(0, summary.getReconciledOrders());
        assertEquals(1, summary.getDiscrepancyCount());
        assertEquals(1, summary.getMdrFeeMismatches());
        assertTrue(summary.getHealthScorePercentage() < 100.0);
    }
}
