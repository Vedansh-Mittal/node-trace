import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useApi } from '@/hooks/useApi';
import { useTranslation } from 'react-i18next';
import { 
  Leaf, 
  Factory, 
  Truck, 
  Store, 
  ShoppingCart,
  Plus,
  X,
  MapPin
} from 'lucide-react';

interface ActorFormsProps {
  batchId: string;
  onSuccess: () => void;
  currentOwner?: string;
  isReadOnly?: boolean;
}

export const ActorForms = ({ batchId, onSuccess, currentOwner, isReadOnly }: ActorFormsProps) => {
  const [activeForm, setActiveForm] = useState<string>('');
  const [processTypes, setProcessTypes] = useState<string[]>([]);
  const [newProcessType, setNewProcessType] = useState('');
  const [certificates, setCertificates] = useState<any[]>([]);
  
  const { t } = useTranslation();
  const api = useApi();
  
  const { register, handleSubmit, reset, setValue, watch } = useForm();

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setValue('geoLocation', `${latitude},${longitude}`);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const addProcessType = () => {
    if (newProcessType.trim() && !processTypes.includes(newProcessType.trim())) {
      setProcessTypes([...processTypes, newProcessType.trim()]);
      setNewProcessType('');
    }
  };

  const removeProcessType = (type: string) => {
    setProcessTypes(processTypes.filter(t => t !== type));
  };

  const addCertificate = () => {
    setCertificates([...certificates, {
      certificateId: '',
      issuer: '',
      verificationHash: ''
    }]);
  };

  const updateCertificate = (index: number, field: string, value: string) => {
    const updated = [...certificates];
    updated[index] = { ...updated[index], [field]: value };
    setCertificates(updated);
  };

  const removeCertificate = (index: number) => {
    setCertificates(certificates.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: any) => {
    if (isReadOnly) return;

    try {
      let result = null;
      
      switch (activeForm) {
        case 'farmer':
          result = await api.createBatch({
            batchId,
            costPrice: parseFloat(data.costPrice) || 0,
            sellingPrice: parseFloat(data.sellingPrice) || 0,
            farmer: {
              farmId: data.farmId,
              cropType: data.cropType,
              harvestDate: data.harvestDate,
              quantityKg: parseInt(data.quantityKg),
              geoLocation: data.geoLocation,
              gs1: {
                batchOrLot: data.batchOrLot || batchId,
                countryOfOrigin: data.countryOfOrigin || 'IN',
                productionDate: data.harvestDate,
                gtin: data.gtin || ''
              },
              certificates
            }
          });
          break;
          
        case 'processor':
          result = await api.addProcessorData(batchId, {
            costPrice: parseFloat(data.costPrice) || 0,
            sellingPrice: parseFloat(data.sellingPrice) || 0,
            processor: {
              processorId: data.processorId,
              processTypes,
              inputBatch: batchId,
              outputQuantityKg: parseInt(data.outputQuantityKg),
              processingDate: data.processingDate,
              gs1Gtin: data.gs1Gtin
            }
          });
          break;
          
        case 'distributor':
          result = await api.addDistributorData(batchId, {
            costPrice: parseFloat(data.costPrice) || 0,
            sellingPrice: parseFloat(data.sellingPrice) || 0,
            distributor: {
              distributorId: data.distributorId,
              dispatchDate: data.dispatchDate,
              transportMode: data.transportMode,
              destinationGln: data.destinationGln,
              expiryDate: data.expiryDate
            }
          });
          break;
          
        case 'retailer':
          result = await api.addRetailerData(batchId, {
            costPrice: parseFloat(data.costPrice) || 0,
            sellingPrice: parseFloat(data.sellingPrice) || 0,
            retailer: {
              retailerId: data.retailerId,
              shelfDate: data.shelfDate,
              retailPrice: parseFloat(data.retailPrice) || 0,
              retailLocationGln: data.retailLocationGln
            }
          });
          break;
          
        case 'consumer':
          result = await api.markAsSold(batchId, {
            purchaseDate: data.purchaseDate,
            paymentMode: data.paymentMode,
            consumerId: data.consumerId
          });
          break;
      }
      
      if (result) {
        reset();
        setActiveForm('');
        setProcessTypes([]);
        setCertificates([]);
        onSuccess();
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const forms = [
    {
      id: 'farmer',
      title: t('actors.farmer'),
      icon: <Leaf className="h-5 w-5" />,
      description: 'Create initial batch record',
      color: 'text-green-600'
    },
    {
      id: 'processor',
      title: t('actors.processor'),
      icon: <Factory className="h-5 w-5" />,
      description: 'Add processing information',
      color: 'text-blue-600'
    },
    {
      id: 'distributor',
      title: t('actors.distributor'),
      icon: <Truck className="h-5 w-5" />,
      description: 'Add distribution details',
      color: 'text-purple-600'
    },
    {
      id: 'retailer',
      title: t('actors.retailer'),
      icon: <Store className="h-5 w-5" />,
      description: 'Add retail information',
      color: 'text-orange-600'
    },
    {
      id: 'consumer',
      title: t('actors.consumer'),
      icon: <ShoppingCart className="h-5 w-5" />,
      description: 'Record final purchase',
      color: 'text-pink-600'
    }
  ];

  if (isReadOnly) {
    return (
      <div className="text-center p-8">
        <Badge variant="destructive" className="mb-4">
          {t('status.readonly')}
        </Badge>
        <p className="text-muted-foreground">
          This batch has been sold and cannot be modified.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!activeForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => (
            <Card 
              key={form.id}
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => setActiveForm(form.id)}
            >
              <CardContent className="p-6 text-center">
                <div className={`mx-auto mb-4 ${form.color}`}>
                  {form.icon}
                </div>
                <h3 className="font-medium mb-2">{form.title}</h3>
                <p className="text-sm text-muted-foreground">{form.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={forms.find(f => f.id === activeForm)?.color}>
                  {forms.find(f => f.id === activeForm)?.icon}
                </div>
                <div>
                  <CardTitle>{forms.find(f => f.id === activeForm)?.title} Form</CardTitle>
                  <CardDescription>Batch ID: {batchId}</CardDescription>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setActiveForm('');
                  reset();
                  setProcessTypes([]);
                  setCertificates([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Common fields for all forms */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="costPrice">{t('price.cost')} ({t('price.rupees')})</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('costPrice')}
                  />
                </div>
                <div>
                  <Label htmlFor="sellingPrice">{t('price.selling')} ({t('price.rupees')})</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('sellingPrice')}
                  />
                </div>
              </div>

              <Separator />

              {/* Actor-specific fields */}
              {activeForm === 'farmer' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="farmId">{t('fields.farmId')}</Label>
                      <Input id="farmId" placeholder="FARM001" {...register('farmId', { required: true })} />
                    </div>
                    <div>
                      <Label htmlFor="cropType">{t('fields.cropType')}</Label>
                      <Input id="cropType" placeholder="Wheat" {...register('cropType', { required: true })} />
                    </div>
                    <div>
                      <Label htmlFor="quantityKg">{t('fields.quantity')}</Label>
                      <Input id="quantityKg" type="number" placeholder="1000" {...register('quantityKg', { required: true })} />
                    </div>
                    <div>
                      <Label htmlFor="harvestDate">{t('fields.harvestDate')}</Label>
                      <Input id="harvestDate" type="date" {...register('harvestDate', { required: true })} />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="geoLocation">{t('fields.location')}</Label>
                    <div className="flex gap-2">
                      <Input id="geoLocation" placeholder="Latitude, Longitude" {...register('geoLocation')} />
                      <Button type="button" variant="outline" size="sm" onClick={getCurrentLocation}>
                        <MapPin className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Certificates</Label>
                    <div className="space-y-3">
                      {certificates.map((cert, index) => (
                        <div key={index} className="grid grid-cols-4 gap-2 p-3 border rounded-lg">
                          <Input
                            placeholder="Certificate ID"
                            value={cert.certificateId}
                            onChange={(e) => updateCertificate(index, 'certificateId', e.target.value)}
                          />
                          <Input
                            placeholder="Issuer"
                            value={cert.issuer}
                            onChange={(e) => updateCertificate(index, 'issuer', e.target.value)}
                          />
                          <Input
                            placeholder="Verification Hash"
                            value={cert.verificationHash}
                            onChange={(e) => updateCertificate(index, 'verificationHash', e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCertificate(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={addCertificate} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Certificate
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeForm === 'processor' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="processorId">{t('fields.processorId')}</Label>
                      <Input id="processorId" placeholder="PROC001" {...register('processorId', { required: true })} />
                    </div>
                    <div>
                      <Label htmlFor="outputQuantityKg">{t('fields.outputQuantity')}</Label>
                      <Input id="outputQuantityKg" type="number" placeholder="950" {...register('outputQuantityKg', { required: true })} />
                    </div>
                    <div>
                      <Label htmlFor="processingDate">{t('fields.processingDate')}</Label>
                      <Input id="processingDate" type="date" {...register('processingDate', { required: true })} />
                    </div>
                    <div>
                      <Label htmlFor="gs1Gtin">GTIN</Label>
                      <Input id="gs1Gtin" placeholder="1234567890123" {...register('gs1Gtin')} />
                    </div>
                  </div>

                  <div>
                    <Label>{t('fields.processTypes')}</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add process type"
                          value={newProcessType}
                          onChange={(e) => setNewProcessType(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProcessType())}
                        />
                        <Button type="button" variant="outline" onClick={addProcessType}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {processTypes.map((type, index) => (
                          <Badge key={index} variant="secondary" className="gap-1">
                            {type}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => removeProcessType(type)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeForm === 'distributor' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="distributorId">{t('fields.distributorId')}</Label>
                      <Input id="distributorId" placeholder="DIST001" {...register('distributorId', { required: true })} />
                    </div>
                    <div>
                      <Label htmlFor="dispatchDate">{t('fields.dispatchDate')}</Label>
                      <Input id="dispatchDate" type="date" {...register('dispatchDate', { required: true })} />
                    </div>
                    <div>
                      <Label htmlFor="transportMode">{t('fields.transportMode')}</Label>
                      <Select onValueChange={(value) => setValue('transportMode', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transport mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="truck">Truck</SelectItem>
                          <SelectItem value="ship">Ship</SelectItem>
                          <SelectItem value="air">Air</SelectItem>
                          <SelectItem value="rail">Rail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="expiryDate">{t('fields.expiryDate')}</Label>
                      <Input id="expiryDate" type="date" {...register('expiryDate', { required: true })} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="destinationGln">{t('fields.destination')} GLN</Label>
                    <Input id="destinationGln" placeholder="GLN-DESTINATION-001" {...register('destinationGln', { required: true })} />
                  </div>
                </div>
              )}

              {activeForm === 'retailer' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="retailerId">{t('fields.retailerId')}</Label>
                      <Input id="retailerId" placeholder="RETAIL001" {...register('retailerId', { required: true })} />
                    </div>
                    <div>
                      <Label htmlFor="shelfDate">{t('fields.shelfDate')}</Label>
                      <Input id="shelfDate" type="date" {...register('shelfDate', { required: true })} />
                    </div>
                    <div>
                      <Label htmlFor="retailPrice">{t('fields.retailPrice')} ({t('price.rupees')})</Label>
                      <Input id="retailPrice" type="number" step="0.01" placeholder="50.00" {...register('retailPrice', { required: true })} />
                    </div>
                    <div>
                      <Label htmlFor="retailLocationGln">{t('fields.retailLocation')} GLN</Label>
                      <Input id="retailLocationGln" placeholder="GLN-RETAIL-001" {...register('retailLocationGln', { required: true })} />
                    </div>
                  </div>
                </div>
              )}

              {activeForm === 'consumer' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="consumerId">{t('fields.consumerId')}</Label>
                      <Input id="consumerId" placeholder="CONSUMER001" {...register('consumerId', { required: true })} />
                    </div>
                    <div>
                      <Label htmlFor="purchaseDate">{t('fields.purchaseDate')}</Label>
                      <Input id="purchaseDate" type="date" {...register('purchaseDate', { required: true })} />
                    </div>
                    <div>
                      <Label htmlFor="paymentMode">{t('fields.paymentMode')}</Label>
                      <Select onValueChange={(value) => setValue('paymentMode', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="net-banking">Net Banking</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={api.loading} className="flex-1">
                  {api.loading ? 'Submitting...' : `Add ${forms.find(f => f.id === activeForm)?.title} Data`}
                </Button>
                <Button type="button" variant="outline" onClick={() => setActiveForm('')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};