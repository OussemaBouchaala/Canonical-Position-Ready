#!/usr/bin/env bash
# Canonical Academy launcher for Ubuntu/Linux: ./start.sh
cd "$(dirname "$0")" || exit 1
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is not installed. Install it with: sudo apt install python3"
  exit 1
fi
exec python3 server.py
