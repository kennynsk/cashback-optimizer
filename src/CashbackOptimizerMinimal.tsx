import React, { useState } from 'react';
import { Target, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CashbackOptimizerMinimal = () => {
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
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Target className="text-blue-600" size={32} />
            <h1 className="text-2xl font-bold text-gray-800">Оптимизатор кешбека</h1>
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

            <Button>Тест кнопки</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Минимальная версия
          </h2>
          <p className="text-gray-600">
            Выбранный год: <strong>{selectedYear}</strong><br/>
            Выбранный месяц: <strong>{getMonthName(currentMonth)}</strong>
          </p>
          <div className="mt-4">
            <Button variant="outline">Кнопка с outline</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashbackOptimizerMinimal; 