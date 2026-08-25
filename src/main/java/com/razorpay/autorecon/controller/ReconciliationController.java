package com.razorpay.autorecon.controller;

import com.razorpay.autorecon.model.*;
import com.razorpay.autorecon.repository.*;
import com.razorpay.autorecon.service.ReconciliationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recon")
@CrossOrigin(origins = "*")
public class ReconciliationController {

    private final ReconciliationService reconService;
    private final OrderRecordRepository orderRepo;
    private final RazorpaySettlementRepository settlementRepo;
    private final BankTransactionRepository bankRepo;
    private final DiscrepancyItemRepository discrepancyRepo;
    private final AuditBatchRepository batchRepo;

    public ReconciliationController(ReconciliationService reconService,
                                    OrderRecordRepository orderRepo,
                                    RazorpaySettlementRepository settlementRepo,
                                    BankTransactionRepository bankRepo,
                                    DiscrepancyItemRepository discrepancyRepo,
                                    AuditBatchRepository batchRepo) {
        this.reconService = reconService;
        this.orderRepo = orderRepo;
        this.settlementRepo = settlementRepo;
        this.bankRepo = bankRepo;
        this.discrepancyRepo = discrepancyRepo;
        this.batchRepo = batchRepo;
    }

    @GetMapping("/summary")
    public ResponseEntity<ReconciliationSummary> getSummary() {
        return ResponseEntity.ok(reconService.getSummary());
    }

    @PostMapping("/run")
    public ResponseEntity<ReconciliationSummary> triggerReconciliation() {
        return ResponseEntity.ok(reconService.runReconciliation());
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderRecord>> getOrders(@RequestParam(required = false) OrderRecord.ReconStatus status) {
        if (status != null) {
            return ResponseEntity.ok(orderRepo.findByReconStatus(status));
        }
        return ResponseEntity.ok(orderRepo.findAll());
    }

    @GetMapping("/settlements")
    public ResponseEntity<List<RazorpaySettlement>> getSettlements() {
        return ResponseEntity.ok(settlementRepo.findAll());
    }

    @GetMapping("/bank-txs")
    public ResponseEntity<List<BankTransaction>> getBankTransactions() {
        return ResponseEntity.ok(bankRepo.findAll());
    }

    @GetMapping("/discrepancies")
    public ResponseEntity<List<DiscrepancyItem>> getDiscrepancies(@RequestParam(required = false) Boolean unresolvedOnly) {
        if (Boolean.TRUE.equals(unresolvedOnly)) {
            return ResponseEntity.ok(discrepancyRepo.findByResolvedFalse());
        }
        return ResponseEntity.ok(discrepancyRepo.findAll());
    }

    @PostMapping("/discrepancies/{id}/resolve")
    public ResponseEntity<DiscrepancyItem> resolveDiscrepancy(@PathVariable Long id) {
        return discrepancyRepo.findById(id).map(d -> {
            d.setResolved(true);
            discrepancyRepo.save(d);
            orderRepo.findByOrderId(d.getOrderId()).ifPresent(o -> {
                o.setReconStatus(OrderRecord.ReconStatus.RECONCILED);
                orderRepo.save(o);
            });
            return ResponseEntity.ok(d);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ==========================================
    // BATCH-SPECIFIC MULTI-FILE AUDIT ENDPOINTS
    // ==========================================

    @GetMapping("/batches")
    public ResponseEntity<List<AuditBatch>> getAllBatches() {
        return ResponseEntity.ok(batchRepo.findAllByOrderByUploadedAtDesc());
    }

    @GetMapping("/batches/{batchId}")
    public ResponseEntity<AuditBatch> getBatchById(@PathVariable String batchId) {
        return batchRepo.findByBatchId(batchId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/batches/{batchId}/summary")
    public ResponseEntity<ReconciliationSummary> getBatchSummary(@PathVariable String batchId) {
        return ResponseEntity.ok(reconService.getSummaryForBatch(batchId));
    }

    @GetMapping("/batches/{batchId}/orders")
    public ResponseEntity<List<OrderRecord>> getBatchOrders(@PathVariable String batchId) {
        return ResponseEntity.ok(orderRepo.findByBatchId(batchId));
    }

    @GetMapping("/batches/{batchId}/discrepancies")
    public ResponseEntity<List<DiscrepancyItem>> getBatchDiscrepancies(@PathVariable String batchId) {
        return ResponseEntity.ok(discrepancyRepo.findByBatchId(batchId));
    }
}
