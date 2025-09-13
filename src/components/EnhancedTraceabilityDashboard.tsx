import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useApi, Transaction } from "@/hooks/useApi";
import { useTranslation } from 'react-i18next';
import { 
  QrCode, 
  Leaf, 
  Factory, 
  Truck, 
  Store, 
  ShoppingCart, 
  Shield, 
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Settings
} from "lucide-react";

// Component imports
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { QRScanner } from "@/components/QRScanner";
import { CorrectionHistory } from "@/components/CorrectionHistory";
import { SupplyChainTimeline } from "@/components/SupplyChainTimeline";
import { ActorForms } from "@/components/ActorForms";

const EnhancedTraceabilityDashboard = () => {
  const [activeTab, setActiveTab] = useState("search");
  const [batchId, setBatchId] = useState("");
  const [traceData, setTraceData] = useState<Transaction[]>([]);
  const [currentBatch, setCurrentBatch] = useState<any>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrValue, setQrValue] = useState("");
  
  const { t } = useTranslation();
  const { toast } = useToast();
  const api = useApi();

  const handleSearch = async () => {
    if (!batchId.trim()) {
      toast({
        title: t('errors.invalidBatch'),
        description: t('errors.requiredField'),
        variant: "destructive"
      });
      return;
    }

    const trace = await api.getFullTrace(batchId);
    if (trace) {
      setTraceData(trace);
      const status = await api.getBatchStatus(batchId);
      setCurrentBatch({ ...trace[trace.length - 1], status });
      
      // Generate QR code data
      const qrData = {
        batchId,
        url: `${window.location.origin}/batch/${batchId}`,
        timestamp: Date.now()
      };
      setQrValue(JSON.stringify(qrData));
      
      toast({
        title: t('success.batchFound'),
        description: `${t('search.transactions')}: ${trace.length}`,
      });
    }
  };

  const handleQRScan = async (scannedData: string) => {
    try {
      const data = JSON.parse(scannedData);
      if (data.batchId) {
        setBatchId(data.batchId);
        setActiveTab("search");
        // Auto-search after scan
        setTimeout(() => handleSearch(), 100);
      }
    } catch (error) {
      // Treat as plain batch ID
      setBatchId(scannedData);
      setActiveTab("search");
      setTimeout(() => handleSearch(), 100);
    }
  };

  const refreshData = async () => {
    if (batchId) {
      await handleSearch();
    }
  };

  const getActorIcon = (creator: string) => {
    switch (creator) {
      case "farmer": return <Leaf className="h-4 w-4" />;
      case "processor": return <Factory className="h-4 w-4" />;
      case "distributor": return <Truck className="h-4 w-4" />;
      case "retailer": return <Store className="h-4 w-4" />;
      case "consumer": return <ShoppingCart className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getActorColor = (creator: string) => {
    switch (creator) {
      case "farmer": return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
      case "processor": return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
      case "distributor": return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800";
      case "retailer": return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800";
      case "consumer": return "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800";
      default: return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return isNaN(num) ? '₹0.00' : `₹${num.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <div className="container mx-auto max-w-7xl p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                {t('app.title')}
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                {t('app.subtitle')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-none lg:flex">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.search')}</span>
            </TabsTrigger>
            <TabsTrigger value="farmer" className="flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.farmer')}</span>
            </TabsTrigger>
            <TabsTrigger value="actors" className="flex items-center gap-2">
              <Factory className="h-4 w-4" />
              <span className="hidden sm:inline">Actors</span>
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.qr')}</span>
            </TabsTrigger>
            <TabsTrigger value="consumer" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.consumer')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Search & View Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  {t('search.title')}
                </CardTitle>
                <CardDescription>
                  {t('search.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="batchId">{t('fields.batchId')}</Label>
                    <Input
                      id="batchId"
                      value={batchId}
                      onChange={(e) => setBatchId(e.target.value)}
                      placeholder={t('search.placeholder')}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button 
                      onClick={handleSearch} 
                      disabled={api.loading} 
                      className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all"
                    >
                      {api.loading ? t('search.searching') : t('search.button')}
                    </Button>
                    {qrValue && (
                      <Button
                        variant="outline"
                        onClick={() => setShowQRCode(!showQRCode)}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {showQRCode && qrValue && (
                  <div className="flex justify-center p-4 bg-muted rounded-lg">
                    <QRCodeGenerator value={qrValue} size={200} />
                  </div>
                )}

                {traceData.length > 0 && (
                  <div className="space-y-6">
                    <Separator />
                    
                    {/* Summary */}
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">{t('search.journey')}</h3>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {traceData.length} {t('search.transactions')}
                            </Badge>
                            {currentBatch?.status?.sold && (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {t('status.sold')}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Timeline */}
                        <SupplyChainTimeline transactions={traceData} className="mb-6" />
                      </div>

                      {/* Price Summary */}
                      <Card className="w-full lg:w-80">
                        <CardHeader>
                          <CardTitle className="text-base">Price Transparency</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {traceData.map((tx, index) => (
                            <div key={tx.transactionId} className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className={`p-1 rounded ${getActorColor(tx.creator)}`}>
                                  {getActorIcon(tx.creator)}
                                </div>
                                <span className="text-sm capitalize">{t(`actors.${tx.creator}`)}</span>
                              </div>
                              <div className="text-right text-sm">
                                {tx.costPrice !== "0" && (
                                  <div className="text-muted-foreground">
                                    Cost: {formatPrice(tx.costPrice)}
                                  </div>
                                )}
                                {tx.sellingPrice !== "0" && (
                                  <div className="font-medium">
                                    Sale: {formatPrice(tx.sellingPrice)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Detailed Transaction History */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Detailed History</h3>
                      {traceData.map((transaction, index) => (
                        <div key={transaction.transactionId}>
                          <Card className="relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary-glow" />
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                  <div className={`p-2 rounded-lg border ${getActorColor(transaction.creator)}`}>
                                    {getActorIcon(transaction.creator)}
                                  </div>
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="capitalize">
                                        {t(`actors.${transaction.creator}`)}
                                      </Badge>
                                      <span className="text-sm text-muted-foreground">
                                        {formatDate(transaction.timestamp)}
                                      </span>
                                    </div>
                                    <p className="font-medium">Owner: {transaction.currentOwner}</p>
                                    
                                    {/* Price Information */}
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      {transaction.costPrice !== "0" && (
                                        <div>
                                          <span className="text-muted-foreground">{t('price.cost')}:</span>
                                          <span className="ml-2 font-medium">{formatPrice(transaction.costPrice)}</span>
                                        </div>
                                      )}
                                      {transaction.sellingPrice !== "0" && (
                                        <div>
                                          <span className="text-muted-foreground">{t('price.selling')}:</span>
                                          <span className="ml-2 font-medium">{formatPrice(transaction.sellingPrice)}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Actor-specific details */}
                                    {transaction.farmer && transaction.creator === 'farmer' && (
                                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                        <h4 className="font-medium text-green-800 dark:text-green-400 mb-2">Farm Details</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div><span className="text-green-600 dark:text-green-400">Crop:</span> {transaction.farmer.cropType}</div>
                                          <div><span className="text-green-600 dark:text-green-400">Quantity:</span> {transaction.farmer.quantityKg} kg</div>
                                          <div><span className="text-green-600 dark:text-green-400">Harvest:</span> {transaction.farmer.harvestDate}</div>
                                          <div><span className="text-green-600 dark:text-green-400">Country:</span> {transaction.farmer.gs1?.countryOfOrigin}</div>
                                        </div>
                                        {transaction.farmer.certificates?.length > 0 && (
                                          <div className="mt-2">
                                            <span className="text-green-600 dark:text-green-400 text-sm">Certificates:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {transaction.farmer.certificates.map((cert: any, i: number) => (
                                                <Badge key={i} variant="outline" className="text-xs">
                                                  {cert.certificateId}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {transaction.processor && transaction.creator === 'processor' && (
                                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-2">Processing Details</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div><span className="text-blue-600 dark:text-blue-400">Process:</span> {transaction.processor.processTypes?.join(", ")}</div>
                                          <div><span className="text-blue-600 dark:text-blue-400">Output:</span> {transaction.processor.outputQuantityKg} kg</div>
                                          <div><span className="text-blue-600 dark:text-blue-400">Date:</span> {transaction.processor.processingDate}</div>
                                          <div><span className="text-blue-600 dark:text-blue-400">GTIN:</span> {transaction.processor.gs1Gtin}</div>
                                        </div>
                                      </div>
                                    )}

                                    {transaction.distributor && transaction.creator === 'distributor' && (
                                      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                                        <h4 className="font-medium text-purple-800 dark:text-purple-400 mb-2">Distribution Details</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div><span className="text-purple-600 dark:text-purple-400">Transport:</span> {transaction.distributor.transportMode}</div>
                                          <div><span className="text-purple-600 dark:text-purple-400">Dispatch:</span> {transaction.distributor.dispatchDate}</div>
                                          <div><span className="text-purple-600 dark:text-purple-400">Destination:</span> {transaction.distributor.destinationGln}</div>
                                          <div><span className="text-purple-600 dark:text-purple-400">Expiry:</span> {transaction.distributor.expiryDate}</div>
                                        </div>
                                      </div>
                                    )}

                                    {transaction.retailer && transaction.creator === 'retailer' && (
                                      <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                                        <h4 className="font-medium text-orange-800 dark:text-orange-400 mb-2">Retail Details</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div><span className="text-orange-600 dark:text-orange-400">Shelf Date:</span> {transaction.retailer.shelfDate}</div>
                                          <div><span className="text-orange-600 dark:text-orange-400">Price:</span> {formatPrice(transaction.retailer.retailPrice || "0")}</div>
                                          <div><span className="text-orange-600 dark:text-orange-400">Location:</span> {transaction.retailer.retailLocationGln}</div>
                                        </div>
                                      </div>
                                    )}

                                    {transaction.consumer && transaction.creator === 'consumer' && (
                                      <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg border border-pink-200 dark:border-pink-800">
                                        <h4 className="font-medium text-pink-800 dark:text-pink-400 mb-2">Purchase Details</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div><span className="text-pink-600 dark:text-pink-400">Date:</span> {transaction.consumer.purchaseDate}</div>
                                          <div><span className="text-pink-600 dark:text-pink-400">Payment:</span> {transaction.consumer.paymentMode}</div>
                                          <div><span className="text-pink-600 dark:text-pink-400">Consumer:</span> {transaction.consumer.consumerId}</div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="text-right space-y-2">
                                  <div className="text-xs text-muted-foreground">
                                    TXN: {transaction.transactionId.slice(-8)}
                                  </div>
                                  {transaction.isSold && (
                                    <Badge variant="destructive">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      {t('status.sold')}
                                    </Badge>
                                  )}
                                  {transaction.correctionOf && (
                                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                                      Correction
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          {index < traceData.length - 1 && (
                            <div className="flex justify-center py-2">
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Correction History */}
                    <CorrectionHistory transactions={traceData} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Farmer Tab */}
          <TabsContent value="farmer">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5" />
                  {t('create.title')} ({t('actors.farmer')})
                </CardTitle>
                <CardDescription>
                  {t('create.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActorForms 
                  batchId={batchId || `BATCH-${Date.now()}`} 
                  onSuccess={refreshData}
                  isReadOnly={currentBatch?.status?.sold}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actors Tab */}
          <TabsContent value="actors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Factory className="h-5 w-5" />
                  Supply Chain Actors
                </CardTitle>
                <CardDescription>
                  Add data for processors, distributors, and retailers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {batchId ? (
                  <ActorForms 
                    batchId={batchId} 
                    onSuccess={refreshData}
                    currentOwner={currentBatch?.currentOwner}
                    isReadOnly={currentBatch?.status?.sold}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Please search for a batch first or create a new batch as a farmer.
                    </p>
                    <Button onClick={() => setActiveTab('search')} variant="outline">
                      <Search className="h-4 w-4 mr-2" />
                      Search Batch
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* QR Tab */}
          <TabsContent value="qr" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    {t('qr.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('qr.subtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QRScanner onScan={handleQRScan} />
                </CardContent>
              </Card>

              {qrValue && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="h-5 w-5" />
                      {t('qr.generate')}
                    </CardTitle>
                    <CardDescription>
                      QR Code for batch: {batchId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <QRCodeGenerator value={qrValue} size={250} />
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Consumer View Tab */}
          <TabsContent value="consumer">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Consumer View
                </CardTitle>
                <CardDescription>
                  Read-only view for consumers to verify product authenticity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {traceData.length > 0 ? (
                  <div className="space-y-6">
                    {/* Consumer Summary */}
                    <div className="bg-gradient-to-r from-primary/5 to-primary-glow/5 p-6 rounded-lg border border-primary/20">
                      <h3 className="text-lg font-semibold mb-4">Product Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">Product</Label>
                          <p className="font-medium">{traceData[0]?.farmer?.cropType}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Origin</Label>
                          <p className="font-medium">{traceData[0]?.farmer?.gs1?.countryOfOrigin}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Harvest Date</Label>
                          <p className="font-medium">{traceData[0]?.farmer?.harvestDate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Price Transparency for Consumers */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Price Breakdown</CardTitle>
                        <CardDescription>See how the price changed through the supply chain</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {traceData.map((tx, index) => {
                            const margin = index > 0 ? 
                              ((parseFloat(tx.sellingPrice) - parseFloat(tx.costPrice)) / parseFloat(tx.costPrice) * 100) 
                              : 0;
                            
                            return (
                              <div key={tx.transactionId} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1 rounded ${getActorColor(tx.creator)}`}>
                                    {getActorIcon(tx.creator)}
                                  </div>
                                  <span className="font-medium capitalize">{t(`actors.${tx.creator}`)}</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">{formatPrice(tx.sellingPrice)}</div>
                                  {margin > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      +{margin.toFixed(1)}% margin
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Timeline for Consumers */}
                    <SupplyChainTimeline transactions={traceData} />

                    {/* Final Consumer Action */}
                    {!currentBatch?.status?.sold && (
                      <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                          <CardTitle className="text-base">Record Your Purchase</CardTitle>
                          <CardDescription>
                            Complete the supply chain by recording your purchase
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            onClick={() => setActiveTab('actors')}
                            className="w-full"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Record Purchase
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Scan a QR code or search for a batch to view product information
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => setActiveTab('qr')} variant="outline">
                        <QrCode className="h-4 w-4 mr-2" />
                        Scan QR Code
                      </Button>
                      <Button onClick={() => setActiveTab('search')} variant="outline">
                        <Search className="h-4 w-4 mr-2" />
                        Search Batch
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedTraceabilityDashboard;