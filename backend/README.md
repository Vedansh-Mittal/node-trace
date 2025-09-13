# Traceability Blockchain Backend

A Node.js backend service for interacting with the Ethereum-based traceability smart contract using ethers.js.

## Features

- **Smart Contract Integration**: Full integration with Traceability.sol
- **RESTful API**: Complete REST API for all blockchain operations
- **Multi-Actor Support**: Farmer, Processor, Distributor, Retailer, Consumer
- **QR Code Support**: Generate QR data for product tracking
- **Certificate Verification**: On-chain certificate validation
- **Correction Support**: Handle data corrections and amendments

## Prerequisites

- Node.js (v16+)
- Ganache (for local blockchain)
- npm or yarn

## Installation

1. Clone and setup:
```bash
cd backend
npm install
```

2. Setup environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start Ganache (GUI or CLI):
```bash
# Using Ganache CLI
npx ganache --host 0.0.0.0 --port 7545 --accounts 10 --deterministic

# Or use Ganache GUI with default settings
```

4. Compile and deploy contract:
```bash
npm run compile
npm run deploy
```

5. Update CONTRACT_ADDRESS in .env file with deployed address

6. Start the server:
```bash
npm run dev
```

## API Endpoints

### Batch Management

#### Create Batch (Farmer)
```http
POST /api/batch/create
Content-Type: application/json

{
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
}
```

#### Add Processor Data
```http
POST /api/batch/{batchId}/processor
Content-Type: application/json

{
  "costPrice": 25.50,
  "sellingPrice": 24.00,
  "processor": {
    "processorId": "PROC001",
    "processTypes": ["Milling", "Cleaning"],
    "inputBatch": "BATCH-FARM-001",
    "outputQuantityKg": 1150,
    "processingDate": "2025-09-05",
    "gs1Gtin": "GTIN-8901234567890"
  },
  "correctionOf": "" // Optional: transaction ID if this is a correction
}
```

#### Add Distributor Data
```http
POST /api/batch/{batchId}/distributor
Content-Type: application/json

{
  "costPrice": 24.00,
  "sellingPrice": 26.50,
  "distributor": {
    "distributorId": "DIST001",
    "dispatchDate": "2025-09-08",
    "transportMode": "Truck",
    "destinationGln": "GLN-DELHI-001",
    "expiryDate": "2026-01-01"
  }
}
```

#### Add Retailer Data
```http
POST /api/batch/{batchId}/retailer
Content-Type: application/json

{
  "costPrice": 26.50,
  "sellingPrice": 28.00,
  "retailer": {
    "retailerId": "RETAIL001",
    "shelfDate": "2025-09-10",
    "retailPrice": 28.0,
    "retailLocationGln": "GLN-DELHI-RETAIL-009"
  }
}
```

#### Mark as Sold (Consumer)
```http
POST /api/batch/{batchId}/sold
Content-Type: application/json

{
  "consumer": {
    "purchaseDate": "2025-09-12",
    "paymentMode": "UPI",
    "consumerId": "pseudo123"
  }
}
```

### Data Retrieval

#### Get Full Trace History
```http
GET /api/batch/{batchId}/trace
```

#### Get Current Transaction
```http
GET /api/batch/{batchId}/current
```

#### Get Batch Status
```http
GET /api/batch/{batchId}/status
```

#### QR Code Data (Consumer View)
```http
GET /api/qr/{batchId}
```

### Certificate Verification

#### Verify Certificate
```http
GET /api/certificate/{hash}/verify
```

### Example Data

Get example data for testing:
- `GET /api/examples/farmer`
- `GET /api/examples/processor`
- `GET /api/examples/distributor`
- `GET /api/examples/retailer`
- `GET /api/examples/consumer`

## Usage Flow

1. **Farmer creates batch**:
   ```bash
   curl -X POST http://localhost:3001/api/batch/create \
     -H "Content-Type: application/json" \
     -d @example_farmer.json
   ```

2. **Processor adds data**:
   ```bash
   curl -X POST http://localhost:3001/api/batch/BATCH-FARM-001/processor \
     -H "Content-Type: application/json" \
     -d @example_processor.json
   ```

3. **Continue through supply chain** (distributor, retailer)

4. **Mark as sold**:
   ```bash
   curl -X POST http://localhost:3001/api/batch/BATCH-FARM-001/sold \
     -H "Content-Type: application/json" \
     -d @example_consumer.json
   ```

5. **View full trace**:
   ```bash
   curl http://localhost:3001/api/batch/BATCH-FARM-001/trace
   ```

## Key Features

### Immutable Blockchain Storage
- All data is stored on Ethereum blockchain
- Each transaction gets a unique hash
- Linked list structure with previous transaction hashes

### Multi-Actor Workflow
- **Farmer**: Creates initial batch
- **Processor**: Processes raw materials
- **Distributor**: Handles logistics
- **Retailer**: Manages sales
- **Consumer**: Final purchase (locks the batch)

### QR Code Integration
- Same QR code (batchId) throughout lifecycle
- Data updates as product moves through supply chain
- Readonly mode after consumer purchase

### Certificate Management
- On-chain certificate storage
- Verification hash system
- Support for multiple certification bodies

### Correction Support
- Ability to correct previous data
- References to corrected transactions
- Maintains audit trail

## Security Features

- **Access Control**: Only valid actors can add data
- **Immutable Records**: Data cannot be deleted, only corrected
- **Readonly Mode**: Once sold, batch becomes readonly
- **Certificate Verification**: Cryptographic certificate validation

## Development

### Running Tests
```bash
npm test
```

### Deployment to Testnet
1. Update .env with Sepolia configuration
2. Deploy contract:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Gas Optimization
The contract is optimized for gas efficiency:
- Struct packing
- Efficient mappings
- Minimal storage operations

## Troubleshooting

### Common Issues

1. **Contract not deployed**: Ensure you've run `npm run deploy`
2. **Ganache connection**: Check GANACHE_URL in .env
3. **Private key issues**: Ensure valid private key in .env
4. **Gas errors**: Check account has sufficient ETH

### Debug Mode
Set `NODE_ENV=development` for detailed logging.

## License

MIT License