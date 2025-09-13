const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Traceability Contract", function () {
  let traceability;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const Traceability = await ethers.getContractFactory("Traceability");
    traceability = await Traceability.deploy();
    await traceability.waitForDeployment();
  });

  describe("Batch Creation", function () {
    it("Should create a new batch", async function () {
      const batchId = "BATCH-TEST-001";
      const transactionId = "TXN-001";
      
      const farmerData = {
        farmId: "FARM001",
        cropType: "Wheat",
        harvestDate: "2025-09-01",
        quantityKg: 1000,
        geoLocation: "28.6139,77.2090",
        gs1: {
          batchOrLot: "LOT-001",
          countryOfOrigin: "IN",
          productionDate: "2025-09-01",
          gtin: "12345"
        },
        certificates: []
      };

      await traceability.createBatch(
        transactionId,
        batchId,
        "",
        ethers.parseEther("0"),
        ethers.parseEther("25.50"),
        farmerData
      );

      const status = await traceability.getBatchStatus(batchId);
      expect(status.exists).to.be.true;
      expect(status.sold).to.be.false;
      expect(status.transactionCount).to.equal(1);
    });

    it("Should not allow duplicate batch creation", async function () {
      const batchId = "BATCH-TEST-002";
      const transactionId = "TXN-002";
      
      const farmerData = {
        farmId: "FARM001",
        cropType: "Wheat",
        harvestDate: "2025-09-01",
        quantityKg: 1000,
        geoLocation: "28.6139,77.2090",
        gs1: {
          batchOrLot: "LOT-001",
          countryOfOrigin: "IN",
          productionDate: "2025-09-01",
          gtin: "12345"
        },
        certificates: []
      };

      // First creation should succeed
      await traceability.createBatch(
        transactionId,
        batchId,
        "",
        ethers.parseEther("0"),
        ethers.parseEther("25.50"),
        farmerData
      );

      // Second creation should fail
      await expect(
        traceability.createBatch(
          "TXN-003",
          batchId,
          "",
          ethers.parseEther("0"),
          ethers.parseEther("25.50"),
          farmerData
        )
      ).to.be.revertedWith("Batch already exists");
    });
  });

  describe("Supply Chain Flow", function () {
    let batchId;

    beforeEach(async function () {
      batchId = "BATCH-FLOW-001";
      
      // Create farmer batch first
      const farmerData = {
        farmId: "FARM001",
        cropType: "Wheat",
        harvestDate: "2025-09-01",
        quantityKg: 1000,
        geoLocation: "28.6139,77.2090",
        gs1: {
          batchOrLot: "LOT-001",
          countryOfOrigin: "IN",
          productionDate: "2025-09-01",
          gtin: "12345"
        },
        certificates: []
      };

      await traceability.createBatch(
        "TXN-FARMER",
        batchId,
        "",
        ethers.parseEther("0"),
        ethers.parseEther("25.50"),
        farmerData
      );
    });

    it("Should add processor data", async function () {
      const processorData = {
        processorId: "PROC001",
        processTypes: ["Milling", "Cleaning"],
        inputBatch: batchId,
        outputQuantityKg: 950,
        processingDate: "2025-09-05",
        gs1Gtin: "8901234567890"
      };

      await traceability.addProcessorData(
        "TXN-PROCESSOR",
        batchId,
        ethers.parseEther("25.50"),
        ethers.parseEther("24.00"),
        processorData,
        ""
      );

      const trace = await traceability.getFullTrace(batchId);
      expect(trace.length).to.equal(2);
      expect(trace[1].creator).to.equal("processor");
    });

    it("Should add distributor data", async function () {
      // Add processor first
      const processorData = {
        processorId: "PROC001",
        processTypes: ["Milling"],
        inputBatch: batchId,
        outputQuantityKg: 950,
        processingDate: "2025-09-05",
        gs1Gtin: "8901234567890"
      };

      await traceability.addProcessorData(
        "TXN-PROCESSOR",
        batchId,
        ethers.parseEther("25.50"),
        ethers.parseEther("24.00"),
        processorData,
        ""
      );

      // Add distributor
      const distributorData = {
        distributorId: "DIST001",
        dispatchDate: "2025-09-08",
        transportMode: "Truck",
        destinationGln: "GLN-DEST-001",
        expiryDate: "2026-01-01"
      };

      await traceability.addDistributorData(
        "TXN-DISTRIBUTOR",
        batchId,
        ethers.parseEther("24.00"),
        ethers.parseEther("26.50"),
        distributorData,
        ""
      );

      const trace = await traceability.getFullTrace(batchId);
      expect(trace.length).to.equal(3);
      expect(trace[2].creator).to.equal("distributor");
    });

    it("Should complete the full supply chain", async function () {
      // Add all actors in sequence
      
      // Processor
      await traceability.addProcessorData(
        "TXN-PROCESSOR",
        batchId,
        ethers.parseEther("25.50"),
        ethers.parseEther("24.00"),
        {
          processorId: "PROC001",
          processTypes: ["Milling"],
          inputBatch: batchId,
          outputQuantityKg: 950,
          processingDate: "2025-09-05",
          gs1Gtin: "8901234567890"
        },
        ""
      );

      // Distributor
      await traceability.addDistributorData(
        "TXN-DISTRIBUTOR",
        batchId,
        ethers.parseEther("24.00"),
        ethers.parseEther("26.50"),
        {
          distributorId: "DIST001",
          dispatchDate: "2025-09-08",
          transportMode: "Truck",
          destinationGln: "GLN-DEST-001",
          expiryDate: "2026-01-01"
        },
        ""
      );

      // Retailer
      await traceability.addRetailerData(
        "TXN-RETAILER",
        batchId,
        ethers.parseEther("26.50"),
        ethers.parseEther("28.00"),
        {
          retailerId: "RETAIL001",
          shelfDate: "2025-09-10",
          retailPrice: ethers.parseEther("30.00"),
          retailLocationGln: "GLN-RETAIL-001"
        },
        ""
      );

      // Consumer
      await traceability.markAsSold(
        "TXN-CONSUMER",
        batchId,
        {
          purchaseDate: "2025-09-12",
          paymentMode: "UPI",
          consumerId: "CONSUMER001"
        }
      );

      const trace = await traceability.getFullTrace(batchId);
      expect(trace.length).to.equal(5);
      
      const status = await traceability.getBatchStatus(batchId);
      expect(status.sold).to.be.true;
    });
  });

  describe("Corrections", function () {
    let batchId;

    beforeEach(async function () {
      batchId = "BATCH-CORRECTION-001";
      
      // Create farmer batch
      await traceability.createBatch(
        "TXN-FARMER",
        batchId,
        "",
        ethers.parseEther("0"),
        ethers.parseEther("25.50"),
        {
          farmId: "FARM001",
          cropType: "Wheat",
          harvestDate: "2025-09-01",
          quantityKg: 1000,
          geoLocation: "28.6139,77.2090",
          gs1: {
            batchOrLot: "LOT-001",
            countryOfOrigin: "IN",
            productionDate: "2025-09-01",
            gtin: "12345"
          },
          certificates: []
        }
      );
    });

    it("Should allow corrections with reference to original transaction", async function () {
      // Add initial processor data
      await traceability.addProcessorData(
        "TXN-PROCESSOR-1",
        batchId,
        ethers.parseEther("25.50"),
        ethers.parseEther("22.00"), // Wrong price
        {
          processorId: "PROC001",
          processTypes: ["Milling"],
          inputBatch: batchId,
          outputQuantityKg: 900, // Wrong quantity
          processingDate: "2025-09-05",
          gs1Gtin: "8901234567890"
        },
        ""
      );

      // Add correction
      await traceability.addProcessorData(
        "TXN-PROCESSOR-2",
        batchId,
        ethers.parseEther("25.50"),
        ethers.parseEther("24.00"), // Corrected price
        {
          processorId: "PROC001",
          processTypes: ["Milling", "Cleaning"], // Added process
          inputBatch: batchId,
          outputQuantityKg: 950, // Corrected quantity
          processingDate: "2025-09-05",
          gs1Gtin: "8901234567890"
        },
        "TXN-PROCESSOR-1" // Reference to corrected transaction
      );

      const trace = await traceability.getFullTrace(batchId);
      expect(trace.length).to.equal(3); // Farmer + 2 processor transactions
      expect(trace[2].correctionOf).to.equal("TXN-PROCESSOR-1");
    });
  });

  describe("Read-Only Mode", function () {
    let batchId;

    beforeEach(async function () {
      batchId = "BATCH-READONLY-001";
      
      // Create and complete full chain
      await traceability.createBatch(
        "TXN-FARMER",
        batchId,
        "",
        ethers.parseEther("0"),
        ethers.parseEther("25.50"),
        {
          farmId: "FARM001",
          cropType: "Wheat",
          harvestDate: "2025-09-01",
          quantityKg: 1000,
          geoLocation: "28.6139,77.2090",
          gs1: {
            batchOrLot: "LOT-001",
            countryOfOrigin: "IN",
            productionDate: "2025-09-01",
            gtin: "12345"
          },
          certificates: []
        }
      );

      // Mark as sold
      await traceability.markAsSold(
        "TXN-CONSUMER",
        batchId,
        {
          purchaseDate: "2025-09-12",
          paymentMode: "UPI",
          consumerId: "CONSUMER001"
        }
      );
    });

    it("Should prevent modifications after batch is sold", async function () {
      // Try to add processor data after sold
      await expect(
        traceability.addProcessorData(
          "TXN-PROCESSOR",
          batchId,
          ethers.parseEther("25.50"),
          ethers.parseEther("24.00"),
          {
            processorId: "PROC001",
            processTypes: ["Milling"],
            inputBatch: batchId,
            outputQuantityKg: 950,
            processingDate: "2025-09-05",
            gs1Gtin: "8901234567890"
          },
          ""
        )
      ).to.be.revertedWith("Batch has been sold and is now read-only");
    });

    it("Should still allow reading trace data", async function () {
      const trace = await traceability.getFullTrace(batchId);
      expect(trace.length).to.be.greaterThan(0);
      
      const status = await traceability.getBatchStatus(batchId);
      expect(status.sold).to.be.true;
    });
  });

  describe("Certificate Verification", function () {
    it("Should store and verify certificates", async function () {
      const batchId = "BATCH-CERT-001";
      const verificationHash = "0xtest_hash_123";
      const certificateId = "CERT-123";
      
      const farmerData = {
        farmId: "FARM001",
        cropType: "Wheat",
        harvestDate: "2025-09-01",
        quantityKg: 1000,
        geoLocation: "28.6139,77.2090",
        gs1: {
          batchOrLot: "LOT-001",
          countryOfOrigin: "IN",
          productionDate: "2025-09-01",
          gtin: "12345"
        },
        certificates: [{
          certificateId: certificateId,
          issuer: "Test Issuer",
          verificationHash: verificationHash
        }]
      };

      await traceability.createBatch(
        "TXN-FARMER",
        batchId,
        "",
        ethers.parseEther("0"),
        ethers.parseEther("25.50"),
        farmerData
      );

      const verifiedCertId = await traceability.verifyCertificate(verificationHash);
      expect(verifiedCertId).to.equal(certificateId);
    });
  });
});