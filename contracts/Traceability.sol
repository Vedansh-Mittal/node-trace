// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Traceability {
    struct GS1Data {
        string batchOrLot;
        string countryOfOrigin;
        string productionDate;
        string gtin;
    }

    struct Certificate {
        string certificateId;
        string issuer;
        string verificationHash;
    }

    struct FarmerData {
        string farmId;
        string cropType;
        string harvestDate;
        uint256 quantityKg;
        string geoLocation;
        GS1Data gs1;
        Certificate[] certificates;
    }

    struct ProcessorData {
        string processorId;
        string[] processTypes;
        string inputBatch;
        uint256 outputQuantityKg;
        string processingDate;
        string gs1Gtin;
    }

    struct DistributorData {
        string distributorId;
        string dispatchDate;
        string transportMode;
        string destinationGln;
        string expiryDate;
    }

    struct RetailerData {
        string retailerId;
        string shelfDate;
        uint256 retailPrice;
        string retailLocationGln;
    }

    struct ConsumerData {
        string purchaseDate;
        string paymentMode;
        string consumerId;
    }

    struct Transaction {
        string transactionId;
        uint256 timestamp;
        string creator;
        string currentOwner;
        string[] previousOwners;
        string batchId;
        string parentBatchId;
        uint256 costPrice;
        uint256 sellingPrice;
        bytes32 transactionHash;
        bytes32 previousHash;
        string correctionOf;
        FarmerData farmer;
        ProcessorData processor;
        DistributorData distributor;
        RetailerData retailer;
        ConsumerData consumer;
        bool isActive;
        bool isSold;
    }

    mapping(string => Transaction[]) public batchHistory;
    mapping(string => bool) public batchExists;
    mapping(string => bool) public batchSold;
    mapping(string => string) public certificateRegistry;
    mapping(string => uint256) public batchCurrentIndex;

    event BatchCreated(string indexed batchId, string creator, uint256 timestamp);
    event DataAdded(string indexed batchId, string actor, uint256 timestamp);
    event BatchSold(string indexed batchId, uint256 timestamp);
    event CorrectionMade(string indexed batchId, string correctionOf, uint256 timestamp);

    modifier batchNotSold(string memory batchId) {
        require(!batchSold[batchId], "Batch has been sold and is now read-only");
        _;
    }

    modifier validBatch(string memory batchId) {
        require(batchExists[batchId], "Batch does not exist");
        _;
    }

    function createBatch(
        string memory _transactionId,
        string memory _batchId,
        string memory _parentBatchId,
        uint256 _costPrice,
        uint256 _sellingPrice,
        FarmerData memory _farmerData
    ) public batchNotSold(_batchId) {
        require(!batchExists[_batchId] || bytes(_parentBatchId).length > 0, "Batch already exists");

        bytes32 prevHash = bytes32(0);
        if (batchExists[_batchId] && batchHistory[_batchId].length > 0) {
            prevHash = batchHistory[_batchId][batchCurrentIndex[_batchId]].transactionHash;
        }

        bytes32 currentHash = keccak256(abi.encodePacked(
            _transactionId,
            block.timestamp,
            _batchId,
            prevHash
        ));

        Transaction memory newTransaction = Transaction({
            transactionId: _transactionId,
            timestamp: block.timestamp,
            creator: "farmer",
            currentOwner: _farmerData.farmId,
            previousOwners: new string[](0),
            batchId: _batchId,
            parentBatchId: _parentBatchId,
            costPrice: _costPrice,
            sellingPrice: _sellingPrice,
            transactionHash: currentHash,
            previousHash: prevHash,
            correctionOf: "",
            farmer: _farmerData,
            processor: ProcessorData("", new string[](0), "", 0, "", ""),
            distributor: DistributorData("", "", "", "", ""),
            retailer: RetailerData("", "", 0, ""),
            consumer: ConsumerData("", "", ""),
            isActive: true,
            isSold: false
        });

        batchHistory[_batchId].push(newTransaction);
        batchExists[_batchId] = true;
        batchCurrentIndex[_batchId] = batchHistory[_batchId].length - 1;

        // Register certificates
        for (uint i = 0; i < _farmerData.certificates.length; i++) {
            certificateRegistry[_farmerData.certificates[i].verificationHash] = _farmerData.certificates[i].certificateId;
        }

        emit BatchCreated(_batchId, "farmer", block.timestamp);
    }

    function addProcessorData(
        string memory _transactionId,
        string memory _batchId,
        uint256 _costPrice,
        uint256 _sellingPrice,
        ProcessorData memory _processorData,
        string memory _correctionOf
    ) public validBatch(_batchId) batchNotSold(_batchId) {
        Transaction memory currentTx = batchHistory[_batchId][batchCurrentIndex[_batchId]];
        
        bytes32 currentHash = keccak256(abi.encodePacked(
            _transactionId,
            block.timestamp,
            _batchId,
            currentTx.transactionHash
        ));

        string[] memory prevOwners = new string[](currentTx.previousOwners.length + 1);
        for (uint i = 0; i < currentTx.previousOwners.length; i++) {
            prevOwners[i] = currentTx.previousOwners[i];
        }
        prevOwners[currentTx.previousOwners.length] = currentTx.currentOwner;

        Transaction memory newTransaction = Transaction({
            transactionId: _transactionId,
            timestamp: block.timestamp,
            creator: "processor",
            currentOwner: _processorData.processorId,
            previousOwners: prevOwners,
            batchId: _batchId,
            parentBatchId: currentTx.parentBatchId,
            costPrice: _costPrice,
            sellingPrice: _sellingPrice,
            transactionHash: currentHash,
            previousHash: currentTx.transactionHash,
            correctionOf: _correctionOf,
            farmer: currentTx.farmer,
            processor: _processorData,
            distributor: DistributorData("", "", "", "", ""),
            retailer: RetailerData("", "", 0, ""),
            consumer: ConsumerData("", "", ""),
            isActive: true,
            isSold: false
        });

        batchHistory[_batchId].push(newTransaction);
        batchCurrentIndex[_batchId] = batchHistory[_batchId].length - 1;

        emit DataAdded(_batchId, "processor", block.timestamp);
        if (bytes(_correctionOf).length > 0) {
            emit CorrectionMade(_batchId, _correctionOf, block.timestamp);
        }
    }

    function addDistributorData(
        string memory _transactionId,
        string memory _batchId,
        uint256 _costPrice,
        uint256 _sellingPrice,
        DistributorData memory _distributorData,
        string memory _correctionOf
    ) public validBatch(_batchId) batchNotSold(_batchId) {
        Transaction memory currentTx = batchHistory[_batchId][batchCurrentIndex[_batchId]];
        
        bytes32 currentHash = keccak256(abi.encodePacked(
            _transactionId,
            block.timestamp,
            _batchId,
            currentTx.transactionHash
        ));

        string[] memory prevOwners = new string[](currentTx.previousOwners.length + 1);
        for (uint i = 0; i < currentTx.previousOwners.length; i++) {
            prevOwners[i] = currentTx.previousOwners[i];
        }
        prevOwners[currentTx.previousOwners.length] = currentTx.currentOwner;

        Transaction memory newTransaction = Transaction({
            transactionId: _transactionId,
            timestamp: block.timestamp,
            creator: "distributor",
            currentOwner: _distributorData.distributorId,
            previousOwners: prevOwners,
            batchId: _batchId,
            parentBatchId: currentTx.parentBatchId,
            costPrice: _costPrice,
            sellingPrice: _sellingPrice,
            transactionHash: currentHash,
            previousHash: currentTx.transactionHash,
            correctionOf: _correctionOf,
            farmer: currentTx.farmer,
            processor: currentTx.processor,
            distributor: _distributorData,
            retailer: RetailerData("", "", 0, ""),
            consumer: ConsumerData("", "", ""),
            isActive: true,
            isSold: false
        });

        batchHistory[_batchId].push(newTransaction);
        batchCurrentIndex[_batchId] = batchHistory[_batchId].length - 1;

        emit DataAdded(_batchId, "distributor", block.timestamp);
        if (bytes(_correctionOf).length > 0) {
            emit CorrectionMade(_batchId, _correctionOf, block.timestamp);
        }
    }

    function addRetailerData(
        string memory _transactionId,
        string memory _batchId,
        uint256 _costPrice,
        uint256 _sellingPrice,
        RetailerData memory _retailerData,
        string memory _correctionOf
    ) public validBatch(_batchId) batchNotSold(_batchId) {
        Transaction memory currentTx = batchHistory[_batchId][batchCurrentIndex[_batchId]];
        
        bytes32 currentHash = keccak256(abi.encodePacked(
            _transactionId,
            block.timestamp,
            _batchId,
            currentTx.transactionHash
        ));

        string[] memory prevOwners = new string[](currentTx.previousOwners.length + 1);
        for (uint i = 0; i < currentTx.previousOwners.length; i++) {
            prevOwners[i] = currentTx.previousOwners[i];
        }
        prevOwners[currentTx.previousOwners.length] = currentTx.currentOwner;

        Transaction memory newTransaction = Transaction({
            transactionId: _transactionId,
            timestamp: block.timestamp,
            creator: "retailer",
            currentOwner: _retailerData.retailerId,
            previousOwners: prevOwners,
            batchId: _batchId,
            parentBatchId: currentTx.parentBatchId,
            costPrice: _costPrice,
            sellingPrice: _sellingPrice,
            transactionHash: currentHash,
            previousHash: currentTx.transactionHash,
            correctionOf: _correctionOf,
            farmer: currentTx.farmer,
            processor: currentTx.processor,
            distributor: currentTx.distributor,
            retailer: _retailerData,
            consumer: ConsumerData("", "", ""),
            isActive: true,
            isSold: false
        });

        batchHistory[_batchId].push(newTransaction);
        batchCurrentIndex[_batchId] = batchHistory[_batchId].length - 1;

        emit DataAdded(_batchId, "retailer", block.timestamp);
        if (bytes(_correctionOf).length > 0) {
            emit CorrectionMade(_batchId, _correctionOf, block.timestamp);
        }
    }

    function markAsSold(
        string memory _transactionId,
        string memory _batchId,
        ConsumerData memory _consumerData
    ) public validBatch(_batchId) batchNotSold(_batchId) {
        Transaction memory currentTx = batchHistory[_batchId][batchCurrentIndex[_batchId]];
        
        bytes32 currentHash = keccak256(abi.encodePacked(
            _transactionId,
            block.timestamp,
            _batchId,
            currentTx.transactionHash
        ));

        string[] memory prevOwners = new string[](currentTx.previousOwners.length + 1);
        for (uint i = 0; i < currentTx.previousOwners.length; i++) {
            prevOwners[i] = currentTx.previousOwners[i];
        }
        prevOwners[currentTx.previousOwners.length] = currentTx.currentOwner;

        Transaction memory newTransaction = Transaction({
            transactionId: _transactionId,
            timestamp: block.timestamp,
            creator: "consumer",
            currentOwner: _consumerData.consumerId,
            previousOwners: prevOwners,
            batchId: _batchId,
            parentBatchId: currentTx.parentBatchId,
            costPrice: currentTx.sellingPrice,
            sellingPrice: 0,
            transactionHash: currentHash,
            previousHash: currentTx.transactionHash,
            correctionOf: "",
            farmer: currentTx.farmer,
            processor: currentTx.processor,
            distributor: currentTx.distributor,
            retailer: currentTx.retailer,
            consumer: _consumerData,
            isActive: true,
            isSold: true
        });

        batchHistory[_batchId].push(newTransaction);
        batchCurrentIndex[_batchId] = batchHistory[_batchId].length - 1;
        batchSold[_batchId] = true;

        emit BatchSold(_batchId, block.timestamp);
    }

    function getFullTrace(string memory _batchId) public view validBatch(_batchId) returns (Transaction[] memory) {
        return batchHistory[_batchId];
    }

    function getCurrentTransaction(string memory _batchId) public view validBatch(_batchId) returns (Transaction memory) {
        return batchHistory[_batchId][batchCurrentIndex[_batchId]];
    }

    function verifyCertificate(string memory _verificationHash) public view returns (string memory) {
        return certificateRegistry[_verificationHash];
    }

    function getBatchStatus(string memory _batchId) public view returns (bool exists, bool sold, uint256 transactionCount) {
        exists = batchExists[_batchId];
        sold = batchSold[_batchId];
        transactionCount = batchHistory[_batchId].length;
    }
}