import React, { useState, useEffect } from 'react';
import { Target, Award, Calculator, Download, Calendar, AlertTriangle, DollarSign, Settings, Plus, X, Star, TrendingUp, Users, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CashbackOptimizerModern = () => {
  // Основные категории из ваших скриншотов (теперь редактируемые)
  const [categories, setCategories] = useState([
    'Автоуслуги', 'АЗС', 'Аксессуары', 'Аптека', 'Все покупки', 'Деливери',
    'Детские товары', 'Дом и ремонт', 'Искусство', 'Кафе и рестораны',
    'Книги и канцтовары', 'Красота', 'Мед услуги', 'Мегамаркет', 'Образование',
    'Одежда и обувь', 'Перекресток', 'Платные дороги', 'Развлечения',
    'Сервис Трэвел', 'Спорттовары', 'Супермаркеты', 'Такси', 'Театры и кино',
    'Транспорт', 'Цветы', 'Цифровой контент', 'Хобби', 'Электроника', 'Яндекс Еда'
  ]);

  const [banks, setBanks] = useState([
    { name: 'ВТБ', maxCategories: 3, cashbackLimit: 3000 },
    { name: 'Альфа', maxCategories: 3, cashbackLimit: 5000 },
    { name: 'Сбер', maxCategories: 5, cashbackLimit: 5000 },
    { name: 'Тинькофф', maxCategories: 4, cashbackLimit: 3000 }
  ]);

  // Функция для генерации месяцев для выбранного года
  const generateMonthsForYear = (year: number) => {
    const months = [];
    for (let month = 1; month <= 12; month++) {
      months.push(`${year}-${month.toString().padStart(2, '0')}`);
    }
    return months;
  };

  // Функция для получения названия месяца
  const getMonthName = (monthCode: string) => {
    const [year, month] = monthCode.split('-');
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    const monthIndex = parseInt(month) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  };

  // Состояние для выбранного года
  const [selectedYear, setSelectedYear] = useState(2025);
  const months = generateMonthsForYear(selectedYear);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthNum = currentDate.getMonth() + 1;
    return `${currentYear}-${currentMonthNum.toString().padStart(2, '0')}`;
  });
  
  const [monthlyData, setMonthlyData] = useState(() => {
    const initialMonthlyData: Record<string, any> = {};
    months.forEach(month => {
      initialMonthlyData[month] = {};
    });
    return initialMonthlyData;
  });

  // Траты по категориям для расчета лимитов
  const [categorySpending, setCategorySpending] = useState({
    'Автоуслуги': 5000, 'АЗС': 8000, 'Все покупки': 30000, 'Детские товары': 10000,
    'Кафе и рестораны': 15000, 'Супермаркеты': 25000, 'Транспорт': 8000, 'Такси': 5000,
    'Образование': 3000, 'Красота': 4000, 'Спорттовары': 3000, 'Театры и кино': 2000
  });

  const [optimization, setOptimization] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  
  // Приоритетные категории (настраиваемые)
  const [priorityCategories, setPriorityCategories] = useState(['Супермаркеты', 'Кафе и рестораны', 'Все покупки']);

  // Функция для создания пустой структуры данных
  const createEmptyData = () => {
    const newData: Record<string, any> = {};
    categories.forEach(category => {
      newData[category] = {};
      banks.forEach(bank => {
        newData[category][bank.name] = '';
      });
    });
    return newData;
  };

  // Обновляем структуру данных при изменении категорий или банков
  useEffect(() => {
    setMonthlyData(prev => {
      const updated = { ...prev };
      months.forEach(month => {
        if (!updated[month]) {
          updated[month] = {};
        }
        
        // Добавляем новые категории
        categories.forEach(category => {
          if (!updated[month][category]) {
            updated[month][category] = {};
          }
          // Добавляем новые банки
          banks.forEach(bank => {
            if (updated[month][category][bank.name] === undefined) {
              updated[month][category][bank.name] = '';
            }
          });
          // Удаляем банки которых больше нет
          Object.keys(updated[month][category]).forEach(bankName => {
            if (!banks.find(b => b.name === bankName)) {
              delete updated[month][category][bankName];
            }
          });
        });
        
        // Удаляем категории которых больше нет
        Object.keys(updated[month]).forEach(category => {
          if (!categories.includes(category)) {
            delete updated[month][category];
          }
        });
      });
      return updated;
    });
  }, [categories, banks, months]);

  // Обновляем текущий месяц при изменении года
  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthNum = currentDate.getMonth() + 1;
    
    // Если выбранный год совпадает с текущим, используем текущий месяц
    if (selectedYear === currentYear) {
      setCurrentMonth(`${currentYear}-${currentMonthNum.toString().padStart(2, '0')}`);
    } else {
      // Иначе используем январь выбранного года
      setCurrentMonth(`${selectedYear}-01`);
    }
  }, [selectedYear]);

  const data = monthlyData[currentMonth] || {};

  const checkIsPriority = (category: string) => {
    return priorityCategories.some(priority => {
      const lowerCategory = category.toLowerCase();
      const lowerPriority = priority.toLowerCase();
      
      // Точное совпадение
      if (lowerCategory === lowerPriority) return true;
      
      // Частичное совпадение (для гибкости)
      if (lowerCategory.includes(lowerPriority) || lowerPriority.includes(lowerCategory)) {
        return true;
      }
      
      return false;
    });
  };

  // Функции управления приоритетами
  const togglePriority = (category: string) => {
    if (checkIsPriority(category)) {
      setPriorityCategories(prev => prev.filter(p => {
        const lowerP = p.toLowerCase();
        const lowerCat = category.toLowerCase();
        return !(lowerP === lowerCat || lowerP.includes(lowerCat) || lowerCat.includes(lowerP));
      }));
    } else {
      setPriorityCategories(prev => [...prev, category]);
    }
  };

  // Функции управления категориями
  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories(prev => [...prev, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    setCategories(prev => prev.filter(cat => cat !== categoryToRemove));
    setCategorySpending(prev => {
      const updated = { ...prev };
      delete updated[categoryToRemove];
      return updated;
    });
  };

  // Функции управления банками
  const updateBank = (index: number, field: string, value: any) => {
    setBanks(prev => prev.map((bank, i) => 
      i === index ? { ...bank, [field]: value } : bank
    ));
  };

  const addBank = () => {
    setBanks(prev => [...prev, { name: 'Новый банк', maxCategories: 3, cashbackLimit: 3000 }]);
  };

  const removeBank = (indexToRemove: number) => {
    setBanks(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const updateData = (category: string, bankName: string, value: string) => {
    setMonthlyData(prev => ({
      ...prev,
      [currentMonth]: {
        ...prev[currentMonth],
        [category]: {
          ...prev[currentMonth]?.[category],
          [bankName]: value
        }
      }
    }));
  };

  const calculateCashback = (rate: number, spending: number, limit: number) => {
    const cashback = spending * rate / 100;
    return Math.min(cashback, limit);
  };

  const optimizeSelection = () => {
    const allOffers: any[] = [];
    
    // Создаем список всех предложений с расчетом реального кешбека
    Object.entries(data).forEach(([category, bankData]) => {
      Object.entries(bankData as Record<string, string>).forEach(([bankName, rate]) => {
        if (rate && !isNaN(parseFloat(rate))) {
          const bankIndex = banks.findIndex(b => b.name === bankName);
          const bank = banks[bankIndex];
          const spending = categorySpending[category] || 0;
          const realCashback = calculateCashback(parseFloat(rate), spending, bank.cashbackLimit);
          
          allOffers.push({
            bankIndex,
            bankName,
            category,
            rate: parseFloat(rate),
            isPriority: checkIsPriority(category),
            spending,
            realCashback,
            isLimitHit: realCashback >= bank.cashbackLimit
          });
        }
      });
    });

    // Сортируем: сначала приоритетные, затем по реальному кешбеку
    allOffers.sort((a, b) => {
      if (a.isPriority !== b.isPriority) {
        return b.isPriority - a.isPriority;
      }
      return b.realCashback - a.realCashback;
    });

    const result = {
      selections: banks.map(bank => ({ 
        bankName: bank.name, 
        categories: [], 
        maxCategories: bank.maxCategories,
        totalCashback: 0,
        cashbackLimit: bank.cashbackLimit
      })),
      usedCategories: new Set(),
      totalValue: 0,
      totalRealCashback: 0,
      priorityCovered: 0,
      selectedCells: new Set(),
      limitWarnings: []
    };

    // Выбираем категории
    allOffers.forEach(offer => {
      const bankSelection = result.selections[offer.bankIndex];
      
      if (bankSelection.categories.length < bankSelection.maxCategories && 
          !result.usedCategories.has(offer.category)) {
        
        bankSelection.categories.push({
          category: offer.category,
          rate: offer.rate,
          isPriority: offer.isPriority,
          spending: offer.spending,
          realCashback: offer.realCashback,
          isLimitHit: offer.isLimitHit
        });
        
        bankSelection.totalCashback += offer.realCashback;
        result.usedCategories.add(offer.category);
        result.totalValue += offer.rate;
        result.totalRealCashback += offer.realCashback;
        result.selectedCells.add(`${offer.category}-${offer.bankName}`);
        
        if (offer.isPriority) {
          result.priorityCovered++;
        }

        if (offer.isLimitHit) {
          result.limitWarnings.push({
            bank: offer.bankName,
            category: offer.category,
            limit: banks[offer.bankIndex].cashbackLimit
          });
        }
      }
    });

    setOptimization(result);
  };

  useEffect(() => {
    optimizeSelection();
  }, [currentMonth, monthlyData, categorySpending, priorityCategories]);

  const loadSampleData = () => {
    const sampleData = {
      'Автоуслуги': { 'ВТБ': '', 'Альфа': '', 'Сбер': '', 'Тинькофф': '5.0' },
      'АЗС': { 'ВТБ': '3.0', 'Альфа': '5.0', 'Сбер': '', 'Тинькофф': '7.0' },
      'Все покупки': { 'ВТБ': '1.5', 'Альфа': '1.0', 'Сбер': '1.0', 'Тинькофф': '1.0' },
      'Детские товары': { 'ВТБ': '15.0', 'Альфа': '', 'Сбер': '', 'Тинькофф': '' },
      'Кафе и рестораны': { 'ВТБ': '8.0', 'Альфа': '5.0', 'Сбер': '', 'Тинькофф': '' },
      'Книги и канцтовары': { 'ВТБ': '', 'Альфа': '7.0', 'Сбер': '', 'Тинькофф': '' },
      'Красота': { 'ВТБ': '', 'Альфа': '', 'Сбер': '5.0', 'Тинькофф': '' },
      'Образование': { 'ВТБ': '', 'Альфа': '', 'Сбер': '5.0', 'Тинькофф': '' },
      'Спорттовары': { 'ВТБ': '6.0', 'Альфа': '', 'Сбер': '', 'Тинькофф': '5.0' },
      'Супермаркеты': { 'ВТБ': '3.0', 'Альфа': '', 'Сбер': '', 'Тинькофф': '' },
      'Такси': { 'ВТБ': '', 'Альфа': '5.0', 'Сбер': '', 'Тинькофф': '' },
      'Транспорт': { 'ВТБ': '10.0', 'Альфа': '', 'Сбер': '10.0', 'Тинькофф': '' }
    };
    
    setMonthlyData(prev => ({
      ...prev,
      [currentMonth]: {
        ...prev[currentMonth],
        ...Object.fromEntries(
          Object.entries(sampleData).map(([category, bankData]) => [
            category,
            { ...(prev[currentMonth]?.[category] || {}), ...bankData }
          ])
        )
      }
    }));
  };

  const clearCurrentMonth = () => {
    setMonthlyData(prev => ({
      ...prev,
      [currentMonth]: createEmptyData()
    }));
  };

  const copyFromPreviousMonth = () => {
    const currentIndex = months.indexOf(currentMonth);
    if (currentIndex > 0) {
      const previousMonth = months[currentIndex - 1];
      const previousData = monthlyData[previousMonth] || {};
      
      setMonthlyData(prev => ({
        ...prev,
        [currentMonth]: { ...previousData }
      }));
    }
  };

  const getCellStyle = (category: string, bankName: string) => {
    const isSelected = optimization?.selectedCells.has(`${category}-${bankName}`);
    const isPriority = checkIsPriority(category);
    const hasValue = data[category]?.[bankName] && !isNaN(parseFloat(data[category][bankName]));
    
    let className = "w-16 h-10 text-center border text-sm rounded transition-all ";
    
    if (isSelected) {
      className += "bg-green-100 border-green-500 font-semibold shadow-sm ";
    } else if (hasValue) {
      className += "bg-blue-50 border-blue-200 ";
    } else {
      className += "bg-white hover:bg-gray-50 border-gray-200 ";
    }
    
    return className;
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Заголовок */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
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
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Выбор месяца */}
            <div className="flex items-center gap-2">
              <Select value={currentMonth} onValueChange={setCurrentMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month} value={month}>
                      {getMonthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2"
              >
                <Settings size={16} />
                Настройки
              </Button>
              <Button
                onClick={loadSampleData}
                className="flex items-center gap-2"
              >
                <Download size={16} />
                Пример
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Панель настроек */}
        {showSettings && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Настройки</CardTitle>
              <CardDescription>Настройте банки, категории и траты</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="banks" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="banks">Банки</TabsTrigger>
                  <TabsTrigger value="categories">Категории</TabsTrigger>
                  <TabsTrigger value="spending">Траты</TabsTrigger>
                </TabsList>
                
                <TabsContent value="banks" className="space-y-4">
                  <div className="space-y-3">
                    {banks.map((bank, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
                        <Input
                          type="text"
                          value={bank.name}
                          onChange={(e) => updateBank(index, 'name', e.target.value)}
                          className="flex-1"
                          placeholder="Название банка"
                        />
                        <Input
                          type="number"
                          value={bank.maxCategories}
                          onChange={(e) => updateBank(index, 'maxCategories', parseInt(e.target.value) || 1)}
                          className="w-20 text-center"
                          min="1" max="10"
                          placeholder="Макс. кат."
                        />
                        <Input
                          type="number"
                          value={bank.cashbackLimit}
                          onChange={(e) => updateBank(index, 'cashbackLimit', parseInt(e.target.value) || 1000)}
                          className="w-24 text-center"
                          min="1000" step="500"
                          placeholder="Лимит"
                        />
                        <span className="text-sm text-gray-500">₽</span>
                        {banks.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBank(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X size={16} />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={addBank}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Добавить банк
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="categories" className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Новая категория"
                      onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                    />
                    <Button onClick={addCategory}>
                      <Plus size={16} />
                    </Button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {categories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <span className={checkIsPriority(category) ? 'text-blue-600 font-medium' : ''}>
                          {category}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCategory(category)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="spending" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(categorySpending).map(([category, amount]) => (
                      <div key={category}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {category}
                        </label>
                        <Input
                          type="number"
                          value={amount}
                          onChange={(e) => setCategorySpending(prev => ({
                            ...prev,
                            [category]: parseInt(e.target.value) || 0
                          }))}
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Основная таблица */}
          <div className="col-span-12 lg:col-span-8">
            <Card>
              {/* Копирование из предыдущего месяца */}
              {months.indexOf(currentMonth) > 0 && (
                <div className="p-4 border-b border-gray-200 bg-blue-50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyFromPreviousMonth}
                    className="mr-2"
                  >
                    📋 Скопировать из {getMonthName(months[months.indexOf(currentMonth) - 1])}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCurrentMonth}
                  >
                    Очистить
                  </Button>
                </div>
              )}

              {/* Таблица */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-white z-10 min-w-[200px]">
                        Категория
                      </TableHead>
                      {banks.map(bank => (
                        <TableHead key={bank.name} className="text-center min-w-[100px]">
                          <div>{bank.name}</div>
                          <div className="text-xs font-normal text-gray-500">
                            {bank.maxCategories} кат. | {formatMoney(bank.cashbackLimit)}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category}>
                        <TableCell className="sticky left-0 bg-white z-10 border-r border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className={checkIsPriority(category) ? 'text-blue-600 font-semibold' : 'text-gray-800'}>
                              {category}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePriority(category)}
                              className={`p-1 ${
                                checkIsPriority(category) 
                                  ? 'text-yellow-500 hover:text-yellow-600' 
                                  : 'text-gray-300 hover:text-yellow-400'
                              }`}
                            >
                              <Star size={16} fill={checkIsPriority(category) ? 'currentColor' : 'none'} />
                            </Button>
                          </div>
                        </TableCell>
                        {banks.map(bank => (
                          <TableCell key={bank.name} className="text-center">
                            <Input
                              type="number"
                              step="0.1"
                              value={data[category]?.[bank.name] || ''}
                              onChange={(e) => updateData(category, bank.name, e.target.value)}
                              className={getCellStyle(category, bank.name)}
                              placeholder="0"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Боковая панель с результатами */}
          <div className="col-span-12 lg:col-span-4">
            <div className="space-y-6">
              {/* Статистика */}
              {optimization && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="text-green-600" size={20} />
                      Результаты
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Приоритеты:</span>
                        <Badge variant="secondary">
                          {optimization.priorityCovered}/{priorityCategories.length}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Сумма %:</span>
                        <Badge variant="outline" className="text-green-600">
                          {optimization.totalValue.toFixed(1)}%
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Кешбек:</span>
                        <span className="font-bold text-emerald-600 text-lg">
                          {formatMoney(optimization.totalRealCashback)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Выбрано:</span>
                        <Badge variant="outline" className="text-yellow-600">
                          {optimization.selectedCells.size} категорий
                        </Badge>
                      </div>
                    </div>

                    {/* Приоритетные категории */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600 mb-2">Приоритеты:</div>
                      <div className="flex flex-wrap gap-1">
                        {priorityCategories.map((priority, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {priority}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Предупреждения о лимитах */}
              {optimization && optimization.limitWarnings.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="text-red-600" size={20} />
                      Лимиты достигнуты
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {optimization.limitWarnings.map((warning: any, idx: number) => (
                        <div key={idx} className="text-sm text-red-700">
                          {warning.bank}: {warning.category}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Рекомендации */}
              {optimization && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="text-blue-600" size={20} />
                      Рекомендации
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {optimization.selections.map((selection: any, index: number) => (
                        selection.categories.length > 0 && (
                          <div key={index} className="border-l-4 border-green-500 pl-3">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-gray-800">{selection.bankName}</h4>
                              <Badge variant="outline" className="text-green-600">
                                {formatMoney(selection.totalCashback)}
                              </Badge>
                            </div>
                            
                            <div className="space-y-1">
                              {selection.categories.map((cat: any, idx: number) => (
                                <div key={idx} className="text-sm">
                                  <div className="flex justify-between">
                                    <span className={cat.isPriority ? 'text-blue-600 font-medium' : 'text-gray-700'}>
                                      {cat.category}
                                    </span>
                                    <span className="font-medium">{cat.rate}%</span>
                                  </div>
                                  {cat.spending > 0 && (
                                    <div className="text-xs text-gray-500 flex justify-between">
                                      <span>{formatMoney(cat.spending)}</span>
                                      <span className={cat.isLimitHit ? 'text-red-500' : ''}>
                                        +{formatMoney(cat.realCashback)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Подсказки */}
        <Card className="mt-6 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-sm text-yellow-800">
              <strong>💡 Быстрые действия:</strong> Нажмите ⭐ рядом с категорией чтобы сделать её приоритетной • 
              Зеленые ячейки = рекомендации алгоритма • 
              Синие ячейки = введены данные
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CashbackOptimizerModern; 