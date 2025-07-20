import React, { useState } from 'react';
import { Target, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CashbackOptimizerSimple = () => {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [currentMonth, setCurrentMonth] = useState('2025-07');

  const months = [
    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
    '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'
  ];

  const getMonthName = (monthCode: string) => {
    const [year, month] = monthCode.split('-');
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    const monthIndex = parseInt(month) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Заголовок */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="text-blue-600" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Оптимизатор кешбека</h1>
              <p className="text-sm text-gray-600">Максимизируйте доход от кешбек-программ</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Выбор года */}
            <div className="flex items-center gap-2">
              <Calendar className="text-gray-600" size={20} />
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Выбор месяца */}
            <div className="flex items-center gap-2">
              <select 
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {months.map(month => (
                  <option key={month} value={month}>
                    {getMonthName(month)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Тестовая версия с shadcn/ui</CardTitle>
              <CardDescription>Проверка работы компонентов</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Выбранный год: <strong>{selectedYear}</strong><br/>
                Выбранный месяц: <strong>{getMonthName(currentMonth)}</strong>
              </p>
              
              <div className="flex gap-2">
                <Button>Тестовая кнопка</Button>
                <Button variant="outline">Кнопка с outline</Button>
                <Button variant="secondary">Вторичная кнопка</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Статус компонентов</CardTitle>
              <CardDescription>Проверка работоспособности</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Button компонент</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Card компонент</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Остальные компоненты</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CashbackOptimizerSimple; 