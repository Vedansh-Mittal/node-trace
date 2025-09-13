const { ethers } = require("ethers");
require("dotenv").config();

// Contract ABI (Application Binary Interface)
const CONTRACT_ABI = [
  "function createBatch(string _transactionId, string _batchId, string _parentBatchId, uint256 _costPrice, uint256 _sellingPrice, tuple(string farmId, string cropType, string harvestDate, uint256 quantityKg, string geoLocation, tuple(string batchOrLot, string countryOfOrigin, string productionDate, string gtin) gs1, tuple(string certificateId, string issuer, string verificationHash)[] certificates) _farmerData)",
  "function addProcessorData(string _transactionId, string _batchId, uint256 _costPrice, uint256 _sellingPrice, tuple(string processorId, string[] processTypes, string inputBatch, uint256 outputQuantityKg, string processingDate, string gs1Gtin) _processorData, string _correctionOf)",
  "function addDistributorData(string _transactionId, string _batchId, uint256 _costPrice, uint256 _sellingPrice, tuple(string distributorId, string dispatchDate, string transportMode, string destinationGln, string expiryDate) _distributorData, string _correctionOf)",
  "function addRetailerData(string _transactionId, string _batchId, uint256 _costPrice, uint256 _sellingPrice, tuple(string retailerId, string shelfDate, uint256 retailPrice, string retailLocationGln) _retailerData, string _correctionOf)",
  "function markAsSold(string _transactionId, string _batchId, tuple(string purchaseDate, string paymentMode, string consumerId) _consumerData)",
  "function getFullTrace(string _batchId) view returns (tuple(string transactionId, uint256 timestamp, string creator, string currentOwner, string[] previousOwners, string batchId, string parentBatchId, uint256 costPrice, uint256 sellingPrice, bytes32 transactionHash, bytes32 previousHash, string correctionOf, tuple(string farmId, string cropType, string harvestDate, uint256 quantityKg, string geoLocation, tuple(string batchOrLot, string countryOfOrigin, string productionDate, string gtin) gs1, tuple(string certificateId, string issuer, string verificationHash)[] certificates) farmer, tuple(string processorId, string[] processTypes, string inputBatch, uint256 outputQuantityKg, string processingDate, string gs1Gtin) processor, tuple(string distributorId, string dispatchDate, string transportMode, string destinationGln, string expiryDate) distributor, tuple(string retailerId, string shelfDate, uint256 retailPrice, string retailLocationGln) retailer, tuple(string purchaseDate, string paymentMode, string consumerId) consumer, bool isActive, bool isSold)[])",
  "function getCurrentTransaction(string _batchId) view returns (tuple(string transactionId, uint256 timestamp, string creator, string currentOwner, string[] previousOwners, string batchId, string parentBatchId, uint256 costPrice, uint256 sellingPrice, bytes32 transactionHash, bytes32 previousHash, string correctionOf, tuple(string farmId, string cropType, string harvestDate, uint256 quantityKg, string geoLocation, tuple(string batchOrLot, string countryOfOrigin, string productionDate, string gtin) gs1, tuple(string certificateId, string issuer, string verificationHash)[] certificates) farmer, tuple(string processorId, string[] processTypes, string inputBatch, uint256 outputQuantityKg, string processingDate, string gs1Gtin) processor, tuple(string distributorId, string dispatchDate, string transportMode, string destinationGln, string expiryDate) distributor, tuple(string retailerId, string shelfDate, uint256 retailPrice, string retailLocationGln) retailer, tuple(string purchaseDate, string paymentMode, string consumerId) consumer, bool isActive, bool isSold))",
  "function verifyCertificate(string _verificationHash) view returns (string)",
  "function getBatchStatus(string _batchId) view returns (bool exists, bool sold, uint256 transactionCount)",
  "event BatchCreated(string indexed batchId, string creator, uint256 timestamp)",
  "event DataAdded(string indexed batchId, string actor, uint256 timestamp)",
  "event BatchSold(string indexed batchId, uint256 timestamp)",
  "event CorrectionMade(string indexed batchId, string correctionOf, uint256 timestamp)"
];

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.initialize();
  }

  async initialize() {
    try {
      // Connect to Ganache
      this.provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL || "http://127.0.0.1:7545");
      
      // Create signer
      this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      
      // Load contract
      const contractAddress = process.env.CONTRACT_ADDRESS;
      if (contractAddress) {
        this.contract = new ethers.Contract(contractAddress, CONTRACT_ABI, this.signer);
        console.log("✅ Connected to Traceability contract at:", contractAddress);
      } else {
        console.log("⚠️  CONTRACT_ADDRESS not set in environment variables");
      }
    } catch (error) {
      console.error("❌ Failed to initialize blockchain service:", error.message);
    }
  }

  generateTransactionId() {
    return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async createBatch(batchData) {
    try {
      const transactionId = this.generateTransactionId();
      
      const farmerData = {
        farmId: batchData.farmer.farmId,
        cropType: batchData.farmer.cropType,
        harvestDate: batchData.farmer.harvestDate,
        quantityKg: batchData.farmer.quantityKg,
        geoLocation: batchData.farmer.geoLocation,
        gs1: {
          batchOrLot: batchData.farmer.gs1.batchOrLot,
          countryOfOrigin: batchData.farmer.gs1.countryOfOrigin,
          productionDate: batchData.farmer.gs1.productionDate,
          gtin: batchData.farmer.gs1.gtin || ""
        },
        certificates: batchData.farmer.certificates || []
      };

      const tx = await this.contract.createBatch(
        transactionId,
        batchData.batchId,
        batchData.parentBatchId || "",
        ethers.parseEther(batchData.costPrice.toString()),
        ethers.parseEther(batchData.sellingPrice.toString()),
        farmerData
      );

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionId,
        blockchainTxHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error("Error creating batch:", error);
      throw new Error(`Failed to create batch: ${error.message}`);
    }
  }

  async addProcessorData(batchId, processorData, correctionOf = "") {
    try {
      const transactionId = this.generateTransactionId();
      
      const processData = {
        processorId: processorData.processorId,
        processTypes: processorData.processTypes || [],
        inputBatch: processorData.inputBatch,
        outputQuantityKg: processorData.outputQuantityKg,
        processingDate: processorData.processingDate,
        gs1Gtin: processorData.gs1Gtin || ""
      };

      const tx = await this.contract.addProcessorData(
        transactionId,
        batchId,
        ethers.parseEther(processorData.costPrice.toString()),
        ethers.parseEther(processorData.sellingPrice.toString()),
        processData,
        correctionOf
      );

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionId,
        blockchainTxHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error("Error adding processor data:", error);
      throw new Error(`Failed to add processor data: ${error.message}`);
    }
  }

  async addDistributorData(batchId, distributorData, correctionOf = "") {
    try {
      const transactionId = this.generateTransactionId();
      
      const distData = {
        distributorId: distributorData.distributorId,
        dispatchDate: distributorData.dispatchDate,
        transportMode: distributorData.transportMode,
        destinationGln: distributorData.destinationGln,
        expiryDate: distributorData.expiryDate
      };

      const tx = await this.contract.addDistributorData(
        transactionId,
        batchId,
        ethers.parseEther(distributorData.costPrice.toString()),
        ethers.parseEther(distributorData.sellingPrice.toString()),
        distData,
        correctionOf
      );

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionId,
        blockchainTxHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error("Error adding distributor data:", error);
      throw new Error(`Failed to add distributor data: ${error.message}`);
    }
  }

  async addRetailerData(batchId, retailerData, correctionOf = "") {
    try {
      const transactionId = this.generateTransactionId();
      
      const retData = {
        retailerId: retailerData.retailerId,
        shelfDate: retailerData.shelfDate,
        retailPrice: ethers.parseEther(retailerData.retailPrice.toString()),
        retailLocationGln: retailerData.retailLocationGln
      };

      const tx = await this.contract.addRetailerData(
        transactionId,
        batchId,
        ethers.parseEther(retailerData.costPrice.toString()),
        ethers.parseEther(retailerData.sellingPrice.toString()),
        retData,
        correctionOf
      );

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionId,
        blockchainTxHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error("Error adding retailer data:", error);
      throw new Error(`Failed to add retailer data: ${error.message}`);
    }
  }

  async markAsSold(batchId, consumerData) {
    try {
      const transactionId = this.generateTransactionId();
      
      const conData = {
        purchaseDate: consumerData.purchaseDate,
        paymentMode: consumerData.paymentMode,
        consumerId: consumerData.consumerId
      };

      const tx = await this.contract.markAsSold(
        transactionId,
        batchId,
        conData
      );

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionId,
        blockchainTxHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error("Error marking as sold:", error);
      throw new Error(`Failed to mark as sold: ${error.message}`);
    }
  }

  async getFullTrace(batchId) {
    try {
      const trace = await this.contract.getFullTrace(batchId);
      
      return trace.map(tx => ({
        transactionId: tx.transactionId,
        timestamp: Number(tx.timestamp),
        creator: tx.creator,
        currentOwner: tx.currentOwner,
        previousOwners: tx.previousOwners,
        batchId: tx.batchId,
        parentBatchId: tx.parentBatchId,
        costPrice: ethers.formatEther(tx.costPrice),
        sellingPrice: ethers.formatEther(tx.sellingPrice),
        transactionHash: tx.transactionHash,
        previousHash: tx.previousHash,
        correctionOf: tx.correctionOf,
        farmer: {
          farmId: tx.farmer.farmId,
          cropType: tx.farmer.cropType,
          harvestDate: tx.farmer.harvestDate,
          quantityKg: Number(tx.farmer.quantityKg),
          geoLocation: tx.farmer.geoLocation,
          gs1: tx.farmer.gs1,
          certificates: tx.farmer.certificates
        },
        processor: tx.processor,
        distributor: tx.distributor,
        retailer: {
          ...tx.retailer,
          retailPrice: ethers.formatEther(tx.retailer.retailPrice)
        },
        consumer: tx.consumer,
        isActive: tx.isActive,
        isSold: tx.isSold
      }));
    } catch (error) {
      console.error("Error getting full trace:", error);
      throw new Error(`Failed to get trace: ${error.message}`);
    }
  }

  async getCurrentTransaction(batchId) {
    try {
      const tx = await this.contract.getCurrentTransaction(batchId);
      
      return {
        transactionId: tx.transactionId,
        timestamp: Number(tx.timestamp),
        creator: tx.creator,
        currentOwner: tx.currentOwner,
        previousOwners: tx.previousOwners,
        batchId: tx.batchId,
        parentBatchId: tx.parentBatchId,
        costPrice: ethers.formatEther(tx.costPrice),
        sellingPrice: ethers.formatEther(tx.sellingPrice),
        transactionHash: tx.transactionHash,
        previousHash: tx.previousHash,
        correctionOf: tx.correctionOf,
        farmer: {
          farmId: tx.farmer.farmId,
          cropType: tx.farmer.cropType,
          harvestDate: tx.farmer.harvestDate,
          quantityKg: Number(tx.farmer.quantityKg),
          geoLocation: tx.farmer.geoLocation,
          gs1: tx.farmer.gs1,
          certificates: tx.farmer.certificates
        },
        processor: tx.processor,
        distributor: tx.distributor,
        retailer: {
          ...tx.retailer,
          retailPrice: ethers.formatEther(tx.retailer.retailPrice)
        },
        consumer: tx.consumer,
        isActive: tx.isActive,
        isSold: tx.isSold
      };
    } catch (error) {
      console.error("Error getting current transaction:", error);
      throw new Error(`Failed to get current transaction: ${error.message}`);
    }
  }

  async verifyCertificate(verificationHash) {
    try {
      const certificateId = await this.contract.verifyCertificate(verificationHash);
      return certificateId;
    } catch (error) {
      console.error("Error verifying certificate:", error);
      throw new Error(`Failed to verify certificate: ${error.message}`);
    }
  }

  async getBatchStatus(batchId) {
    try {
      const [exists, sold, transactionCount] = await this.contract.getBatchStatus(batchId);
      return {
        exists,
        sold,
        transactionCount: Number(transactionCount)
      };
    } catch (error) {
      console.error("Error getting batch status:", error);
      throw new Error(`Failed to get batch status: ${error.message}`);
    }
  }
}

module.exports = BlockchainService;