#!/usr/bin/env sh
# Обновляет проект (git pull + npm install при необходимости) и запускает приложение.
set -e
cd "$(dirname "$0")"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    before=$(git rev-parse HEAD)
    echo "Обновляю проект..."
    if git pull --ff-only; then
        after=$(git rev-parse HEAD)
        if [ "$before" != "$after" ] && git diff --name-only "$before" "$after" | grep -qE '^package(-lock)?\.json$'; then
            need_install=1
        fi
    else
        echo "Не удалось обновить (нет сети или есть локальные изменения). Запускаю текущую версию."
    fi
fi

if [ ! -d node_modules ] || [ -n "$need_install" ]; then
    echo "Устанавливаю зависимости..."
    npm install
fi

echo "Запускаю Cheating Daddy..."
npm start
