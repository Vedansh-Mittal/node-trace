import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QRCodeGenerator } from './QRCodeGenerator';
import { SupplyChainTimeline } from './SupplyChainTimeline';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Package, Shield, DollarSign, User } from 'lucide-react';

// Demo data for a complete supply chain trace
const demoTraceData = {
  batchId: 'DEMO-BATCH-2025-001',
  status: 'sold',
  transactions: [
    {
      id: 'TXN-FARMER-001',
      transactionId: 'TXN-FARMER-001',
      timestamp: new Date('2025-09-01T08:00:00Z').getTime() / 1000,
      creator: 'farmer',
      currentOwner: 'Rajesh Kumar',
      previousOwners: [],
      batchId: 'DEMO-BATCH-2025-001',
      parentBatchId: null,
      costPrice: "0",
      sellingPrice: "25.50",
      hash: '0xfarmerhash001',
      previousHash: null,
      correctionOf: null,
      isActive: false,
      isSold: false,
      farmer: {
        farmId: 'DEMO-FARM-001',
        cropType: 'Organic Wheat',
        harvestDate: '2025-09-01',
        quantityKg: 1200,
        geoLocation: '28.6139,77.2090',
        gs1: {
          batchOrLot: 'LOT-2025-001',
          countryOfOrigin: 'IN',
          productionDate: '2025-09-01',
          gtin: ''
        },
        certificates: [
          {
            certificateId: 'FSSAI-DEMO-001',
            issuer: 'FSSAI',
            verificationHash: '0xdemo_fssai_hash_001'
          },
          {
            certificateId: 'ORGANIC-DEMO-001',
            issuer: 'India Organic Certification Agency',
            verificationHash: '0xdemo_organic_hash_001'
          }
        ]
      }
    },
    {
      id: 'TXN-PROCESSOR-001',
      transactionId: 'TXN-PROCESSOR-001',
      timestamp: new Date('2025-09-05T10:00:00Z').getTime() / 1000,
      creator: 'processor',
      currentOwner: 'Sunita Mills Pvt Ltd',
      previousOwners: ['Rajesh Kumar'],
      batchId: 'DEMO-BATCH-2025-001',
      parentBatchId: 'DEMO-BATCH-2025-001',
      costPrice: "25.50",
      sellingPrice: "24.00",
      hash: '0xprocessorhash001',
      previousHash: '0xfarmerhash001',
      correctionOf: null,
      isActive: false,
      isSold: false,
      processor: {
        processorId: 'DEMO-PROC-001',
        processTypes: ['Milling', 'Cleaning', 'Grading'],
        inputBatch: 'DEMO-BATCH-2025-001',
        outputQuantityKg: 1150,
        processingDate: '2025-09-05',
        gs1Gtin: '8901234567890'
      }
    },
    {
      id: 'TXN-DISTRIBUTOR-001',
      transactionId: 'TXN-DISTRIBUTOR-001',
      timestamp: new Date('2025-09-08T14:00:00Z').getTime() / 1000,
      creator: 'distributor',
      currentOwner: 'Delhi Distribution Co',
      previousOwners: ['Rajesh Kumar', 'Sunita Mills Pvt Ltd'],
      batchId: 'DEMO-BATCH-2025-001',
      parentBatchId: 'DEMO-BATCH-2025-001',
      costPrice: "24.00",
      sellingPrice: "26.50",
      hash: '0xdistributorhash001',
      previousHash: '0xprocessorhash001',
      correctionOf: null,
      isActive: false,
      isSold: false,
      distributor: {
        distributorId: 'DEMO-DIST-001',
        dispatchDate: '2025-09-08',
        transportMode: 'Truck',
        destinationGln: 'GLN-DELHI-MARKET-001',
        expiryDate: '2026-01-01'
      }
    },
    {
      id: 'TXN-RETAILER-001',
      transactionId: 'TXN-RETAILER-001',
      timestamp: new Date('2025-09-10T09:00:00Z').getTime() / 1000,
      creator: 'retailer',
      currentOwner: 'Fresh Mart Store',
      previousOwners: ['Rajesh Kumar', 'Sunita Mills Pvt Ltd', 'Delhi Distribution Co'],
      batchId: 'DEMO-BATCH-2025-001',
      parentBatchId: 'DEMO-BATCH-2025-001',
      costPrice: "26.50",
      sellingPrice: "28.00",
      hash: '0xretailerhash001',
      previousHash: '0xdistributorhash001',
      correctionOf: null,
      isActive: false,
      isSold: false,
      retailer: {
        retailerId: 'DEMO-RETAIL-001',
        shelfDate: '2025-09-10',
        retailPrice: 30.00,
        retailLocationGln: 'GLN-DELHI-STORE-001'
      }
    },
    {
      id: 'TXN-CONSUMER-001',
      transactionId: 'TXN-CONSUMER-001',
      timestamp: new Date('2025-09-12T16:00:00Z').getTime() / 1000,
      creator: 'consumer',
      currentOwner: 'Priya Sharma',
      previousOwners: ['Rajesh Kumar', 'Sunita Mills Pvt Ltd', 'Delhi Distribution Co', 'Fresh Mart Store'],
      batchId: 'DEMO-BATCH-2025-001',
      parentBatchId: 'DEMO-BATCH-2025-001',
      costPrice: "28.00",
      sellingPrice: "28.00",
      hash: '0xconsumerhash001',
      previousHash: '0xretailerhash001',
      correctionOf: null,
      isActive: false,
      isSold: true,
      consumer: {
        purchaseDate: '2025-09-12',
        paymentMode: 'UPI',
        consumerId: 'DEMO-CONSUMER-001'
      }
    }
  ]
};

