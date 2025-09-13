# Enhanced Blockchain Traceability System - Complete Setup Guide

This enhanced system includes QR codes, role-based workflows, correction history, multi-language support, dark/light mode, pricing in Rupees, and complete actor flows.

## 🚀 Quick Start

### Prerequisites
1. **Node.js** (v16+)
2. **Git**
3. **Ganache** (for local blockchain)

### Step 1: Install Ganache
```bash
# Download and install Ganache GUI from https://trufflesuite.com/ganache/
# Or use CLI version:
npm install -g ganache-cli
ganache-cli --port 7545 --deterministic
```

### Step 2: Setup Backend
```bash
cd backend
npm install
```

### Step 3: Configure Environment
Create `backend/.env`:
```
PRIVATE_KEY=0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
GANACHE_URL=http://127.0.0.1:7545
CONTRACT_ADDRESS=
```

### Step 4: Deploy Smart Contract
```bash
# Compile contract
npm run compile

# Deploy to Ganache
npm run deploy

# Copy the deployed contract address to .env
```

### Step 5: Start Backend Server
```bash
npm run dev
# Server will run on http://localhost:3001
```

### Step 6: Start Frontend
```bash
# In project root
npm install
npm run dev
# Frontend will run on http://localhost:5173
```

## 🎯 Demo & Testing

### Seed Demo Data
```bash
cd backend

# Create a complete supply chain demo
npm run seed

# Create correction example
npm run seed:correction
```

### Run Tests
```bash
cd backend
npm test
```

## 📱 New Features Overview

### 🌍 Multi-Language Support
- **English, Hindi, Odia** translations
- Dynamic language switching
- Complete UI translation

### 🎨 Theme Support
- **Light/Dark/System** theme modes
- Consistent design system
- Responsive layouts

### 💰 Currency & Pricing
- **Indian Rupees (₹)** as base currency
- Price transparency across supply chain
- Margin calculation for consumers

### 📱 QR Code System
- **Generate QR codes** for batches
- **Camera scanning** functionality
- **Persistent QR codes** throughout supply chain
- **Read-only mode** after consumer purchase

### 👥 Complete Actor Workflows

#### 1. Farmer Flow
```javascript
// Auto-populated fields:
- transactionId (auto-generated)
- timestamp (blockchain)
- creator ("farmer")
- currentOwner (farmId)
- hash & previousHash (blockchain)
- countryOfOrigin (default: "IN")

// Farmer fills:
- batchId
- farmId
- cropType
- quantity (kg)
- harvestDate
- geoLocation (with GPS auto-fill)
- costPrice (required for transparency)
- sellingPrice
- certificates (multiple)
```

#### 2. Processor Flow
```javascript
// Scans QR → views farmer data → adds:
- processorId
- processTypes (multiple, e.g., "Milling", "Cleaning")
- inputBatch (auto: scanned batchId)
- outputQuantity (kg)
- processingDate
- costPrice & sellingPrice
- gs1Gtin
```

#### 3. Distributor Flow
```javascript
// Scans QR → views chain → adds:
- distributorId
- dispatchDate
- transportMode (Truck/Ship/Air/Rail)
- destinationGln
- expiryDate (important for consumers)
- costPrice & sellingPrice
```

#### 4. Retailer Flow
```javascript
// Scans QR → views chain → adds:
- retailerId
- shelfDate
- retailPrice (final consumer price)
- retailLocationGln
- costPrice & sellingPrice
```

#### 5. Consumer Flow
```javascript
// Scans QR → views FULL CHAIN → can:
- See complete traceability
- View price breakdown
- Check certificates
- Record purchase (locks chain to read-only)
```

### 🔄 Correction System
- **Immutable corrections**: New transactions reference old ones
- **Correction history**: Shows all versions
- **Transparent edits**: Clearly marked corrections
- **Audit trail**: Complete correction timeline

