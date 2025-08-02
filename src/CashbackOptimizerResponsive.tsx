import React, { useState, useEffect, useCallback } from 'react';
import { Target, Award, Calculator, Download, Calendar, AlertTriangle, DollarSign, Settings, Plus, X, Star, Menu, ChevronDown } from 'lucide-react';
import { db } from './lib/utils';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './components/AuthProvider';

// Типизация для структуры monthlyData
interface MonthlyData {
  [category: string]: {
    [bankName: string]: string;
  };
}
interface AllMonthlyData {
  [month: string]: MonthlyData;
}

// Тип для банка
interface Bank {
  name: string;
  maxCategories: number;
  cashbackLimit: number;
}

// Тип для результата оптимизации
interface OptimizationResult {
  selections: {
    bankName: string;
    categories: {
      category: string;
      rate: number;
      isPriority: boolean;
      spending: number;
      realCashback: number;
      isLimitHit: boolean;
    }[];
    maxCategories: number;
    totalCashback: number;
    cashbackLimit: number;
  }[];
  usedCategories: Set<string>;
  totalValue: number;
  totalRealCashback: number;
  priorityCovered: number;
  selectedCells: Set<string>;
  limitWarnings: { bank: string; category: string; limit: number }[];
}

// Тип для полного состояния месяца
interface SyncedMonthData {
  monthlyData: MonthlyData;
  banks: Bank[];
  categories: string[];
  priorityCategories: string[];
  categorySpending: Record<string, number>;
  optimizationStrategy?: 'rate' | 'cashback';
  lastModified: number; // Добавляем timestamp
  deviceId?: string; // Добавляем ID устройства
}