export const DemoTraceView = () => {
  const { t } = useTranslation();
  const [showQR, setShowQR] = useState(false);

  const farmerTransaction = demoTraceData.transactions[0];
  const consumerTransaction = demoTraceData.transactions[demoTraceData.transactions.length - 1];
  const farmerPrice = parseFloat(farmerTransaction.sellingPrice);
  const consumerPrice = parseFloat(consumerTransaction.costPrice);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent mb-2">
          {t('demo.title')}
        </h1>
        <p className="text-muted-foreground mb-4">{t('demo.description')}</p>
        <Button onClick={() => setShowQR(!showQR)} variant="outline" className="mb-4">
          {showQR ? t('demo.hideQR') : t('demo.showQR')}
        </Button>
      </div>

      {showQR && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">{t('demo.qrCode')}</CardTitle>
            <CardDescription className="text-center">
              {t('demo.qrDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <QRCodeGenerator value={demoTraceData.batchId} size={200} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t('demo.batchInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">{t('demo.batchId')}:</span>
              <Badge variant="outline" className="ml-2">{demoTraceData.batchId}</Badge>
            </div>
            <div>
              <span className="font-medium">{t('demo.status')}:</span>
              <Badge variant={demoTraceData.status === 'sold' ? 'destructive' : 'default'} className="ml-2">
                {t(`demo.${demoTraceData.status}`)}
              </Badge>
            </div>
            <div>
              <span className="font-medium">{t('demo.cropType')}:</span>
              <span className="ml-2">{farmerTransaction.farmer?.cropType}</span>
            </div>
            <div>
              <span className="font-medium">{t('demo.quantity')}:</span>
              <span className="ml-2">{farmerTransaction.farmer?.quantityKg} kg</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('demo.priceTransparency')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">{t('demo.farmerPrice')}:</span>
              <span className="ml-2 text-success">₹{farmerPrice}/kg</span>
            </div>
            <div>
              <span className="font-medium">{t('demo.consumerPrice')}:</span>
              <span className="ml-2 text-warning">₹{consumerPrice}/kg</span>
            </div>
            <div>
              <span className="font-medium">{t('demo.priceIncrease')}:</span>
              <span className="ml-2 text-muted-foreground">
                {((consumerPrice - farmerPrice) / farmerPrice * 100).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('demo.certificates')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {farmerTransaction.farmer?.certificates?.map((cert, index) => (
              <div key={index} className="flex flex-col">
                <Badge variant="secondary" className="text-xs">
                  {cert.issuer}
                </Badge>
                <span className="text-xs text-muted-foreground truncate">
                  {cert.certificateId}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('demo.supplyChainJourney')}
          </CardTitle>
          <CardDescription>
            {t('demo.journeyDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SupplyChainTimeline transactions={demoTraceData.transactions} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {demoTraceData.transactions.map((transaction, index) => (
          <Card key={transaction.id} className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t(`roles.${transaction.creator}`)}
                </span>
                <Badge variant="outline">#{index + 1}</Badge>
              </CardTitle>
              <CardDescription>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3" />
                  {new Date(transaction.timestamp * 1000).toLocaleDateString()}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium">{t('demo.owner')}:</span>
                <p className="text-sm text-muted-foreground">{transaction.currentOwner}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs font-medium">{t('demo.costPrice')}:</span>
                  <p className="text-sm">₹{transaction.costPrice}/kg</p>
                </div>
                <div>
                  <span className="text-xs font-medium">{t('demo.sellingPrice')}:</span>
                  <p className="text-sm">₹{transaction.sellingPrice}/kg</p>
                </div>
              </div>

              <Separator />

              {/* Role-specific data */}
              {transaction.farmer && (
                <div className="space-y-2">
                  <div className="text-xs font-medium">{t('demo.farmDetails')}:</div>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">{t('demo.farmId')}:</span> {transaction.farmer.farmId}</p>
                    <p><span className="font-medium">{t('demo.harvestDate')}:</span> {transaction.farmer.harvestDate}</p>
                    <p><span className="font-medium">{t('demo.location')}:</span> {transaction.farmer.geoLocation}</p>
                  </div>
                </div>
              )}

              {transaction.processor && (
                <div className="space-y-2">
                  <div className="text-xs font-medium">{t('demo.processingDetails')}:</div>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">{t('demo.processorId')}:</span> {transaction.processor.processorId}</p>
                    <p><span className="font-medium">{t('demo.processes')}:</span> {transaction.processor.processTypes?.join(', ')}</p>
                    <p><span className="font-medium">{t('demo.outputQuantity')}:</span> {transaction.processor.outputQuantityKg} kg</p>
                  </div>
                </div>
              )}

              {transaction.distributor && (
                <div className="space-y-2">
                  <div className="text-xs font-medium">{t('demo.distributionDetails')}:</div>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">{t('demo.distributorId')}:</span> {transaction.distributor.distributorId}</p>
                    <p><span className="font-medium">{t('demo.transport')}:</span> {transaction.distributor.transportMode}</p>
                    <p><span className="font-medium">{t('demo.expiryDate')}:</span> {transaction.distributor.expiryDate}</p>
                  </div>
                </div>
              )}

              {transaction.retailer && (
                <div className="space-y-2">
                  <div className="text-xs font-medium">{t('demo.retailDetails')}:</div>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">{t('demo.retailerId')}:</span> {transaction.retailer.retailerId}</p>
                    <p><span className="font-medium">{t('demo.shelfDate')}:</span> {transaction.retailer.shelfDate}</p>
                    <p><span className="font-medium">{t('demo.retailPrice')}:</span> ₹{transaction.retailer.retailPrice}</p>
                  </div>
                </div>
              )}

              {transaction.consumer && (
                <div className="space-y-2">
                  <div className="text-xs font-medium">{t('demo.purchaseDetails')}:</div>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">{t('demo.purchaseDate')}:</span> {transaction.consumer.purchaseDate}</p>
                    <p><span className="font-medium">{t('demo.paymentMode')}:</span> {transaction.consumer.paymentMode}</p>
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <span className="font-medium">{t('demo.txHash')}:</span>
                <p className="truncate">{transaction.hash}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};