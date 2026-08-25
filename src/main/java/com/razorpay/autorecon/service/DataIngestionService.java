package com.razorpay.autorecon.service;

import com.opencsv.CSVReader;
import com.razorpay.autorecon.model.*;
import com.razorpay.autorecon.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.Reader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class DataIngestionService {

    private final OrderRecordRepository orderRepo;
    private final RazorpaySettlementRepository settlementRepo;
    private final BankTransactionRepository bankRepo;
    private final DiscrepancyItemRepository discrepancyRepo;
    private final AuditBatchRepository batchRepo;
    private final ReconciliationService reconService;

    public DataIngestionService(OrderRecordRepository orderRepo,
                                RazorpaySettlementRepository settlementRepo,
                                BankTransactionRepository bankRepo,
                                DiscrepancyItemRepository discrepancyRepo,
                                AuditBatchRepository batchRepo,
                                ReconciliationService reconService) {
        this.orderRepo = orderRepo;
        this.settlementRepo = settlementRepo;
        this.bankRepo = bankRepo;
        this.discrepancyRepo = discrepancyRepo;
        this.batchRepo = batchRepo;
        this.reconService = reconService;
    }

    @Transactional
    public void resetAllData() {
        batchRepo.deleteAll();
        discrepancyRepo.deleteAll();
        orderRepo.deleteAll();
        settlementRepo.deleteAll();
        bankRepo.deleteAll();
    }

    @Transactional
    public ReconciliationSummary loadRealisticDemoData() {
        resetAllData();

        LocalDateTime now = LocalDateTime.now();
        String batchId = "batch_demo";

        String[][] customers = {
                {"Aarav Sharma", "aarav.sharma@example.com"},
                {"Priya Patel", "priya.p@techcorp.in"},
                {"Rohan Verma", "rohan.v@fintechhub.com"},
                {"Ananya Iyer", "ananya.iyer@cloudindia.org"},
                {"Vikram Singh", "vikram.singh@delhienterprises.com"},
                {"Sneha Reddy", "sneha.reddy@hyderabadstartups.in"},
                {"Aditya Joshi", "aditya.j@puneconsulting.co"},
                {"Neha Gupta", "neha.gupta@mumbaicorporate.com"},
                {"Kabir Nair", "kabir.nair@kochicreatives.com"},
                {"Tanvi Deshmukh", "tanvi.d@nagpurbusiness.in"}
        };

        String[] methods = {"upi", "card", "netbanking", "wallet"};
        String[] banks = {"HDFC", "ICICI", "SBI", "AXIS", "KOTAK"};

        List<OrderRecord> orders = new ArrayList<>();
        List<RazorpaySettlement> settlements = new ArrayList<>();
        List<BankTransaction> bankTxs = new ArrayList<>();

        Random random = new Random(42);

        for (int i = 1; i <= 35; i++) {
            String orderId = String.format("order_DEMO_%04d", i);
            String paymentId = String.format("pay_RZP_%05d", i + 10000);
            String settlementId = String.format("setl_BATCH_%02d", (i % 5) + 1);
            String bankUtr = String.format("UTR_%s_%07d", banks[i % banks.length], 9000000 + i);

            String[] cust = customers[i % customers.length];
            BigDecimal amount = BigDecimal.valueOf(500 + random.nextInt(45) * 200).setScale(2, RoundingMode.HALF_UP);
            String method = methods[i % methods.length];
            LocalDateTime orderTime = now.minusDays((i % 7) + 1).minusHours(i * 2 % 24);

            if (i == 4) {
                // ANOMALY 1: MDR Fee Overcharge (3.5% instead of 2%)
                BigDecimal actualFee = amount.multiply(BigDecimal.valueOf(0.035)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal actualTax = actualFee.multiply(BigDecimal.valueOf(0.18)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal net = amount.subtract(actualFee).subtract(actualTax);

                OrderRecord o = new OrderRecord(orderId, cust[0], cust[1], amount, "PAID", orderTime, paymentId);
                RazorpaySettlement s = new RazorpaySettlement(paymentId, orderId, amount, actualFee, actualTax, net, method, settlementId, bankUtr, orderTime, orderTime.plusDays(1), "captured");
                BankTransaction b = new BankTransaction(bankUtr, net, "RAZORPAY SOFTWARE PVT LTD / NODAL", orderTime.plusDays(1), "4412", banks[i % banks.length]);

                o.setBatchId(batchId);
                s.setBatchId(batchId);
                b.setBatchId(batchId);

                orders.add(o);
                settlements.add(s);
                bankTxs.add(b);
            } else if (i == 11) {
                // ANOMALY 2: Delayed Settlement SLA (captured 5 days ago)
                BigDecimal fee = amount.multiply(BigDecimal.valueOf(0.02)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal tax = fee.multiply(BigDecimal.valueOf(0.18)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal net = amount.subtract(fee).subtract(tax);

                OrderRecord o = new OrderRecord(orderId, cust[0], cust[1], amount, "PAID", now.minusDays(5), paymentId);
                RazorpaySettlement s = new RazorpaySettlement(paymentId, orderId, amount, fee, tax, net, method, null, null, now.minusDays(5), null, "captured");

                o.setBatchId(batchId);
                s.setBatchId(batchId);

                orders.add(o);
                settlements.add(s);
            } else if (i == 18) {
                // ANOMALY 3: Missing Bank Credit
                BigDecimal fee = amount.multiply(BigDecimal.valueOf(0.02)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal tax = fee.multiply(BigDecimal.valueOf(0.18)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal net = amount.subtract(fee).subtract(tax);

                OrderRecord o = new OrderRecord(orderId, cust[0], cust[1], amount, "PAID", orderTime, paymentId);
                RazorpaySettlement s = new RazorpaySettlement(paymentId, orderId, amount, fee, tax, net, method, settlementId, "UTR_MISSING_991827", orderTime, orderTime.plusDays(1), "captured");

                o.setBatchId(batchId);
                s.setBatchId(batchId);

                orders.add(o);
                settlements.add(s);
            } else if (i == 25) {
                // ANOMALY 4: Amount modified during checkout
                BigDecimal capturedAmount = amount.subtract(BigDecimal.valueOf(500));
                BigDecimal fee = capturedAmount.multiply(BigDecimal.valueOf(0.02)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal tax = fee.multiply(BigDecimal.valueOf(0.18)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal net = capturedAmount.subtract(fee).subtract(tax);

                OrderRecord o = new OrderRecord(orderId, cust[0], cust[1], amount, "PAID", orderTime, paymentId);
                RazorpaySettlement s = new RazorpaySettlement(paymentId, orderId, capturedAmount, fee, tax, net, method, settlementId, bankUtr, orderTime, orderTime.plusDays(1), "captured");
                BankTransaction b = new BankTransaction(bankUtr, net, "RAZORPAY SOFTWARE PVT LTD", orderTime.plusDays(1), "8821", banks[i % banks.length]);

                o.setBatchId(batchId);
                s.setBatchId(batchId);
                b.setBatchId(batchId);

                orders.add(o);
                settlements.add(s);
                bankTxs.add(b);
            } else {
                // NORMAL 100% MATCH (2% MDR + 18% GST)
                BigDecimal fee = amount.multiply(BigDecimal.valueOf(0.02)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal tax = fee.multiply(BigDecimal.valueOf(0.18)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal net = amount.subtract(fee).subtract(tax);

                OrderRecord o = new OrderRecord(orderId, cust[0], cust[1], amount, "PAID", orderTime, paymentId);
                RazorpaySettlement s = new RazorpaySettlement(paymentId, orderId, amount, fee, tax, net, method, settlementId, bankUtr, orderTime, orderTime.plusDays(1), "captured");
                BankTransaction b = new BankTransaction(bankUtr, net, "RAZORPAY NODAL SETTLEMENT", orderTime.plusDays(1), "1942", banks[i % banks.length]);

                o.setBatchId(batchId);
                s.setBatchId(batchId);
                b.setBatchId(batchId);

                orders.add(o);
                settlements.add(s);
                bankTxs.add(b);
            }
        }

        orderRepo.saveAll(orders);
        settlementRepo.saveAll(settlements);
        bankRepo.saveAll(bankTxs);

        ReconciliationSummary summary = reconService.runReconciliationForBatch(batchId);

        AuditBatch demoBatch = new AuditBatch(batchId, "Demo Settlement Sample (35 Orders)", now);
        updateBatchWithSummary(demoBatch, summary);
        batchRepo.save(demoBatch);

        return summary;
    }

    @Transactional
    public ReconciliationSummary simulateTransaction(String customerName, BigDecimal amount, String method, String scenario) {
        long currentCount = orderRepo.count() + 1;
        String orderId = String.format("order_SIM_%04d", currentCount);
        String paymentId = String.format("pay_SIM_%05d", currentCount + 50000);
        String settlementId = "setl_SIM_BATCH";
        String bankUtr = String.format("UTR_HDFC_SIM_%05d", currentCount);
        String batchId = "batch_demo";
        LocalDateTime now = LocalDateTime.now();

        if ("MDR_OVERCHARGE".equalsIgnoreCase(scenario)) {
            BigDecimal actualFee = amount.multiply(BigDecimal.valueOf(0.035)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal actualTax = actualFee.multiply(BigDecimal.valueOf(0.18)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal net = amount.subtract(actualFee).subtract(actualTax);

            OrderRecord o = new OrderRecord(orderId, customerName, customerName.toLowerCase().replace(" ", ".") + "@example.com", amount, "PAID", now, paymentId);
            RazorpaySettlement s = new RazorpaySettlement(paymentId, orderId, amount, actualFee, actualTax, net, method, settlementId, bankUtr, now, now.plusDays(1), "captured");
            BankTransaction b = new BankTransaction(bankUtr, net, "RAZORPAY NODAL", now.plusDays(1), "9901", "HDFC");

            o.setBatchId(batchId);
            s.setBatchId(batchId);
            b.setBatchId(batchId);

            orderRepo.save(o);
            settlementRepo.save(s);
            bankRepo.save(b);
        } else if ("DELAYED_SLA".equalsIgnoreCase(scenario)) {
            BigDecimal fee = amount.multiply(BigDecimal.valueOf(0.02)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal tax = fee.multiply(BigDecimal.valueOf(0.18)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal net = amount.subtract(fee).subtract(tax);

            OrderRecord o = new OrderRecord(orderId, customerName, customerName.toLowerCase().replace(" ", ".") + "@example.com", amount, "PAID", now.minusDays(4), paymentId);
            RazorpaySettlement s = new RazorpaySettlement(paymentId, orderId, amount, fee, tax, net, method, null, null, now.minusDays(4), null, "captured");

            o.setBatchId(batchId);
            s.setBatchId(batchId);

            orderRepo.save(o);
            settlementRepo.save(s);
        } else if ("MISSING_BANK".equalsIgnoreCase(scenario)) {
            BigDecimal fee = amount.multiply(BigDecimal.valueOf(0.02)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal tax = fee.multiply(BigDecimal.valueOf(0.18)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal net = amount.subtract(fee).subtract(tax);

            OrderRecord o = new OrderRecord(orderId, customerName, customerName.toLowerCase().replace(" ", ".") + "@example.com", amount, "PAID", now, paymentId);
            RazorpaySettlement s = new RazorpaySettlement(paymentId, orderId, amount, fee, tax, net, method, settlementId, "UTR_MISSING_SIM", now, now.plusDays(1), "captured");

            o.setBatchId(batchId);
            s.setBatchId(batchId);

            orderRepo.save(o);
            settlementRepo.save(s);
        } else {
            // NORMAL
            BigDecimal fee = amount.multiply(BigDecimal.valueOf(0.02)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal tax = fee.multiply(BigDecimal.valueOf(0.18)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal net = amount.subtract(fee).subtract(tax);

            OrderRecord o = new OrderRecord(orderId, customerName, customerName.toLowerCase().replace(" ", ".") + "@example.com", amount, "PAID", now, paymentId);
            RazorpaySettlement s = new RazorpaySettlement(paymentId, orderId, amount, fee, tax, net, method, settlementId, bankUtr, now, now.plusDays(1), "captured");
            BankTransaction b = new BankTransaction(bankUtr, net, "RAZORPAY NODAL", now.plusDays(1), "9901", "HDFC");

            o.setBatchId(batchId);
            s.setBatchId(batchId);
            b.setBatchId(batchId);

            orderRepo.save(o);
            settlementRepo.save(s);
            bankRepo.save(b);
        }

        ReconciliationSummary summary = reconService.runReconciliationForBatch(batchId);
        Optional<AuditBatch> bOpt = batchRepo.findByBatchId(batchId);
        if (bOpt.isPresent()) {
            AuditBatch b = bOpt.get();
            updateBatchWithSummary(b, summary);
            batchRepo.save(b);
        }

        return summary;
    }

    /**
     * Smart Multi-Format CSV Parser:
     * Generates a unique batch ID per uploaded file, runs isolated 3-way reconciliation,
     * persists the audit batch report, and returns the report URL for instant multi-tab opening.
     */
    @Transactional
    public Map<String, Object> parseOrdersCsv(MultipartFile file) throws Exception {
        try (Reader reader = new InputStreamReader(file.getInputStream());
             CSVReader csvReader = new CSVReader(reader)) {

            String[] header = csvReader.readNext();
            if (header == null) {
                throw new IllegalArgumentException("Uploaded CSV file is completely empty.");
            }

            String batchId = "batch_" + System.currentTimeMillis();
            String originalFileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "uploaded_orders.csv";

            // Map header column names to indexes
            int orderIdIdx = -1;
            int nameIdx = -1;
            int emailIdx = -1;
            int amountIdx = -1;
            int statusIdx = -1;
            int paymentIdIdx = -1;
            int feeIdx = -1;
            int utrIdx = -1;

            for (int i = 0; i < header.length; i++) {
                String h = header[i].trim().toLowerCase().replace(" ", "_").replace("-", "_");
                if (h.contains("order_id") || h.contains("orderid") || h.equals("id") || h.contains("order_no") || h.contains("invoice")) {
                    if (orderIdIdx == -1) orderIdIdx = i;
                } else if (h.contains("customer") || h.contains("name") || h.contains("buyer") || h.contains("client")) {
                    if (nameIdx == -1) nameIdx = i;
                } else if (h.contains("email") || h.contains("mail")) {
                    if (emailIdx == -1) emailIdx = i;
                } else if (h.contains("amount") || h.contains("total") || h.contains("price") || h.contains("gross") || h.contains("value")) {
                    if (amountIdx == -1) amountIdx = i;
                } else if (h.contains("status") || h.contains("state")) {
                    if (statusIdx == -1) statusIdx = i;
                } else if (h.contains("payment_id") || h.contains("paymentid") || h.contains("pay_id") || h.contains("txn_id") || h.contains("transaction_id")) {
                    if (paymentIdIdx == -1) paymentIdIdx = i;
                } else if (h.contains("fee") || h.contains("mdr") || h.contains("charge")) {
                    if (feeIdx == -1) feeIdx = i;
                } else if (h.contains("utr") || h.contains("bank_ref") || h.contains("ref_no")) {
                    if (utrIdx == -1) utrIdx = i;
                }
            }

            // Fallback default index assumptions if header was not recognized
            if (orderIdIdx == -1) orderIdIdx = 0;
            if (amountIdx == -1) {
                for (int i = 0; i < header.length; i++) {
                    if (i != orderIdIdx && i != nameIdx && i != emailIdx) {
                        amountIdx = i;
                        break;
                    }
                }
            }
            if (amountIdx == -1 && header.length > 1) amountIdx = 1;

            List<OrderRecord> orders = new ArrayList<>();
            List<RazorpaySettlement> settlements = new ArrayList<>();
            List<BankTransaction> bankTxs = new ArrayList<>();

            String[] line;
            int count = 0;
            BigDecimal totalGross = BigDecimal.ZERO;
            LocalDateTime now = LocalDateTime.now();

            while ((line = csvReader.readNext()) != null) {
                if (line.length == 0 || (line.length == 1 && line[0].trim().isEmpty())) {
                    continue;
                }

                String orderId = (orderIdIdx < line.length && !line[orderIdIdx].trim().isEmpty())
                        ? line[orderIdIdx].trim()
                        : "ORD_UP_" + (count + 1);

                String customerName = (nameIdx >= 0 && nameIdx < line.length && !line[nameIdx].trim().isEmpty())
                        ? line[nameIdx].trim()
                        : "Customer " + (count + 1);

                String customerEmail = (emailIdx >= 0 && emailIdx < line.length && !line[emailIdx].trim().isEmpty())
                        ? line[emailIdx].trim()
                        : customerName.toLowerCase().replace(" ", ".") + "@example.com";

                String amountStr = (amountIdx >= 0 && amountIdx < line.length) ? line[amountIdx].trim() : "1000";
                BigDecimal amount = cleanAndParseAmount(amountStr);

                String status = (statusIdx >= 0 && statusIdx < line.length && !line[statusIdx].trim().isEmpty())
                        ? line[statusIdx].trim()
                        : "PAID";

                String paymentId = (paymentIdIdx >= 0 && paymentIdIdx < line.length && !line[paymentIdIdx].trim().isEmpty())
                        ? line[paymentIdIdx].trim()
                        : "pay_UP_" + (count + 10001);

                BigDecimal actualFee = null;
                if (feeIdx >= 0 && feeIdx < line.length && !line[feeIdx].trim().isEmpty()) {
                    actualFee = cleanAndParseAmount(line[feeIdx].trim());
                } else {
                    actualFee = amount.multiply(BigDecimal.valueOf(0.02)).setScale(2, RoundingMode.HALF_UP);
                }

                BigDecimal actualTax = actualFee.multiply(BigDecimal.valueOf(0.18)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal net = amount.subtract(actualFee).subtract(actualTax);

                String bankUtr = (utrIdx >= 0 && utrIdx < line.length && !line[utrIdx].trim().isEmpty())
                        ? line[utrIdx].trim()
                        : "UTR_HDFC_UP_" + (count + 90001);

                // Create OrderRecord
                OrderRecord o = new OrderRecord(orderId, customerName, customerEmail, amount, status, now.minusDays(1), paymentId);
                o.setBatchId(batchId);
                orders.add(o);

                // Create Razorpay settlement layer
                RazorpaySettlement s = new RazorpaySettlement();
                s.setPaymentId(paymentId);
                s.setBatchId(batchId);
                s.setOrderId(orderId);
                s.setGrossAmount(amount);
                s.setFee(actualFee);
                s.setTax(actualTax);
                s.setNetAmount(net);
                s.setMethod("upi");
                s.setSettlementId("setl_UP_BATCH");
                s.setBankUtr(bankUtr);
                s.setPaymentCreatedAt(now.minusDays(1));
                s.setSettledAt(now);
                s.setStatus("captured");
                settlements.add(s);

                // Create Bank Credit layer
                BankTransaction b = new BankTransaction();
                b.setBankUtr(bankUtr);
                b.setBatchId(batchId);
                b.setCreditedAmount(net);
                b.setSenderDescription("RAZORPAY NODAL SETTLEMENT");
                b.setCreditTimestamp(now);
                b.setAccountNumberLast4("4412");
                b.setBankName("HDFC");
                bankTxs.add(b);

                totalGross = totalGross.add(amount);
                count++;
            }

            if (count == 0) {
                throw new IllegalArgumentException("No valid transaction rows found in CSV file.");
            }

            orderRepo.saveAll(orders);
            settlementRepo.saveAll(settlements);
            bankRepo.saveAll(bankTxs);

            ReconciliationSummary summary = reconService.runReconciliationForBatch(batchId);

            AuditBatch auditBatch = new AuditBatch(batchId, originalFileName, now);
            updateBatchWithSummary(auditBatch, summary);
            batchRepo.save(auditBatch);

            Map<String, Object> result = new HashMap<>();
            result.put("batchId", batchId);
            result.put("fileName", originalFileName);
            result.put("message", "Successfully parsed and reconciled " + count + " orders from " + originalFileName);
            result.put("count", count);
            result.put("totalGross", totalGross);
            result.put("summary", summary);
            result.put("reportUrl", "/report.html?batchId=" + batchId);
            return result;
        }
    }

    private void updateBatchWithSummary(AuditBatch b, ReconciliationSummary s) {
        b.setTotalOrders((int) s.getTotalOrders());
        b.setReconciledOrders((int) s.getReconciledOrders());
        b.setDiscrepancyCount((int) s.getDiscrepancyCount());
        b.setHealthScorePercentage(s.getHealthScorePercentage());
        b.setTotalGrossVolume(s.getTotalGrossVolume());
        b.setTotalExpectedMdrFee(s.getTotalExpectedMdrFee());
        b.setTotalActualMdrFee(s.getTotalActualMdrFee());
        b.setTotalGstTax(s.getTotalGstTax());
        b.setTotalSettledToBank(s.getTotalSettledToBank());
        b.setTotalDiscrepancyAmount(s.getTotalDiscrepancyAmount());
        b.setMdrFeeMismatches((int) s.getMdrFeeMismatches());
        b.setDelayedSettlements((int) s.getDelayedSettlements());
        b.setMissingBankCredits((int) s.getMissingBankCredits());
    }

    private BigDecimal cleanAndParseAmount(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return BigDecimal.valueOf(1000.00);
        }
        String cleaned = raw.replaceAll("[^0-9.]", "").trim();
        if (cleaned.isEmpty()) {
            return BigDecimal.valueOf(1000.00);
        }
        try {
            return new BigDecimal(cleaned).setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            return BigDecimal.valueOf(1000.00);
        }
    }

    public String generateSampleCsvContent() {
        return "order_id,customer_name,customer_email,amount,status,payment_id,fee,bank_utr\n" +
               "ORD_CSV_101,Aarav Sharma,aarav@example.com,4500.00,PAID,pay_RZP_CSV_101,90.00,UTR_HDFC_CSV_101\n" +
               "ORD_CSV_102,Priya Patel,priya@example.com,8200.00,PAID,pay_RZP_CSV_102,164.00,UTR_ICICI_CSV_102\n" +
               "ORD_CSV_103,Rohan Verma,rohan@example.com,3100.00,PAID,pay_RZP_CSV_103,62.00,UTR_SBI_CSV_103\n" +
               "ORD_CSV_104,Sneha Reddy,sneha@example.com,12500.00,PAID,pay_RZP_CSV_104,437.50,UTR_AXIS_CSV_104\n" +
               "ORD_CSV_105,Vikram Singh,vikram@example.com,6700.00,PAID,pay_RZP_CSV_105,134.00,UTR_KOTAK_CSV_105\n";
    }
}
