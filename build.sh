#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "=== [1/3] Installing Python Backend Dependencies ==="
python -m pip install --upgrade pip
pip install -r backend/requirements.txt

echo "=== [2/3] Building Angular Frontend Application ==="
if [ -d "frontend" ]; then
  cd frontend
  npm install
  npm run build
  cd ..
fi

echo "=== [3/3] Build Completed Successfully ==="
