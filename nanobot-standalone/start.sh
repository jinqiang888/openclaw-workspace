#!/bin/bash

# 启动独立的 Nanobot OpenClaw 实例
export OPENCLAW_CONFIG_PATH="/home/admin/.openclaw/workspace/nanobot-standalone/openclaw.json"
export OPENCLAW_STATE_DIR="/home/admin/.openclaw/workspace/nanobot-standalone"

# 启动 Gateway
openclaw gateway --port 16196