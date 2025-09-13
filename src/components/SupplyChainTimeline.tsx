import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Transaction } from '@/hooks/useApi';
import { 
  CheckCircle, 
  Clock, 
  Leaf, 
  Factory, 
  Truck, 
  Store, 
  ShoppingCart,
  ArrowDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SupplyChainTimelineProps {
  transactions: Transaction[];
  className?: string;
}

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
    case "farmer": return "bg-green-500 border-green-500";
    case "processor": return "bg-blue-500 border-blue-500";
    case "distributor": return "bg-purple-500 border-purple-500";
    case "retailer": return "bg-orange-500 border-orange-500";
    case "consumer": return "bg-pink-500 border-pink-500";
    default: return "bg-gray-500 border-gray-500";
  }
};

export const SupplyChainTimeline = ({ transactions, className }: SupplyChainTimelineProps) => {
  const { t } = useTranslation();
  
  // Group transactions by creator to show the latest for each actor
  const actorSequence = ['farmer', 'processor', 'distributor', 'retailer', 'consumer'];
  const latestByActor = actorSequence.reduce((acc, actor) => {
    const latestTx = transactions
      .filter(tx => tx.creator === actor)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    if (latestTx) {
      acc[actor] = latestTx;
    }
    return acc;
  }, {} as Record<string, Transaction>);

  const completedSteps = Object.keys(latestByActor);
  const currentStep = completedSteps[completedSteps.length - 1];
  const isCompleted = latestByActor.consumer?.isSold;

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">{t('search.journey')}</h3>
          {isCompleted && (
            <Badge className="bg-success/10 text-success border-success/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              {t('status.completed')}
            </Badge>
          )}
        </div>

        <div className="space-y-6">
          {actorSequence.map((actor, index) => {
            const transaction = latestByActor[actor];
            const isActive = actor === currentStep;
            const isCompleted = !!transaction;
            const isPending = actorSequence.indexOf(currentStep) < index;

            return (
              <div key={actor} className="relative">
                <div className="flex items-center gap-4">
                  {/* Timeline Node */}
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                      isCompleted 
                        ? `${getActorColor(actor)} text-white` 
                        : isPending 
                        ? 'bg-muted border-muted-foreground/30 text-muted-foreground'
                        : 'bg-primary/10 border-primary text-primary'
                    }`}>
                      {isCompleted ? (
                        getActorIcon(actor)
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    
                    {/* Timeline Line */}
                    {index < actorSequence.length - 1 && (
                      <div className={`absolute top-10 left-1/2 transform -translate-x-1/2 w-px h-8 ${
                        isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium capitalize">{t(`actors.${actor}`)}</h4>
                      {isActive && !isCompleted && (
                        <Badge variant="outline" className="text-xs">
                          Current
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t('status.completed')}
                        </Badge>
                      )}
                    </div>
                    
                    {transaction ? (
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Owner: {transaction.currentOwner}</p>
                        <p>Date: {new Date(transaction.timestamp * 1000).toLocaleDateString()}</p>
                        {transaction.costPrice !== "0" && (
                          <p>Cost: ₹{parseFloat(transaction.costPrice).toFixed(2)}</p>
                        )}
                        {transaction.sellingPrice !== "0" && (
                          <p>Selling: ₹{parseFloat(transaction.sellingPrice).toFixed(2)}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {isPending ? 'Pending' : 'Ready to add data'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};