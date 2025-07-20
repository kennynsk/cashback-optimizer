import React, { useState, useEffect } from 'react';
import { Target, Award, Calculator, Download, Calendar, AlertTriangle, DollarSign, Settings, Plus, X, Star } from 'lucide-react';

const CashbackOptimizer = () => {
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
  const generateMonthsForYear = (year) => {
    const months = [];
    for (let month = 1; month <= 12; month++) {
      months.push(`${year}-${month.toString().padStart(2, '0')}`);
    }
    return months;
  };

  // Функция для получения названия месяца
  const getMonthName = (monthCode) => {
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
    const initialMonthlyData = {};
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

  const [optimization, setOptimization] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  
  // Приоритетные категории (настраиваемые)
  const [priorityCategories, setPriorityCategories] = useState(['Супермаркеты', 'Кафе и рестораны', 'Все покупки']);

  // Функция для создания пустой структуры данных
  const createEmptyData = () => {
    const newData = {};
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

  const checkIsPriority = (category) => {
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
  const togglePriority = (category) => {
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

  const removeCategory = (categoryToRemove) => {
    setCategories(prev => prev.filter(cat => cat !== categoryToRemove));
    setCategorySpending(prev => {
      const updated = { ...prev };
      delete updated[categoryToRemove];
      return updated;
    });
  };

  // Функции управления банками
  const updateBank = (index, field, value) => {
    setBanks(prev => prev.map((bank, i) => 
      i === index ? { ...bank, [field]: value } : bank
    ));
  };

  const addBank = () => {
    setBanks(prev => [...prev, { name: 'Новый банк', maxCategories: 3, cashbackLimit: 3000 }]);
  };

  const removeBank = (indexToRemove) => {
    setBanks(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const updateData = (category, bankName, value) => {
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

  const calculateCashback = (rate, spending, limit) => {
    const cashback = spending * rate / 100;
    return Math.min(cashback, limit);
  };

  const optimizeSelection = () => {
    const allOffers = [];
    
    // Создаем список всех предложений с расчетом реального кешбека
    Object.entries(data).forEach(([category, bankData]) => {
      Object.entries(bankData).forEach(([bankName, rate]) => {
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

  const getCellStyle = (category, bankName) => {
    const isSelected = optimization?.selectedCells.has(`${category}-${bankName}`);
    const isPriority = checkIsPriority(category);
    const hasValue = data[category]?.[bankName] && !isNaN(parseFloat(data[category][bankName]));
    
    let className = "w-16 h-10 text-center border border-gray-300 text-sm rounded ";
    
    if (isSelected) {
      className += "bg-green-200 border-green-500 font-semibold shadow-sm ";
    } else if (hasValue) {
      className += "bg-blue-50 border-blue-200 ";
    } else {
      className += "bg-white hover:bg-gray-50 ";
    }
    
    return className;
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
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

            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Settings size={16} />
                Настройки
              </button>
              <button
                onClick={loadSampleData}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                Пример
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Панель настроек */}
        {showSettings && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Настройки банков */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">⚙️ Банки и лимиты</h3>
                <div className="space-y-3">
                  {banks.map((bank, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
                      <input
                        type="text"
                        value={bank.name}
                        onChange={(e) => updateBank(index, 'name', e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        value={bank.maxCategories}
                        onChange={(e) => updateBank(index, 'maxCategories', parseInt(e.target.value) || 1)}
                        className="w-16 p-2 border border-gray-300 rounded text-sm text-center"
                        min="1" max="10"
                      />
                      <input
                        type="number"
                        value={bank.cashbackLimit}
                        onChange={(e) => updateBank(index, 'cashbackLimit', parseInt(e.target.value) || 1000)}
                        className="w-20 p-2 border border-gray-300 rounded text-sm text-center"
                        min="1000" step="500"
                      />
                      <span className="text-sm text-gray-500">₽</span>
                      {banks.length > 1 && (
                        <button
                          onClick={() => removeBank(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addBank}
                    className="w-full p-3 border-2 border-dashed border-gray-300 text-gray-600 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Добавить банк
                  </button>
                </div>
              </div>

              {/* Управление категориями */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">📝 Категории</h3>
                <div className="mb-3 flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Новая категория"
                    onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                  />
                  <button
                    onClick={addCategory}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {categories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                      <span className={checkIsPriority(category) ? 'text-blue-600 font-medium' : ''}>
                        {category}
                      </span>
                      <button
                        onClick={() => removeCategory(category)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Настройка трат */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4">💰 Месячные траты (для расчета лимитов)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(categorySpending).map(([category, amount]) => (
                  <div key={category}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {category}
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setCategorySpending(prev => ({
                        ...prev,
                        [category]: parseInt(e.target.value) || 0
                      }))}
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Основная таблица */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Копирование из предыдущего месяца */}
              {months.indexOf(currentMonth) > 0 && (
                <div className="p-4 border-b border-gray-200 bg-blue-50">
                  <button
                    onClick={copyFromPreviousMonth}
                    className="text-sm px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    📋 Скопировать из {getMonthName(months[months.indexOf(currentMonth) - 1])}
                  </button>
                  <button
                    onClick={clearCurrentMonth}
                    className="ml-2 text-sm px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    Очистить
                  </button>
                </div>
              )}

              {/* Таблица */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-800 sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                        Категория
                      </th>
                      {banks.map(bank => (
                        <th key={bank.name} className="text-center p-4 font-semibold text-gray-800 min-w-[100px]">
                          <div>{bank.name}</div>
                          <div className="text-xs font-normal text-gray-500">
                            {bank.maxCategories} кат. | {formatMoney(bank.cashbackLimit)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, index) => (
                      <tr key={category} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4 sticky left-0 bg-white z-10 border-r border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className={checkIsPriority(category) ? 'text-blue-600 font-semibold' : 'text-gray-800'}>
                              {category}
                            </span>
                            <button
                              onClick={() => togglePriority(category)}
                              className={`p-1 rounded transition-colors ${
                                checkIsPriority(category) 
                                  ? 'text-yellow-500 hover:text-yellow-600' 
                                  : 'text-gray-300 hover:text-yellow-400'
                              }`}
                              title={checkIsPriority(category) ? 'Убрать из приоритетных' : 'Добавить в приоритетные'}
                            >
                              <Star size={16} fill={checkIsPriority(category) ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                        </td>
                        {banks.map(bank => (
                          <td key={bank.name} className="p-4 text-center">
                            <input
                              type="number"
                              step="0.1"
                              value={data[category]?.[bank.name] || ''}
                              onChange={(e) => updateData(category, bank.name, e.target.value)}
                              className={getCellStyle(category, bank.name)}
                              placeholder="0"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Боковая панель с результатами */}
          <div className="col-span-12 lg:col-span-4">
            <div className="space-y-6">
              {/* Статистика */}
              {optimization && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">📊 Результаты</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Приоритеты:</span>
                      <span className="font-semibold text-blue-600">
                        {optimization.priorityCovered}/{priorityCategories.length}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Сумма %:</span>
                      <span className="font-semibold text-green-600">
                        {optimization.totalValue.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Кешбек:</span>
                      <span className="font-bold text-emerald-600 text-lg">
                        {formatMoney(optimization.totalRealCashback)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Выбрано:</span>
                      <span className="font-semibold text-yellow-600">
                        {optimization.selectedCells.size} категорий
                      </span>
                    </div>
                  </div>

                  {/* Приоритетные категории */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-2">Приоритеты:</div>
                    <div className="flex flex-wrap gap-1">
                      {priorityCategories.map((priority, index) => (
                        <span key={index} className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                          {priority}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Предупреждения о лимитах */}
              {optimization && optimization.limitWarnings.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="text-red-600" size={16} />
                    <span className="font-semibold text-red-800 text-sm">Лимиты достигнуты</span>
                  </div>
                  <div className="space-y-1">
                    {optimization.limitWarnings.map((warning, idx) => (
                      <div key={idx} className="text-xs text-red-700">
                        {warning.bank}: {warning.category}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Рекомендации */}
              {optimization && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">🎯 Рекомендации</h3>
                  
                  <div className="space-y-4">
                    {optimization.selections.map((selection, index) => (
                      selection.categories.length > 0 && (
                        <div key={index} className="border-l-4 border-green-500 pl-3">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-gray-800">{selection.bankName}</h4>
                            <span className="text-sm font-semibold text-green-600">
                              {formatMoney(selection.totalCashback)}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            {selection.categories.map((cat, idx) => (
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
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Подсказки */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-800">
            <strong>💡 Быстрые действия:</strong> Нажмите ⭐ рядом с категорией чтобы сделать её приоритетной • 
            Зеленые ячейки = рекомендации алгоритма • 
            Синие ячейки = введены данные
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashbackOptimizer;