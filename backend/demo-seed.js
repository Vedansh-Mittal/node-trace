const BlockchainService = require("./blockchain");
require("dotenv").config();

class DemoSeeder {
  constructor() {
    this.blockchain = new BlockchainService();
  }

  async seedDemoData() {
    console.log("🌱 Starting demo data seeding...");
    
    const batchId = `DEMO-BATCH-${Date.now()}`;
    
    try {
      // 1. Create Farmer Batch
      console.log("👨‍🌾 Creating farmer batch...");
      const farmerResult = await this.blockchain.createBatch({
        batchId,
        costPrice: 0,
        sellingPrice: 25.50,
        farmer: {
          farmId: "DEMO-FARM-001",
          cropType: "Organic Wheat",
          harvestDate: "2025-09-01",
          quantityKg: 1200,
          geoLocation: "28.6139,77.2090", // Delhi coordinates
          gs1: {
            batchOrLot: `LOT-${Date.now()}`,
            countryOfOrigin: "IN",
            productionDate: "2025-09-01",
            gtin: ""
          },
          certificates: [
            {
              certificateId: "FSSAI-DEMO-001",
              issuer: "FSSAI",
              verificationHash: "0xdemo_fssai_hash_001"
            },
            {
              certificateId: "ORGANIC-DEMO-001", 
              issuer: "India Organic Certification Agency",
              verificationHash: "0xdemo_organic_hash_001"
            }
          ]
        }
      });
      console.log("✅ Farmer batch created:", farmerResult.transactionId);

      // Wait a bit
      await this.sleep(2000);

      // 2. Add Processor Data
      console.log("🏭 Adding processor data...");
      const processorResult = await this.blockchain.addProcessorData(
        batchId,
        {
          costPrice: 25.50,
          sellingPrice: 24.00,
          processorId: "DEMO-PROC-001",
          processTypes: ["Milling", "Cleaning", "Grading"],
          inputBatch: batchId,
          outputQuantityKg: 1150,
          processingDate: "2025-09-05",
          gs1Gtin: "8901234567890"
        },
        "" // no correction
      );
      console.log("✅ Processor data added:", processorResult.transactionId);

      await this.sleep(2000);

      // 3. Add Distributor Data
      console.log("🚚 Adding distributor data...");
      const distributorResult = await this.blockchain.addDistributorData(
        batchId,
        {
          costPrice: 24.00,
          sellingPrice: 26.50,
          distributorId: "DEMO-DIST-001",
          dispatchDate: "2025-09-08",
          transportMode: "Truck",
          destinationGln: "GLN-DELHI-MARKET-001",
          expiryDate: "2026-01-01"
        },
        "" // no correction
      );
      console.log("✅ Distributor data added:", distributorResult.transactionId);

      await this.sleep(2000);

      // 4. Add Retailer Data
      console.log("🏪 Adding retailer data...");
      const retailerResult = await this.blockchain.addRetailerData(
        batchId,
        {
          costPrice: 26.50,
          sellingPrice: 28.00,
          retailerId: "DEMO-RETAIL-001",
          shelfDate: "2025-09-10",
          retailPrice: 30.00,
          retailLocationGln: "GLN-DELHI-STORE-001"
        },
        "" // no correction
      );
      console.log("✅ Retailer data added:", retailerResult.transactionId);

      await this.sleep(2000);

      // 5. Mark as Sold (Consumer Purchase)
      console.log("🛒 Recording consumer purchase...");
      const consumerResult = await this.blockchain.markAsSold(
        batchId,
        {
          purchaseDate: "2025-09-12",
          paymentMode: "UPI",
          consumerId: "DEMO-CONSUMER-001"
        }
      );
      console.log("✅ Consumer purchase recorded:", consumerResult.transactionId);

      console.log("\n🎉 Demo data seeding completed successfully!");
      console.log(`📋 Demo Batch ID: ${batchId}`);
      console.log("🔍 You can now search for this batch in the frontend");
      
      // Get final trace
      const trace = await this.blockchain.getFullTrace(batchId);
      console.log(`📊 Total transactions in chain: ${trace.length}`);
      
      return {
        success: true,
        batchId,
        transactionCount: trace.length,
        transactions: trace.map(tx => ({
          id: tx.transactionId,
          creator: tx.creator,
          timestamp: new Date(tx.timestamp * 1000).toISOString()
        }))
      };

    } catch (error) {
      console.error("❌ Error seeding demo data:", error);
      throw error;
    }
  }

  async seedCorrectionExample() {
    console.log("🔄 Starting correction example...");
    
    const batchId = `CORRECTION-DEMO-${Date.now()}`;
    
    try {
      // Create initial farmer batch
      const farmerResult = await this.blockchain.createBatch({
        batchId,
        costPrice: 0,
        sellingPrice: 20.00,
        farmer: {
          farmId: "CORRECTION-FARM-001",
          cropType: "Rice",
          harvestDate: "2025-09-01",
          quantityKg: 1000,
          geoLocation: "28.6139,77.2090",
          gs1: {
            batchOrLot: `LOT-CORRECTION-${Date.now()}`,
            countryOfOrigin: "IN",
            productionDate: "2025-09-01",
            gtin: ""
          },
          certificates: []
        }
      });

      await this.sleep(2000);

      // Add processor data with error
      const processorResult1 = await this.blockchain.addProcessorData(
        batchId,
        {
          costPrice: 20.00,
          sellingPrice: 22.00, // Wrong price
          processorId: "CORRECTION-PROC-001",
          processTypes: ["Milling"],
          inputBatch: batchId,
          outputQuantityKg: 900, // Wrong quantity
          processingDate: "2025-09-05",
          gs1Gtin: "1111111111111"
        },
        ""
      );

      await this.sleep(2000);

      // Correct the processor data
      const processorResult2 = await this.blockchain.addProcessorData(
        batchId,
        {
          costPrice: 20.00,
          sellingPrice: 21.50, // Corrected price
          processorId: "CORRECTION-PROC-001",
          processTypes: ["Milling", "Polishing"], // Added process
          inputBatch: batchId,
          outputQuantityKg: 950, // Corrected quantity
          processingDate: "2025-09-05",
          gs1Gtin: "1111111111111"
        },
        processorResult1.transactionId // Correcting previous transaction
      );

      console.log("✅ Correction example completed!");
      console.log(`📋 Correction Demo Batch ID: ${batchId}`);
      console.log(`🔄 Original transaction: ${processorResult1.transactionId}`);
      console.log(`✅ Correction transaction: ${processorResult2.transactionId}`);

      return {
        success: true,
        batchId,
        originalTransaction: processorResult1.transactionId,
        correctionTransaction: processorResult2.transactionId
      };

    } catch (error) {
      console.error("❌ Error creating correction example:", error);
      throw error;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
async function main() {
  const seeder = new DemoSeeder();
  const args = process.argv.slice(2);
  
  try {
    if (args.includes('--correction')) {
      await seeder.seedCorrectionExample();
    } else {
      await seeder.seedDemoData();
    }
  } catch (error) {
    console.error("Failed to seed demo data:", error);
    process.exit(1);
  }
}

// Export for use in other files
module.exports = DemoSeeder;

// Run if called directly
if (require.main === module) {
  main();
}