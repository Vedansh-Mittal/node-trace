# Blockchain Traceability Demo Setup

This guide will help you set up and run the complete blockchain traceability system locally.

## Prerequisites

1. **Node.js** (v16+)
2. **Ganache** - Local Ethereum blockchain
3. **Git** (for cloning)

## Quick Setup

### 1. Install Ganache

**Option A: Ganache GUI (Recommended for beginners)**
- Download from: https://www.trufflesuite.com/ganache
- Install and run with default settings (port 7545)

**Option B: Ganache CLI**
```bash
npm install -g ganache-cli
ganache-cli --host 0.0.0.0 --port 7545 --accounts 10 --deterministic
```

### 2. Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Edit .env file with your settings:
# PRIVATE_KEY=0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
# GANACHE_URL=http://127.0.0.1:7545
# PORT=3001

# Compile smart contracts
npm run compile

# Deploy to Ganache
npm run deploy

# Update CONTRACT_ADDRESS in .env with the deployed address from deploy output

# Start the backend server
npm run dev
```

### 3. Setup Frontend

```bash
# In the main project directory (not backend)
npm install
npm run dev
```

## Testing the System

### 1. Open the Frontend
Navigate to: http://localhost:8080

### 2. Test Backend API
Navigate to: http://localhost:3001

### 3. Create a Test Batch

**Using the Frontend:**
1. Go to "Create Batch" tab
2. Fill in the form with sample data
3. Click "Create Batch on Blockchain"

**Using API directly:**
```bash
# Get example farmer data
curl http://localhost:3001/api/examples/farmer

# Create a batch
curl -X POST http://localhost:3001/api/batch/create \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": "BATCH-FARM-001",
    "costPrice": 0,
    "sellingPrice": 25.50,
    "farmer": {
      "farmId": "FARM123",
      "cropType": "Wheat",
      "harvestDate": "2025-09-01",
      "quantityKg": 1200,
      "geoLocation": "28.6139,77.2090",
      "gs1": {
        "batchOrLot": "LOT-2025-001",
        "countryOfOrigin": "IN",
        "productionDate": "2025-09-01"
      },
      "certificates": [
        {
          "certificateId": "FSSAI-998877",
          "issuer": "FSSAI",
          "verificationHash": "0xfssaihash001"
        }
      ]
    }
  }'
```

### 4. Add Supply Chain Actors

**Add Processor:**
```bash
curl -X POST http://localhost:3001/api/batch/BATCH-FARM-001/processor \
  -H "Content-Type: application/json" \
  -d '{
    "costPrice": 25.50,
    "sellingPrice": 24.00,
    "processor": {
      "processorId": "PROC001",
      "processTypes": ["Milling", "Cleaning"],
      "inputBatch": "BATCH-FARM-001",
      "outputQuantityKg": 1150,
      "processingDate": "2025-09-05",
      "gs1Gtin": "GTIN-8901234567890"
    }
  }'
```

**Add Distributor:**
```bash
curl -X POST http://localhost:3001/api/batch/BATCH-FARM-001/distributor \
  -H "Content-Type: application/json" \
  -d '{
    "costPrice": 24.00,
    "sellingPrice": 26.50,
    "distributor": {
      "distributorId": "DIST001",
      "dispatchDate": "2025-09-08",
      "transportMode": "Truck",
      "destinationGln": "GLN-DELHI-001",
      "expiryDate": "2026-01-01"
    }
  }'
```

**Add Retailer:**
```bash
curl -X POST http://localhost:3001/api/batch/BATCH-FARM-001/retailer \
  -H "Content-Type: application/json" \
  -d '{
    "costPrice": 26.50,
    "sellingPrice": 28.00,
    "retailer": {
      "retailerId": "RETAIL001",
      "shelfDate": "2025-09-10",
      "retailPrice": 28.0,
      "retailLocationGln": "GLN-DELHI-RETAIL-009"
    }
  }'
```

**Mark as Sold:**
```bash
curl -X POST http://localhost:3001/api/batch/BATCH-FARM-001/sold \
  -H "Content-Type: application/json" \
  -d '{
    "consumer": {
      "purchaseDate": "2025-09-12",
      "paymentMode": "UPI",
      "consumerId": "pseudo123"
    }
  }'
```

### 5. View Traceability

**Using Frontend:**
1. Go to "Search Batch" tab
2. Enter "BATCH-FARM-001"
3. Click "Search"

**Using API:**
```bash
# Get full trace
curl http://localhost:3001/api/batch/BATCH-FARM-001/trace

# Get QR code data
curl http://localhost:3001/api/qr/BATCH-FARM-001
```

## Key Features Demonstrated

### ✅ Immutable Records
- All data is stored on the blockchain
- Each transaction has a cryptographic hash
- Data cannot be deleted, only corrected

### ✅ Multi-Actor Workflow
- **Farmer**: Creates initial batch
- **Processor**: Adds processing data
- **Distributor**: Adds logistics data
- **Retailer**: Adds retail data
- **Consumer**: Final purchase (locks batch)

### ✅ QR Code Consistency
- Same QR code (batchId) throughout lifecycle
- Data updates as product moves through supply chain
- Becomes read-only after consumer purchase

### ✅ Certificate Verification
- On-chain certificate storage
- Cryptographic verification hashes
- Support for multiple certification bodies

### ✅ Correction Support
- Ability to correct previous transactions
- References to corrected data
- Complete audit trail maintained

## Troubleshooting

### Common Issues

1. **"Contract not deployed" error**
   - Make sure Ganache is running
   - Run `npm run deploy` in backend folder
   - Update CONTRACT_ADDRESS in .env

2. **"Connection refused" error**
   - Check if Ganache is running on port 7545
   - Verify GANACHE_URL in .env file

3. **"Insufficient funds" error**
   - Ensure the account has ETH in Ganache
   - Check PRIVATE_KEY is valid Ganache account

4. **Frontend not connecting to backend**
   - Ensure backend is running on port 3001
   - Check CORS configuration

### Reset Demo

To reset and start fresh:

1. Stop Ganache and restart it (resets blockchain)
2. Redeploy contract: `npm run deploy`
3. Update CONTRACT_ADDRESS in .env
4. Restart backend: `npm run dev`

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │────│   Backend API   │────│   Blockchain    │
│   (React)       │    │   (Node.js)     │    │   (Ganache)     │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • REST API      │    │ • Smart Contract│
│ • QR Scanner    │    │ • ethers.js     │    │ • Immutable     │
│ • Search        │    │ • Validation    │    │ • Traceable     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Next Steps

1. **Deploy to Testnet**: Use Sepolia for public testing
2. **Add QR Generation**: Generate actual QR codes
3. **Mobile App**: Create mobile scanning app
4. **Analytics**: Add supply chain analytics
5. **IoT Integration**: Connect with sensors and devices

## Support

For issues or questions:
1. Check Ganache logs
2. Check backend console logs
3. Check browser developer console
4. Verify all services are running on correct ports