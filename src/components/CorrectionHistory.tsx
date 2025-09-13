import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Transaction } from '@/hooks/useApi';
import { History, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CorrectionHistoryProps {
  transactions: Transaction[];
  className?: string;
}

export const CorrectionHistory = ({ transactions, className }: CorrectionHistoryProps) => {
  const { t } = useTranslation();
  
  const corrections = transactions.filter(tx => tx.correctionOf);

  if (corrections.length === 0) {
    return null;
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-warning" />
          <h3 className="font-medium">Correction History</h3>
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            {corrections.length} corrections
          </Badge>
        </div>
        
        <div className="space-y-3">
          {corrections.map((correction, index) => (
            <div key={correction.transactionId} className="relative">
              <div className="flex items-start gap-3 p-3 bg-warning/5 border border-warning/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {correction.creator} correction
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(correction.timestamp * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Corrected transaction: {correction.correctionOf}
                  </p>
                  <p className="text-sm">
                    Updated by: {correction.currentOwner}
                  </p>
                </div>
              </div>
              
              {index < corrections.length - 1 && (
                <div className="absolute left-6 top-12 w-px h-4 bg-warning/30" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};