const CashbackOptimizerResponsive = () => {
  const { user } = useAuth();
  // Основные категории
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

  // Состояние для мобильного меню
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('table');

  // Функция для генерации месяцев для выбранного года
  const generateMonthsForYear = (year: number) => {
    const months: string[] = [];
    for (let month = 1; month <= 12; month++) {
      months.push(`${year}-${month.toString().padStart(2, '0')}`);
    }
    return months;
  };

  // Функция для получения названия месяца
  const getMonthName = (monthCode: string) => {
    const [year, month] = monthCode.split('-');
    const monthNames = [
      'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
      'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
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
  // Флаг для отслеживания ручного выбора месяца
  const [isManualMonthSelection, setIsManualMonthSelection] = useState(false);
  const [monthlyData, setMonthlyData] = useState<AllMonthlyData>(() => {
    const initialMonthlyData: AllMonthlyData = {};
    months.forEach(month => {
      initialMonthlyData[month] = {};
    });
    return initialMonthlyData;
  });

  // Траты по категориям для расчета лимитов
  const [categorySpending, setCategorySpending] = useState<Record<string, number>>({
    'Автоуслуги': 5000, 'АЗС': 8000, 'Все покупки': 30000, 'Детские товары': 10000,
    'Кафе и рестораны': 15000, 'Супермаркеты': 25000, 'Транспорт': 8000, 'Такси': 5000,
    'Образование': 3000, 'Красота': 4000, 'Спорттовары': 3000, 'Театры и кино': 2000
  });

  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false); // Флаг загрузки данных
  
  // Приоритетные категории (настраиваемые)
  const [priorityCategories, setPriorityCategories] = useState(['Супермаркеты', 'Кафе и рестораны', 'Все покупки']);

  // Добавляем состояние для стратегии оптимизации

  // Добавляем состояние для отслеживания синхронизации
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'conflict' | 'success' | 'error'>('idle');

  // Функция для получения уникального ID устройства
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  // Функция для проверки конфликтов
  const checkForConflicts = async () => {
    const uid = user?.uid;
    if (!uid) return { hasConflict: false };

    try {
      const docRef = doc(db, 'users', uid, 'monthlyData', currentMonth);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<SyncedMonthData>;
        const localLastModified = localStorage.getItem(`lastModified_${currentMonth}`);

        if (localLastModified && data.lastModified) {
          const localTime = parseInt(localLastModified);
          const serverTime = data.lastModified;

          if (Math.abs(localTime - serverTime) > 60000) { // Разница больше 1 минуты
            console.log('⚠️ Обнаружен потенциальный конфликт данных');
            return {
              hasConflict: true,
              localTime: new Date(localTime).toLocaleString(),
              serverTime: new Date(serverTime).toLocaleString(),
              deviceId: data.deviceId
            };
          }
        }
      }

      return { hasConflict: false };
    } catch (error) {
      console.error('Ошибка проверки конфликтов:', error);
      return { hasConflict: false };
    }
  };

  // Функция для умного сохранения данных с timestamp
  const saveDataWithTimestamp = async () => {
    const uid = user?.uid;
    if (!uid) return;

    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      const currentTime = Date.now();
      const deviceId = getDeviceId();

      console.log('=== УМНОЕ СОХРАНЕНИЕ ДАННЫХ ===');
      console.log('Сохранение данных для месяца:', currentMonth);
      console.log('Пользователь:', uid);
      console.log('Время:', new Date(currentTime).toISOString());
      console.log('Устройство:', deviceId);

      const data: SyncedMonthData = {
        monthlyData: monthlyData[currentMonth] || {},
        banks,
        categories,
        priorityCategories,
        categorySpending,
        optimizationStrategy,
        lastModified: currentTime,
        deviceId
      };

      console.log('Данные для сохранения:', data);

      await setDoc(doc(db, 'users', uid, 'monthlyData', currentMonth), data);
      console.log('✅ Данные успешно сохранены для месяца:', currentMonth);

      // Сохраняем timestamp локально
      localStorage.setItem(`lastModified_${currentMonth}`, currentTime.toString());
      setLastSyncTime(currentTime);
      setSyncStatus('success');

      // Сбрасываем статус через 3 секунды
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('❌ Ошибка сохранения данных для месяца:', currentMonth, error);
      setSyncStatus('error');

      // Сбрасываем статус через 5 секунд
      setTimeout(() => setSyncStatus('idle'), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Функция для принудительной синхронизации
  const forceSync = async () => {
    const uid = user?.uid;
    if (!uid) return;

    try {
      console.log('=== ПРИНУДИТЕЛЬНАЯ СИНХРОНИЗАЦИЯ ===');
      setSyncStatus('syncing');

      // Сначала загружаем последние данные с сервера
      const docRef = doc(db, 'users', uid, 'monthlyData', currentMonth);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<SyncedMonthData>;
        console.log('Загружаем последние данные с сервера:', data);

        // Обновляем локальные данные
        if (data.banks && data.banks.length > 0) setBanks(data.banks);
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories.sort((a, b) => a.localeCompare(b, 'ru')));
        }
        if (data.priorityCategories && data.priorityCategories.length > 0) {
          setPriorityCategories(data.priorityCategories);
        }
        if (data.categorySpending) setCategorySpending(data.categorySpending);
        if (data.optimizationStrategy) setOptimizationStrategy(data.optimizationStrategy);
        if (data.monthlyData) {
          setMonthlyData(prev => ({ ...prev, [currentMonth]: data.monthlyData || {} }));
        }

        // Обновляем timestamp
        if (data.lastModified) {
          localStorage.setItem(`lastModified_${currentMonth}`, data.lastModified.toString());
        }
      }

      // Затем сохраняем текущие данные
      await saveDataWithTimestamp();

      alert('✅ Синхронизация завершена!');
    } catch (error) {
      console.error('❌ Ошибка принудительной синхронизации:', error);
      alert('❌ Ошибка синхронизации: ' + error);
      setSyncStatus('error');
    }
  };
  const [optimizationStrategy, setOptimizationStrategy] = useState<'rate' | 'cashback'>('rate');

  // Функция для принудительного сохранения данных (обновлена для умной синхронизации)
  const forceSaveData = useCallback(async (updatedData?: Partial<SyncedMonthData>) => {
    const uid = user?.uid;
    if (!uid) {
      console.log('❌ Пользователь не авторизован, пропускаем сохранение');
      return;
    }
    
    try {
      console.log('=== ПРИНУДИТЕЛЬНОЕ СОХРАНЕНИЕ ===');
      console.log('Месяц:', currentMonth);
      console.log('Пользователь:', uid);
      console.log('Обновляемые данные:', updatedData);
      
      // Используем умное сохранение с timestamp
      await saveDataWithTimestamp();
      console.log('✅ Принудительное сохранение завершено для месяца:', currentMonth);
    } catch (error) {
      console.error('❌ Ошибка принудительного сохранения данных для месяца:', currentMonth, error);
    }
  }, [user?.uid, currentMonth, monthlyData, banks, categories, priorityCategories, categorySpending, optimizationStrategy]);

  // Функция для создания пустой структуры данных
  const createEmptyData = (): MonthlyData => {
    const newData: MonthlyData = {};
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
    // Проверяем, что у нас есть данные для работы
    if (categories.length === 0 || banks.length === 0) {
      return;
    }
    
    // Проверяем, что у нас есть пользователь (данные уже загружены)
    if (!user?.uid) {
      return;
    }
    
    // Проверяем, что данные загружены
    if (!dataLoaded) {
      return;
    }
    
    // Добавляем небольшую задержку, чтобы дать время загрузиться данным из Firebase
    const timeoutId = setTimeout(() => {
      setMonthlyData(prev => {
        const updated = { ...prev };
        months.forEach(month => {
          if (!updated[month]) {
            updated[month] = {};
          }
          
          categories.forEach(category => {
            if (!updated[month][category]) {
              updated[month][category] = {};
            }
            banks.forEach(bank => {
              if (updated[month][category][bank.name] === undefined) {
                updated[month][category][bank.name] = '';
              }
            });
            // Удаляем только те банки, которых больше нет в списке
            Object.keys(updated[month][category]).forEach(bankName => {
              if (!banks.find(b => b.name === bankName)) {
                delete updated[month][category][bankName];
              }
            });
          });
          
          // Удаляем только те категории, которых больше нет в списке
          Object.keys(updated[month]).forEach(category => {
            if (!categories.includes(category)) {
              delete updated[month][category];
            }
          });
        });
        
        return updated;
      });
    }, 500); // Задержка 500мс

    return () => clearTimeout(timeoutId);
  }, [categories, banks, months, user?.uid, dataLoaded]);

  // Обновляем текущий месяц при изменении года (только если не было ручного выбора)
  useEffect(() => {
    // Если пользователь выбрал месяц вручную, не перезаписываем его выбор
    if (isManualMonthSelection) {
      console.log('Пропускаем автоматическое обновление месяца - пользователь выбрал вручную');
      return;
    }
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthNum = currentDate.getMonth() + 1;
    
    if (selectedYear === currentYear) {
      const newCurrentMonth = `${currentYear}-${currentMonthNum.toString().padStart(2, '0')}`;
      // Обновляем только если месяц действительно изменился
      if (currentMonth !== newCurrentMonth) {
        console.log('Автоматическое обновление текущего месяца:', currentMonth, '->', newCurrentMonth);
        setCurrentMonth(newCurrentMonth);
      }
    } else {
      const newCurrentMonth = `${selectedYear}-01`;
      if (currentMonth !== newCurrentMonth) {
        console.log('Обновление месяца при смене года:', currentMonth, '->', newCurrentMonth);
        setCurrentMonth(newCurrentMonth);
      }
    }
  }, [selectedYear, currentMonth, isManualMonthSelection]);

  // Загрузка данных из Firestore при смене месяца (дублирующая логика, убираем)
  // useEffect(() => {
  //   const uid = user?.uid;
  //   if (!uid) return;
  //   
  //   async function fetchData() {
  //     try {
  //       console.log('=== ЗАГРУЗКА ДАННЫХ ===');
  //       console.log('Загрузка данных из Firestore:', {
  //         userId: uid,
  //         month: currentMonth
  //       });
  //       
  //       const docRef = doc(db, 'users', uid!, 'monthlyData', currentMonth);
  //       const docSnap = await getDoc(docRef);
  //       
  //       if (docSnap.exists()) {
  //         const data = docSnap.data() as Partial<SyncedMonthData>;
  //         console.log('Данные загружены из Firebase:', data);
  //         console.log('Структура monthlyData:', data.monthlyData);
  //         console.log('Банки в данных:', data.banks);
  //         console.log('Категории в данных:', data.categories);
  //         
  //         // Обновляем банки и категории только если они есть в сохраненных данных
  //         if (data.banks && data.banks.length > 0) {
  //           console.log('Обновляем банки на:', data.banks);
  //           setBanks(data.banks);
  //         } else {
  //           console.log('Банки не найдены в данных, оставляем текущие');
  //         }
  //         
  //         if (data.categories && data.categories.length > 0) {
  //           console.log('Обновляем категории на:', data.categories);
  //           setCategories(data.categories.sort((a, b) => a.localeCompare(b, 'ru')));
  //         } else {
  //           console.log('Категории не найдены в данных, оставляем текущие');
  //         }
  //         
  //         if (data.priorityCategories && data.priorityCategories.length > 0) {
  //           console.log('Обновляем приоритеты на:', data.priorityCategories);
  //           setPriorityCategories(data.priorityCategories);
  //         } else {
  //           console.log('Приоритеты не найдены в данных, оставляем текущие');
  //         }
  //         
  //         if (data.categorySpending) {
  //           console.log('Обновляем траты на:', data.categorySpending);
  //           setCategorySpending(data.categorySpending);
  //         } else {
  //           console.log('Траты не найдены в данных, оставляем текущие');
  //         }
  //         
  //         // Обновляем данные месяца
  //         console.log('Обновляем monthlyData для месяца:', currentMonth, 'с данными:', data.monthlyData);
  //         setMonthlyData(prev => {
  //           const newMonthlyData = { ...prev, [currentMonth]: data.monthlyData || prev[currentMonth] || {} };
  //           console.log('Новый monthlyData после загрузки:', newMonthlyData);
  //           console.log('Данные для текущего месяца:', newMonthlyData[currentMonth]);
  //           return newMonthlyData;
  //         });
  //       } else {
  //         console.log('Данные для месяца не найдены в Firebase');
  //       }
  //     } catch (error) {
  //       console.error('Ошибка загрузки данных:', error);
  //     }
  //   }
  //   fetchData();
  // }, [currentMonth, user?.uid, user]); // Добавили user в зависимости

  // Загрузка данных при первой авторизации пользователя и при смене месяца
  useEffect(() => {
    if (!user?.uid) return;
    
    // Загружаем данные для текущего месяца (обновлено для умной синхронизации)
    const loadInitialData = async () => {
      try {
        console.log('=== ЗАГРУЗКА ДАННЫХ ===');
        console.log('Загрузка данных для месяца:', currentMonth);
        console.log('Пользователь:', user.uid);
        
        const docRef = doc(db, 'users', user.uid, 'monthlyData', currentMonth);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<SyncedMonthData>;
          console.log('✅ Данные найдены для месяца:', currentMonth);
          console.log('Структура данных:', data);
          
          // Проверяем, не являются ли данные устаревшими
          const localLastModified = localStorage.getItem(`lastModified_${currentMonth}`);
          if (localLastModified && data.lastModified) {
            const localTime = parseInt(localLastModified);
            const serverTime = data.lastModified;
            
            if (localTime > serverTime) {
              console.log('⚠️ Локальные данные новее серверных, пропускаем загрузку');
              setSyncStatus('conflict');
              return;
            }
          }
          
          // Обновляем все данные из Firebase
          if (data.banks && data.banks.length > 0) {
            console.log('Обновляем банки:', data.banks);
            setBanks(data.banks);
          }
          if (data.categories && data.categories.length > 0) {
            console.log('Обновляем категории:', data.categories);
            setCategories(data.categories.sort((a, b) => a.localeCompare(b, 'ru')));
          }
          if (data.priorityCategories && data.priorityCategories.length > 0) {
            console.log('Обновляем приоритеты:', data.priorityCategories);
            setPriorityCategories(data.priorityCategories);
          }
          if (data.categorySpending) {
            console.log('Обновляем траты:', data.categorySpending);
            setCategorySpending(data.categorySpending);
          }
          
          if (data.optimizationStrategy) {
            console.log('Обновляем стратегию:', data.optimizationStrategy);
            setOptimizationStrategy(data.optimizationStrategy);
          }
          
          if (data.monthlyData) {
            console.log('Обновляем данные месяца:', data.monthlyData);
            setMonthlyData(prev => ({ ...prev, [currentMonth]: data.monthlyData || {} }));
          }
          
          // Сохраняем timestamp последней загрузки
          localStorage.setItem(`lastModified_${currentMonth}`, data.lastModified?.toString() || '0');
          setLastSyncTime(data.lastModified || null);
        } else {
          console.log('❌ Данные не найдены для месяца:', currentMonth);
          console.log('Создаем пустую структуру для нового месяца');
          setMonthlyData(prev => ({ ...prev, [currentMonth]: {} }));
        }
        
        setDataLoaded(true);
        console.log('=== ЗАГРУЗКА ЗАВЕРШЕНА ===');
      } catch (error) {
        console.error('❌ Ошибка загрузки данных для месяца:', currentMonth, error);
        setDataLoaded(true);
      }
    };
    
    loadInitialData();
  }, [user?.uid, currentMonth]); // Зависимость от currentMonth обеспечивает загрузку при смене месяца

  // Умное сохранение данных в Firestore при изменении состояния
  useEffect(() => {
    if (!user?.uid || !dataLoaded) return;
    
    // Проверяем конфликты перед сохранением
    checkForConflicts().then(conflict => {
      if (conflict.hasConflict) {
        console.log('⚠️ Обнаружен конфликт:', conflict);
        setSyncStatus('conflict');
      }
    });
    
    const timeoutId = setTimeout(() => {
      saveDataWithTimestamp();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [monthlyData, banks, categories, priorityCategories, categorySpending, currentMonth, user?.uid, optimizationStrategy, dataLoaded]);

  // Сохранение данных перед закрытием страницы
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (user?.uid && dataLoaded) {
        console.log('Сохранение данных перед закрытием страницы...');
        // Синхронное сохранение данных
        saveDataWithTimestamp();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user?.uid, dataLoaded]);

  const data: MonthlyData = monthlyData[currentMonth] || {};

  const checkIsPriority = (category: string) => {
    return priorityCategories.some(priority => {
      const lowerCategory = category.toLowerCase();
      const lowerPriority = priority.toLowerCase();
      
      if (lowerCategory === lowerPriority) return true;
      if (lowerCategory.includes(lowerPriority) || lowerPriority.includes(lowerCategory)) {
        return true;
      }
      return false;
    });
  };

  // Функции управления приоритетами
  const togglePriority = (category: string) => {
    if (checkIsPriority(category)) {
      setPriorityCategories(prev => {
        const newPriorityCategories = prev.filter(p => {
          const lowerP = p.toLowerCase();
          const lowerCat = category.toLowerCase();
          return !(lowerP === lowerCat || lowerP.includes(lowerCat) || lowerCat.includes(lowerP));
        });
        
        // Принудительно сохраняем данные сразу после изменения приоритетов
        setTimeout(() => forceSaveData({ priorityCategories: newPriorityCategories }), 100);
        
        return newPriorityCategories;
      });
    } else {
      setPriorityCategories(prev => {
        const newPriorityCategories = [...prev, category];
        
        // Принудительно сохраняем данные сразу после изменения приоритетов
        setTimeout(() => forceSaveData({ priorityCategories: newPriorityCategories }), 100);
        
        return newPriorityCategories;
      });
    }
  };

  // Функции управления категориями
  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories(prev => {
        const newCategories = [...prev, newCategory.trim()].sort((a, b) => a.localeCompare(b, 'ru'));
        
        // Принудительно сохраняем данные сразу после добавления категории
        setTimeout(() => forceSaveData({ categories: newCategories }), 100);
        
        return newCategories;
      });
      setNewCategory('');
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    setCategories(prev => {
      const newCategories = prev.filter(cat => cat !== categoryToRemove);
      
      // Принудительно сохраняем данные сразу после удаления категории
      setTimeout(() => forceSaveData({ categories: newCategories }), 100);
      
      return newCategories;
    });
    
    setCategorySpending(prev => {
      const updated = { ...prev };
      delete updated[categoryToRemove];
      return updated;
    });
  };

  // Функции управления банками
  const updateBank = (index: number, field: string, value: any) => {
    setBanks(prev => {
      const newBanks = prev.map((bank, i) => 
        i === index ? { ...bank, [field]: value } : bank
      );
      
      // Принудительно сохраняем данные сразу после изменения
      setTimeout(() => forceSaveData({ banks: newBanks }), 100);
      
      return newBanks;
    });
  };

  const addBank = () => {
    setBanks(prev => {
      const newBanks = [...prev, { name: 'Новый банк', maxCategories: 3, cashbackLimit: 3000 }];
      
      // Принудительно сохраняем данные сразу после добавления банка
      setTimeout(() => forceSaveData({ banks: newBanks }), 100);
      
      return newBanks;
    });
  };

  const removeBank = (indexToRemove: number) => {
    setBanks(prev => {
      const newBanks = prev.filter((_, i) => i !== indexToRemove);
      
      // Принудительно сохраняем данные сразу после удаления банка
      setTimeout(() => forceSaveData({ banks: newBanks }), 100);
      
      return newBanks;
    });
  };

  const updateData = (category: string, bankName: string, value: string) => {
    console.log(`Обновление данных: ${category} -> ${bankName} = ${value} (месяц: ${currentMonth})`);
    
    setMonthlyData(prev => {
      const newData = {
        ...prev,
        [currentMonth]: {
          ...prev[currentMonth],
          [category]: {
            ...prev[currentMonth]?.[category],
            [bankName]: value
          }
        }
      };
      
      // Немедленно сохраняем данные для предотвращения потери последнего значения
      setTimeout(() => {
        console.log(`Немедленное сохранение данных для месяца ${currentMonth}`);
        saveDataWithTimestamp();
      }, 50);
      
      return newData;
    });
  };

  const calculateCashback = (rate: number, spending: number, limit: number) => {
    const cashback = spending * rate / 100;
    return Math.min(cashback, limit);
  };

  const optimizeSelection = () => {
    const allOffers: {
      bankIndex: number;
      bankName: string;
      category: string;
      rate: number;
      isPriority: boolean;
      spending: number;
      realCashback: number;
      isLimitHit: boolean;
    }[] = [];
    
    Object.entries(data).forEach(([category, bankData]) => {
      Object.entries(bankData).forEach(([bankName, rate]) => {
        if (rate && !isNaN(parseFloat(rate))) {
          const bankIndex = banks.findIndex(b => b.name === bankName);
          const bank = banks[bankIndex];
          const spending = categorySpending[category] || 0;
          const rateNumber = parseFloat(rate);
          const realCashback = calculateCashback(rateNumber, spending, bank.cashbackLimit);
          
          allOffers.push({
            bankIndex,
            bankName,
            category,
            rate: rateNumber,
            isPriority: checkIsPriority(category),
            spending,
            realCashback,
            isLimitHit: realCashback >= bank.cashbackLimit
          });
        }
      });
    });

    // Изменяем логику сортировки в зависимости от стратегии
    allOffers.sort((a, b) => {
      if (a.isPriority !== b.isPriority) {
        return (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0);
      }
      
      if (optimizationStrategy === 'rate') {
        // Сортировка по максимальному проценту
        return b.rate - a.rate;
      } else {
        // Сортировка по максимальному реальному кешбеку
        return b.realCashback - a.realCashback;
      }
    });

    const result: OptimizationResult = {
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
  }, [currentMonth, monthlyData, categorySpending, priorityCategories, optimizationStrategy]);

  const loadSampleData = () => {
    const sampleData: MonthlyData = {
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
        ...Object.fromEntries(
          Object.entries(prev[currentMonth] || {}).map(([cat, val]) => [cat, { ...val }])
        ),
        ...sampleData
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
    const hasValue = data[category]?.[bankName] && !isNaN(parseFloat(data[category][bankName]));
    
    let className = "w-full h-8 text-center border border-gray-300 text-xs rounded focus:ring-1 focus:ring-blue-500 ";
    
    if (isSelected) {
      className += "bg-green-200 border-green-500 font-semibold shadow-sm ";
    } else if (hasValue) {
      className += "bg-blue-50 border-blue-200 ";
    } else {
      className += "bg-white hover:bg-gray-50 ";
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



  // Функция для очистки данных в Firebase
  const clearFirebaseData = async () => {
    const uid = user?.uid;
    if (!uid) {
      console.log('Пользователь не авторизован');
      return;
    }

    try {
      console.log('Очистка данных в Firebase для пользователя:', uid);
      
      // Очищаем данные для текущего месяца
      await setDoc(doc(db, 'users', uid, 'monthlyData', currentMonth), {
        monthlyData: {},
        banks: [
          { name: 'ВТБ', maxCategories: 3, cashbackLimit: 3000 },
          { name: 'Альфа', maxCategories: 3, cashbackLimit: 5000 },
          { name: 'Сбер', maxCategories: 5, cashbackLimit: 5000 },
          { name: 'Тинькофф', maxCategories: 4, cashbackLimit: 3000 }
        ],
        categories: [
          'Автоуслуги', 'АЗС', 'Аксессуары', 'Аптека', 'Все покупки', 'Деливери',
          'Детские товары', 'Дом и ремонт', 'Искусство', 'Кафе и рестораны',
          'Книги и канцтовары', 'Красота', 'Мед услуги', 'Мегамаркет', 'Образование',
          'Одежда и обувь', 'Перекресток', 'Платные дороги', 'Развлечения',
          'Сервис Трэвел', 'Спорттовары', 'Супермаркеты', 'Такси', 'Театры и кино',
          'Транспорт', 'Цветы', 'Цифровой контент', 'Хобби', 'Электроника', 'Яндекс Еда'
        ],
        priorityCategories: ['Супермаркеты', 'Кафе и рестораны', 'Все покупки'],
        categorySpending: {
          'Автоуслуги': 5000, 'АЗС': 8000, 'Все покупки': 30000, 'Детские товары': 10000,
          'Кафе и рестораны': 15000, 'Супермаркеты': 25000, 'Транспорт': 8000, 'Такси': 5000,
          'Образование': 3000, 'Красота': 4000, 'Спорттовары': 3000, 'Театры и кино': 2000
        },
        optimizationStrategy: 'rate',
        lastModified: Date.now(),
        deviceId: getDeviceId()
      });
      
      console.log('Данные успешно очищены и сброшены к начальным значениям');
      
      // Перезагружаем страницу для применения изменений
      window.location.reload();
    } catch (error) {
      console.error('Ошибка при очистке данных:', error);
    }
  };

  // Функция для тестирования сохранения и загрузки данных
  const testDataPersistence = async () => {
    const uid = user?.uid;
    if (!uid) {
      console.log('❌ Пользователь не авторизован');
      return;
    }

    try {
      console.log('=== ТЕСТИРОВАНИЕ СОХРАНЕНИЯ ДАННЫХ ===');
      
      // Сохраняем тестовые данные
      const testData: SyncedMonthData = {
        monthlyData: {
          'Тестовая категория': {
            'ВТБ': '5.0',
            'Альфа': '3.0'
          }
        },
        banks,
        categories,
        priorityCategories,
        categorySpending,
        optimizationStrategy,
        lastModified: Date.now(),
        deviceId: getDeviceId()
      };
      
      console.log('Сохраняем тестовые данные для месяца:', currentMonth);
      await setDoc(doc(db, 'users', uid, 'monthlyData', currentMonth), testData);
      console.log('✅ Тестовые данные сохранены');
      
      // Загружаем данные обратно
      console.log('Загружаем данные обратно...');
      const docRef = doc(db, 'users', uid, 'monthlyData', currentMonth);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const loadedData = docSnap.data() as SyncedMonthData;
        console.log('✅ Данные успешно загружены:', loadedData);
        alert('Тест успешен! Данные сохраняются и загружаются корректно.');
      } else {
        console.log('❌ Данные не найдены после сохранения');
        alert('Ошибка! Данные не найдены после сохранения.');
      }
    } catch (error) {
      console.error('❌ Ошибка тестирования:', error);
      alert('Ошибка при тестировании: ' + error);
    }
  };

  // Функция для полной очистки всех данных пользователя
  const clearAllUserData = async () => {
    const uid = user?.uid;
    if (!uid) {
      console.log('Пользователь не авторизован');
      return;
    }

    if (!confirm('Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить!')) {
      return;
    }

    try {
      console.log('Полная очистка всех данных пользователя:', uid);
      
      // Импортируем необходимые функции
      const { collection, getDocs, deleteDoc } = await import('firebase/firestore');
      
      // Получаем все документы пользователя
      const userDataRef = collection(db, 'users', uid, 'monthlyData');
      const querySnapshot = await getDocs(userDataRef);
      
      // Удаляем все документы
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log('Все данные пользователя успешно удалены');
      
      // Перезагружаем страницу
      window.location.reload();
    } catch (error) {
      console.error('Ошибка при полной очистке данных:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Адаптивный заголовок */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Мобильная версия заголовка */}
          <div className="flex flex-col space-y-3 sm:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="text-blue-600" size={20} />
                <h1 className="text-lg font-bold text-gray-800">Оптимизатор кешбека</h1>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-800"
              >
                <Menu size={20} />
              </button>
            </div>
            
            {/* Мобильное меню */}
            {mobileMenuOpen && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="text-gray-600" size={16} />
                  <select 
                    value={selectedYear}
                    onChange={(e) => {
                      console.log('Изменение года (мобильная версия):', e.target.value);
                      setIsManualMonthSelection(false); // Сбрасываем флаг при смене года
                      setSelectedYear(parseInt(e.target.value));
                    }}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <select 
                    value={currentMonth}
                    onChange={(e) => {
                      console.log('Ручной выбор месяца (мобильная версия):', e.target.value);
                      setIsManualMonthSelection(true);
                      setCurrentMonth(e.target.value);
                    }}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
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
                    className="flex-1 px-3 py-2 bg-gray-600 text-white rounded text-sm flex items-center justify-center gap-1"
                  >
                    <Settings size={14} />
                    Настройки
                  </button>
                  <button
                    onClick={loadSampleData}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded text-sm flex items-center justify-center gap-1"
                  >
                    <Download size={14} />
                    Пример
                  </button>
                  {isManualMonthSelection && (
                    <button
                      onClick={() => {
                        console.log('Сброс ручного выбора месяца (мобильная версия)');
                        setIsManualMonthSelection(false);
                      }}
                      className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded text-sm flex items-center justify-center gap-1"
                      title="Вернуться к автоматическому выбору текущего месяца"
                    >
                      🔄 Авто
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Десктопная версия заголовка */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="text-blue-600" size={24} />
              <h1 className="text-xl font-bold text-gray-800">Оптимизатор кешбека</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Calendar className="text-gray-600" size={16} />
                <select 
                  value={selectedYear}
                  onChange={(e) => {
                    console.log('Изменение года:', e.target.value);
                    setIsManualMonthSelection(false); // Сбрасываем флаг при смене года
                    setSelectedYear(parseInt(e.target.value));
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <select 
                value={currentMonth}
                onChange={(e) => {
                  console.log('Ручной выбор месяца (десктопная версия):', e.target.value);
                  setIsManualMonthSelection(true);
                  setCurrentMonth(e.target.value);
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                {months.map(month => (
                  <option key={month} value={month}>
                    {getMonthName(month)}
                  </option>
                ))}
              </select>

              <div className="flex gap-1">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors flex items-center gap-1"
                >
                  <Settings size={14} />
                  Настройки
                </button>
                <button
                  onClick={loadSampleData}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors flex items-center gap-1"
                >
                  <Download size={14} />
                  Пример
                </button>
                {isManualMonthSelection && (
                  <button
                    onClick={() => {
                      console.log('Сброс ручного выбора месяца');
                      setIsManualMonthSelection(false);
                    }}
                    className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition-colors flex items-center gap-1"
                    title="Вернуться к автоматическому выбору текущего месяца"
                  >
                    🔄 Авто
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Панель настроек */}
        {showSettings && (
          <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Настройки банков */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">⚙️ Банки и лимиты</h3>
                <div className="space-y-3">
                  {banks.map((bank, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-gray-50 rounded border">
                      <input
                        type="text"
                        value={bank.name}
                        onChange={(e) => updateBank(index, 'name', e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded text-sm"
                        placeholder="Название банка"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={bank.maxCategories}
                          onChange={(e) => updateBank(index, 'maxCategories', parseInt(e.target.value) || 1)}
                          className="w-16 p-2 border border-gray-300 rounded text-sm text-center"
                          min="1" max="10"
                        />
                        <span className="text-sm text-gray-500">кат.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={bank.cashbackLimit}
                          onChange={(e) => updateBank(index, 'cashbackLimit', parseInt(e.target.value) || 1000)}
                          className="w-20 p-2 border border-gray-300 rounded text-sm text-center"
                          min="1000" step="500"
                        />
                        <span className="text-sm text-gray-500">₽</span>
                      </div>
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
                    className="flex-1 p-2 border border-gray-300 rounded text-sm"
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

            {/* Новая секция: Стратегия оптимизации */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4">🎯 Стратегия оптимизации</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="optimizationStrategy"
                      value="rate"
                      checked={optimizationStrategy === 'rate'}
                      onChange={(e) => {
                        const value = e.target.value as 'rate' | 'cashback';
                        setOptimizationStrategy(value);
                        // Принудительно сохраняем настройку
                        setTimeout(() => forceSaveData({ optimizationStrategy: value }), 100);
                      }}
                      className="text-blue-600"
                    />
                    <span className="text-sm font-medium">Максимальный процент</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="optimizationStrategy"
                      value="cashback"
                      checked={optimizationStrategy === 'cashback'}
                      onChange={(e) => {
                        const value = e.target.value as 'rate' | 'cashback';
                        setOptimizationStrategy(value);
                        // Принудительно сохраняем настройку
                        setTimeout(() => forceSaveData({ optimizationStrategy: value }), 100);
                      }}
                      className="text-blue-600"
                    />
                    <span className="text-sm font-medium">Максимальный кешбек</span>
                  </label>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {optimizationStrategy === 'rate' 
                    ? "Выбирает предложения с максимальным процентом кешбека"
                    : "Выбирает предложения с максимальным реальным кешбеком (учитывает лимиты)"
                  }
                </div>
              </div>
            </div>

            {/* Настройка трат */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4">💰 Месячные траты</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(categorySpending).map(([category, amount]) => (
                  <div key={category}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {category}
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        setCategorySpending(prev => {
                          const newCategorySpending = {
                            ...prev,
                            [category]: newValue
                          };
                          
                          // Принудительно сохраняем данные сразу после изменения трат
                          setTimeout(() => forceSaveData({ categorySpending: newCategorySpending }), 100);
                          
                          return newCategorySpending;
                        });
                      }}
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Управление данными */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4">🗄️ Управление данными</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={testDataPersistence}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  🧪 Тест сохранения
                </button>
                <button
                  onClick={clearFirebaseData}
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  🔄 Сбросить текущий месяц
                </button>
                <button
                  onClick={clearAllUserData}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  🗑️ Удалить все данные
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                🧪 "Тест сохранения" - проверяет, что данные сохраняются и загружаются корректно.<br/>
                ⚠️ "Сбросить текущий месяц" - очищает данные только для текущего месяца.<br/>
                ⚠️ "Удалить все данные" - удаляет ВСЕ данные пользователя безвозвратно!
              </p>
            </div>
          </div>
        )}

        {/* Мобильные табы */}
        <div className="sm:hidden mb-4">
          <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={() => setActiveTab('table')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === 'table' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Таблица
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === 'stats' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Статистика
            </button>
          </div>
        </div>

        {/* Основной контент */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Таблица - скрыта на мобильных если не активна */}
          <div className={`${activeTab === 'table' ? 'block' : 'hidden'} sm:block lg:col-span-8`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Копирование из предыдущего месяца */}
              {months.indexOf(currentMonth) > 0 && (
                <div className="p-4 border-b border-gray-200 bg-blue-50">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={copyFromPreviousMonth}
                      className="text-sm px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      📋 Скопировать из {getMonthName(months[months.indexOf(currentMonth) - 1])}
                    </button>
                    <button
                      onClick={clearCurrentMonth}
                      className="text-sm px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      Очистить
                    </button>
                    <button
                      onClick={forceSync}
                      className="text-sm px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors flex items-center gap-1"
                    >
                      🔄 Синхронизировать
                    </button>
                    <button
                      onClick={saveDataWithTimestamp}
                      className="text-sm px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-1"
                    >
                      💾 Сохранить сейчас
                    </button>
                  </div>
                </div>
              )}

              {/* Адаптивная таблица */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left p-2 font-semibold text-gray-800 sticky left-0 bg-gray-50 z-10 min-w-[140px] text-sm">
                        Категория
                      </th>
                      {banks.map(bank => (
                        <th key={bank.name} className="text-center p-2 font-semibold text-gray-800 min-w-[80px] text-sm">
                          <div>{bank.name}</div>
                          <div className="text-xs font-normal text-gray-500">
                            {bank.maxCategories} кат.
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, index) => (
                      <tr key={category} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2 sticky left-0 bg-white z-10 border-r border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className={`${checkIsPriority(category) ? 'text-blue-600 font-semibold' : 'text-gray-800'} text-sm`}>
                              {category}
                            </span>
                            <button
                              onClick={() => togglePriority(category)}
                              className={`p-1 rounded transition-colors ${
                                checkIsPriority(category) 
                                  ? 'text-yellow-500 hover:text-yellow-600' 
                                  : 'text-gray-300 hover:text-yellow-400'
                              }`}
                            >
                              <Star size={14} fill={checkIsPriority(category) ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                        </td>
                        {banks.map(bank => (
                          <td key={bank.name} className="p-2 text-center">
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

          {/* Боковая панель - скрыта на мобильных если не активна */}
          <div className={`${activeTab === 'stats' ? 'block' : 'hidden'} sm:block lg:col-span-4`}>
            <div className="space-y-4">
              {/* Статистика */}
              {optimization && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">📊 Результаты</h3>
                  
                  {/* Индикатор стратегии */}
                  <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="text-xs text-blue-700 font-medium">
                      Стратегия: {optimizationStrategy === 'rate' ? 'Максимальный процент' : 'Максимальный кешбек'}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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

        {/* Подсказки и статус */}
        <div className="mt-4 space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-sm text-yellow-800">
              <strong>💡 Быстрые действия:</strong> ⭐ = приоритет • 🟢 = рекомендации • 🔵 = данные
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800">
              <strong>📊 Статус:</strong> Текущий месяц: <span className="font-mono">{currentMonth}</span> • 
              Данные загружены: <span className={dataLoaded ? 'text-green-600' : 'text-red-600'}>{dataLoaded ? '✅' : '❌'}</span> • 
              Пользователь: <span className="font-mono">{user?.uid ? '✅' : '❌'}</span> • 
              Ручной выбор: <span className={isManualMonthSelection ? 'text-yellow-600' : 'text-gray-600'}>{isManualMonthSelection ? '✅' : '❌'}</span> • 
              Синхронизация: <span className={
                syncStatus === 'syncing' ? 'text-yellow-600' : 
                syncStatus === 'success' ? 'text-green-600' : 
                syncStatus === 'conflict' ? 'text-red-600' : 
                syncStatus === 'error' ? 'text-red-600' : 
                'text-gray-600'
              }>{
                syncStatus === 'syncing' ? '⏳' : 
                syncStatus === 'success' ? '✅' : 
                syncStatus === 'conflict' ? '⚠️' : 
                syncStatus === 'error' ? '❌' : 
                '✅'
              }</span>
              {lastSyncTime && (
                <span className="text-xs text-gray-600 ml-2">
                  Последняя синхр.: {new Date(lastSyncTime).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashbackOptimizerResponsive; 
