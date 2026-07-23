#!/bin/bash
set -e

echo "=== Упрощатель лекций — Деплой ==="

# Проверяем .env
if [ ! -f .env ]; then
    echo "Создаю .env из .env.example..."
    cp .env.example .env
    echo "Отредактируйте .env перед запуском!"
    exit 1
fi

# Собираем frontend
echo "Сборка frontend..."
cd frontend
npm install
npm run build
cd ..

# Копируем собранный frontend в static
echo "Копирование frontend..."
rm -rf backend/static
cp -r frontend/dist backend/static

# Запускаем Docker
echo "Запуск Docker контейнера..."
docker compose down 2>/dev/null || true
docker compose up -d --build

echo "=== Готово! ==="
echo "Приложение доступно на порту 12150"
echo "Caddy конфиг: lek.mak-o.ru → localhost:12150"
