import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
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
  ArrowRight
} from "lucide-react";

interface Transaction {
  transactionId: string;
  timestamp: number;
  creator: string;
  currentOwner: string;
  previousOwners: string[];
  batchId: string;
  costPrice: string;
  sellingPrice: string;
  farmer?: any;
  processor?: any;
  distributor?: any;
  retailer?: any;
  consumer?: any;
  isSold: boolean;
}

const TraceabilityDashboard = () => {
  const [activeTab, setActiveTab] = useState("search");
  const [batchId, setBatchId] = useState("BATCH-FARM-001");
  const [traceData, setTraceData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!batchId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a batch ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, this would call the backend API
      // For demo purposes, we'll show mock data
      const mockTrace: Transaction[] = [
        {
          transactionId: "TXN-1693526400-abc123",
          timestamp: 1693526400,
          creator: "farmer",
          currentOwner: "FARM123",
          previousOwners: [],
          batchId: "BATCH-FARM-001",
          costPrice: "0",
          sellingPrice: "25.50",
          farmer: {
            farmId: "FARM123",
            cropType: "Wheat",
            harvestDate: "2025-09-01",
            quantityKg: 1200,
            geoLocation: "28.6139,77.2090",
            gs1: {
              batchOrLot: "LOT-2025-001",
              countryOfOrigin: "IN",
              productionDate: "2025-09-01"
            },
            certificates: [
              {
                certificateId: "FSSAI-998877",
                issuer: "FSSAI",
                verificationHash: "0xfssaihash001"
              }
            ]
          },
          isSold: false
        },
        {
          transactionId: "TXN-1693612800-def456",
          timestamp: 1693612800,
          creator: "processor",
          currentOwner: "PROC001",
          previousOwners: ["FARM123"],
          batchId: "BATCH-FARM-001",
          costPrice: "25.50",
          sellingPrice: "24.00",
          processor: {
            processorId: "PROC001",
            processTypes: ["Milling", "Cleaning"],
            inputBatch: "BATCH-FARM-001",
            outputQuantityKg: 1150,
            processingDate: "2025-09-05",
            gs1Gtin: "GTIN-8901234567890"
          },
          isSold: false
        }
      ];

      setTraceData(mockTrace);
      toast({
        title: "Success",
        description: `Found ${mockTrace.length} transactions for batch ${batchId}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch trace data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
      case "farmer": return "bg-green-100 text-green-700 border-green-200";
      case "processor": return "bg-blue-100 text-blue-700 border-blue-200";
      case "distributor": return "bg-purple-100 text-purple-700 border-purple-200";
      case "retailer": return "bg-orange-100 text-orange-700 border-orange-200";
      case "consumer": return "bg-pink-100 text-pink-700 border-pink-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-background to-secondary p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Blockchain Traceability
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track products through the entire supply chain with immutable blockchain records
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Batch
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              Create Batch
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Scanner
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Batch History
                </CardTitle>
                <CardDescription>
                  Enter a batch ID to view its complete supply chain journey
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="batchId">Batch ID</Label>
                    <Input
                      id="batchId"
                      value={batchId}
                      onChange={(e) => setBatchId(e.target.value)}
                      placeholder="Enter batch ID (e.g., BATCH-FARM-001)"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleSearch} disabled={loading} className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all">
                      {loading ? "Searching..." : "Search"}
                    </Button>
                  </div>
                </div>

                {traceData.length > 0 && (
                  <div className="space-y-4">
                    <Separator />
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Supply Chain Journey</h3>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {traceData.length} Transactions
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      {traceData.map((transaction, index) => (
                        <div key={transaction.transactionId}>
                          <Card className="relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary-glow" />
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                  <div className={`p-2 rounded-lg border ${getActorColor(transaction.creator)}`}>
                                    {getActorIcon(transaction.creator)}
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="capitalize">
                                        {transaction.creator}
                                      </Badge>
                                      <span className="text-sm text-muted-foreground">
                                        {formatDate(transaction.timestamp)}
                                      </span>
                                    </div>
                                    <p className="font-medium">Owner: {transaction.currentOwner}</p>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Cost Price:</span>
                                        <span className="ml-2 font-medium">${transaction.costPrice}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Selling Price:</span>
                                        <span className="ml-2 font-medium">${transaction.sellingPrice}</span>
                                      </div>
                                    </div>
                                    
                                    {/* Actor-specific details */}
                                    {transaction.farmer && (
                                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                        <h4 className="font-medium text-green-800 mb-2">Farm Details</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div><span className="text-green-600">Crop:</span> {transaction.farmer.cropType}</div>
                                          <div><span className="text-green-600">Quantity:</span> {transaction.farmer.quantityKg} kg</div>
                                          <div><span className="text-green-600">Harvest:</span> {transaction.farmer.harvestDate}</div>
                                          <div><span className="text-green-600">Country:</span> {transaction.farmer.gs1.countryOfOrigin}</div>
                                        </div>
                                      </div>
                                    )}

                                    {transaction.processor && (
                                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                        <h4 className="font-medium text-blue-800 mb-2">Processing Details</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div><span className="text-blue-600">Process:</span> {transaction.processor.processTypes.join(", ")}</div>
                                          <div><span className="text-blue-600">Output:</span> {transaction.processor.outputQuantityKg} kg</div>
                                          <div><span className="text-blue-600">Date:</span> {transaction.processor.processingDate}</div>
                                          <div><span className="text-blue-600">GTIN:</span> {transaction.processor.gs1Gtin}</div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="text-right space-y-2">
                                  <div className="text-xs text-muted-foreground">
                                    TXN ID: {transaction.transactionId.slice(-8)}
                                  </div>
                                  {transaction.isSold && (
                                    <Badge variant="destructive">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Sold (Read-only)
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
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5" />
                  Create New Batch (Farmer)
                </CardTitle>
                <CardDescription>
                  Start a new supply chain journey by creating a farmer batch
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newBatchId">Batch ID</Label>
                    <Input id="newBatchId" placeholder="BATCH-FARM-002" />
                  </div>
                  <div>
                    <Label htmlFor="farmId">Farm ID</Label>
                    <Input id="farmId" placeholder="FARM124" />
                  </div>
                  <div>
                    <Label htmlFor="cropType">Crop Type</Label>
                    <Input id="cropType" placeholder="Rice" />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity (kg)</Label>
                    <Input id="quantity" type="number" placeholder="1500" />
                  </div>
                  <div>
                    <Label htmlFor="harvestDate">Harvest Date</Label>
                    <Input id="harvestDate" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="sellingPrice">Selling Price ($)</Label>
                    <Input id="sellingPrice" type="number" step="0.01" placeholder="28.00" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="geoLocation">Geographic Location</Label>
                  <Input id="geoLocation" placeholder="Latitude, Longitude" />
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all">
                  Create Batch on Blockchain
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* QR Tab */}
          <TabsContent value="qr" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code Scanner
                </CardTitle>
                <CardDescription>
                  Scan QR codes to quickly access product traceability data
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="w-64 h-64 mx-auto bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
                  <div className="text-center space-y-2">
                    <QrCode className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Camera feed would appear here</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Point your camera at a QR code to scan batch information
                </p>
                <Button variant="outline" className="w-full">
                  Enable Camera
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TraceabilityDashboard;