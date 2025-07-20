import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Users, DollarSign } from 'lucide-react';

interface BankCardProps {
  bankName: string;
  maxCategories: number;
  cashbackLimit: number;
  usedCategories: number;
  totalCashback: number;
  categories: Array<{
    category: string;
    rate: number;
    isPriority: boolean;
    spending: number;
    realCashback: number;
    isLimitHit: boolean;
  }>;
}

export const BankCard: React.FC<BankCardProps> = ({
  bankName,
  maxCategories,
  cashbackLimit,
  usedCategories,
  totalCashback,
  categories
}) => {
  const usagePercentage = (usedCategories / maxCategories) * 100;
  const cashbackPercentage = (totalCashback / cashbackLimit) * 100;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{bankName}</CardTitle>
          <Badge variant="outline" className="text-green-600">
            {totalCashback.toLocaleString('ru-RU')} ₽
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Прогресс использования категорий */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-gray-500" />
              <span>Категории</span>
            </div>
            <span className="text-gray-600">
              {usedCategories}/{maxCategories}
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
        </div>

        {/* Прогресс кешбека */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span>Кешбек</span>
            </div>
            <span className="text-gray-600">
              {cashbackPercentage.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={cashbackPercentage} 
            className={`h-2 ${cashbackPercentage >= 90 ? 'bg-red-100' : ''}`}
          />
        </div>

        {/* Список категорий */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Выбранные категории:</h4>
            <div className="space-y-1">
              {categories.map((cat, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className={`${cat.isPriority ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                    {cat.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {cat.rate}%
                    </Badge>
                    {cat.isLimitHit && (
                      <Badge variant="destructive" className="text-xs">
                        Лимит
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 