### 👀 Consumer Transparency Features
- **Full supply chain visibility**
- **Price breakdown** (farmer → consumer)
- **Margin transparency** at each step
- **Certificate verification**
- **Expiry date tracking**
- **Fair farmer pricing** visibility

## 🔧 API Endpoints

### Core Operations
```bash
# Create farmer batch
POST /api/batch/create
{
  "batchId": "BATCH-FARM-001",
  "costPrice": 0,
  "sellingPrice": 25.50,
  "farmer": { ... }
}

# Add processor data
POST /api/batch/{batchId}/processor
{
  "costPrice": 25.50,
  "sellingPrice": 24.00,
  "processor": { ... },
  "correctionOf": "" // optional
}

# Add distributor data
POST /api/batch/{batchId}/distributor

# Add retailer data
POST /api/batch/{batchId}/retailer

# Mark as sold (consumer)
POST /api/batch/{batchId}/sold

# Get full trace
GET /api/batch/{batchId}/trace

# Get QR data (for consumers)
GET /api/qr/{batchId}
```

### Demo & Testing
```bash
# Seed demo data
POST /api/demo/seed

# Create correction example
POST /api/demo/correction

# Verify certificate
GET /api/certificate/{hash}/verify
```

## 🧪 Testing Scenarios

### 1. Complete Supply Chain Test
```bash
# Run demo seeder
npm run seed

# Search for generated batch ID in frontend
# Verify all 5 actors (Farmer → Consumer)
# Check price transparency
# Verify read-only mode after consumer purchase
```

### 2. Correction Flow Test
```bash
# Run correction demo
npm run seed:correction

# View correction history in frontend
# Verify original & corrected data visibility
```

### 3. QR Code Test
```bash
# Create/search batch → generate QR
# Scan QR with camera
# Verify batch loads correctly
```

### 4. Multi-Actor Test
```bash
# Create farmer batch
# Add processor data (with corrections)
# Add distributor data
# Add retailer data
# Record consumer purchase
# Verify read-only mode
```

## 🛡️ Security Features

- **Immutable blockchain** storage
- **Read-only mode** after consumer purchase
- **Certificate verification** on-chain
- **Transaction hash** validation
- **Owner transfer** tracking
- **Correction audit** trail

## 🔍 Debugging

### Common Issues
1. **Contract not deployed**: Run `npm run deploy`
2. **Ganache not running**: Start Ganache on port 7545
3. **Camera not working**: Check browser permissions
4. **Translation missing**: Check i18n files

### Logs
```bash
# Backend logs
npm run dev

# Check Ganache logs for blockchain transactions
# Browser console for frontend issues
```

## 📊 Data Schema (Final)

### Transaction Structure
```json
{
  "transactionId": "TXN-{timestamp}-{random}",
  "timestamp": "blockchain_timestamp",
  "creator": "farmer|processor|distributor|retailer|consumer",
  "currentOwner": "actor_id",
  "previousOwners": ["previous_actor_ids"],
  "batchId": "BATCH-FARM-001",
  "parentBatchId": "optional_parent",
  "costPrice": "₹25.50",
  "sellingPrice": "₹28.00",
  "transactionHash": "blockchain_hash",
  "previousHash": "previous_tx_hash",
  "correctionOf": "optional_corrected_tx_id",
  "farmer": { /* farm data */ },
  "processor": { /* processing data */ },
  "distributor": { /* distribution data */ },
  "retailer": { /* retail data */ },
  "consumer": { /* purchase data */ },
  "isActive": true,
  "isSold": false
}
```

## 🎯 Production Deployment

### Environment Setup
```bash
# For testnet deployment
PRIVATE_KEY=your_testnet_private_key
SEPOLIA_URL=https://sepolia.infura.io/v3/your_infura_key
CONTRACT_ADDRESS=deployed_contract_address
```

### Deploy to Testnet
```bash
npm run deploy:testnet
```

This enhanced system provides a complete, production-ready blockchain traceability solution with professional UX, multi-language support, and comprehensive actor workflows.