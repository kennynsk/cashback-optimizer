import React from 'react';
import { Button } from '@/components/ui/button';

const TestComponent = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Тест компонентов</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">1. Базовый HTML</h2>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Обычная кнопка
          </button>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">2. Попытка импорта Button</h2>
          <p className="text-gray-600">Проверяем импорт...</p>
          <div id="button-test">
            <Button>Тестовая кнопка shadcn/ui</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestComponent; 