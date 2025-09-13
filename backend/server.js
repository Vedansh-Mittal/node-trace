const express = require("express");
const cors = require("cors");
const BlockchainService = require("./blockchain");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize blockchain service
const blockchain = new BlockchainService();

// Routes

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Traceability Blockchain API",
    version: "1.0.0",
    status: "running"
  });
});

// Create new batch (Farmer)
app.post("/api/batch/create", async (req, res) => {
  try {
    const { batchId, costPrice, sellingPrice, farmer, parentBatchId } = req.body;
    
    if (!batchId || !farmer) {
      return res.status(400).json({ error: "batchId and farmer data are required" });
    }

    const result = await blockchain.createBatch({
      batchId,
      parentBatchId,
      costPrice: costPrice || 0,
      sellingPrice: sellingPrice || 0,
      farmer
    });

    res.json(result);
  } catch (error) {
    console.error("Create batch error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add processor data
app.post("/api/batch/:batchId/processor", async (req, res) => {
  try {
    const { batchId } = req.params;
    const { processor, costPrice, sellingPrice, correctionOf } = req.body;
    
    if (!processor) {
      return res.status(400).json({ error: "processor data is required" });
    }

    const result = await blockchain.addProcessorData(
      batchId, 
      { ...processor, costPrice: costPrice || 0, sellingPrice: sellingPrice || 0 },
      correctionOf || ""
    );

    res.json(result);
  } catch (error) {
    console.error("Add processor data error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add distributor data
app.post("/api/batch/:batchId/distributor", async (req, res) => {
  try {
    const { batchId } = req.params;
    const { distributor, costPrice, sellingPrice, correctionOf } = req.body;
    
    if (!distributor) {
      return res.status(400).json({ error: "distributor data is required" });
    }

    const result = await blockchain.addDistributorData(
      batchId, 
      { ...distributor, costPrice: costPrice || 0, sellingPrice: sellingPrice || 0 },
      correctionOf || ""
    );

    res.json(result);
  } catch (error) {
    console.error("Add distributor data error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add retailer data
app.post("/api/batch/:batchId/retailer", async (req, res) => {
  try {
    const { batchId } = req.params;
    const { retailer, costPrice, sellingPrice, correctionOf } = req.body;
    
    if (!retailer) {
      return res.status(400).json({ error: "retailer data is required" });
    }

    const result = await blockchain.addRetailerData(
      batchId, 
      { ...retailer, costPrice: costPrice || 0, sellingPrice: sellingPrice || 0 },
      correctionOf || ""
    );

    res.json(result);
  } catch (error) {
    console.error("Add retailer data error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Mark as sold (Consumer purchase)
app.post("/api/batch/:batchId/sold", async (req, res) => {
  try {
    const { batchId } = req.params;
    const { consumer } = req.body;
    
    if (!consumer) {
      return res.status(400).json({ error: "consumer data is required" });
    }

    const result = await blockchain.markAsSold(batchId, consumer);

    res.json(result);
  } catch (error) {
    console.error("Mark as sold error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get full trace history
app.get("/api/batch/:batchId/trace", async (req, res) => {
  try {
    const { batchId } = req.params;
    const trace = await blockchain.getFullTrace(batchId);
    res.json(trace);
  } catch (error) {
    console.error("Get trace error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get current transaction
app.get("/api/batch/:batchId/current", async (req, res) => {
  try {
    const { batchId } = req.params;
    const current = await blockchain.getCurrentTransaction(batchId);
    res.json(current);
  } catch (error) {
    console.error("Get current transaction error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get batch status
app.get("/api/batch/:batchId/status", async (req, res) => {
  try {
    const { batchId } = req.params;
    const status = await blockchain.getBatchStatus(batchId);
    res.json(status);
  } catch (error) {
    console.error("Get batch status error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Verify certificate
app.get("/api/certificate/:hash/verify", async (req, res) => {
  try {
    const { hash } = req.params;
    const certificateId = await blockchain.verifyCertificate(hash);
    res.json({ 
      verificationHash: hash,
      certificateId: certificateId || null,
      isValid: !!certificateId
    });
  } catch (error) {
    console.error("Verify certificate error:", error);
    res.status(500).json({ error: error.message });
  }
});

// QR Code data endpoint (what consumers scan)
app.get("/api/qr/:batchId", async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const [status, current] = await Promise.all([
      blockchain.getBatchStatus(batchId),
      blockchain.getCurrentTransaction(batchId)
    ]);

    if (!status.exists) {
      return res.status(404).json({ error: "Batch not found" });
    }

    res.json({
      batchId,
      status: {
        exists: status.exists,
        sold: status.sold,
        readonly: status.sold,
        transactionCount: status.transactionCount
      },
      currentData: current,
      qrData: {
        batchId,
        productName: current.farmer.cropType,
        currentOwner: current.currentOwner,
        lastUpdated: new Date(current.timestamp * 1000).toISOString(),
        traceUrl: `/api/batch/${batchId}/trace`
      }
    });
  } catch (error) {
    console.error("QR data error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Example data endpoints for testing
app.get("/api/examples/farmer", (req, res) => {
  res.json({
    batchId: "BATCH-FARM-001",
    costPrice: 0,
    sellingPrice: 25.50,
    farmer: {
      farmId: "FARM123",
      cropType: "Wheat",
      harvestDate: "2025-09-01",
      quantityKg: 1200,
      geoLocation: "28.6139,77.2090",
      gs1: {
        batchOrLot: "LOT-2025-001",
        countryOfOrigin: "IN",
        productionDate: "2025-09-01",
        gtin: ""
      },
      certificates: [
        {
          certificateId: "FSSAI-998877",
          issuer: "FSSAI",
          verificationHash: "0xfssaihash001"
        }
      ]
    }
  });
});

app.get("/api/examples/processor", (req, res) => {
  res.json({
    costPrice: 25.50,
    sellingPrice: 24.00,
    processor: {
      processorId: "PROC001",
      processTypes: ["Milling", "Cleaning"],
      inputBatch: "BATCH-FARM-001",
      outputQuantityKg: 1150,
      processingDate: "2025-09-05",
      gs1Gtin: "GTIN-8901234567890"
    }
  });
});

app.get("/api/examples/distributor", (req, res) => {
  res.json({
    costPrice: 24.00,
    sellingPrice: 26.50,
    distributor: {
      distributorId: "DIST001",
      dispatchDate: "2025-09-08",
      transportMode: "Truck",
      destinationGln: "GLN-DELHI-001",
      expiryDate: "2026-01-01"
    }
  });
});

app.get("/api/examples/retailer", (req, res) => {
  res.json({
    costPrice: 26.50,
    sellingPrice: 28.00,
    retailer: {
      retailerId: "RETAIL001",
      shelfDate: "2025-09-10",
      retailPrice: 28.0,
      retailLocationGln: "GLN-DELHI-RETAIL-009"
    }
  });
});

app.get("/api/examples/consumer", (req, res) => {
  res.json({
    consumer: {
      purchaseDate: "2025-09-12",
      paymentMode: "UPI",
      consumerId: "pseudo123"
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Traceability API server running on port ${PORT}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}/`);
  console.log(`🔗 Blockchain: ${process.env.GANACHE_URL || "http://127.0.0.1:7545"}`);
});