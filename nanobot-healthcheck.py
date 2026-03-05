#!/usr/bin/env python3
"""
Nanobot Health Check - 系统健康状态检查
"""

import os
import json
import subprocess
import sys
from datetime import datetime

def check_service_status(service_name):
    """检查 systemd 服务状态"""
    try:
        result = subprocess.run(['systemctl', 'is-active', service_name], 
                              capture_output=True, text=True, timeout=10)
        return result.stdout.strip()
    except Exception as e:
        return f"error: {e}"

def check_process_running(process_name):
    """检查进程是否运行"""
    try:
        result = subprocess.run(['pgrep', '-f', process_name], 
                              capture_output=True, text=True, timeout=5)
        return len(result.stdout.strip()) > 0
    except Exception as e:
        return False

def check_log_errors(log_file, hours=1):
    """检查日志文件中的错误"""
    if not os.path.exists(log_file):
        return {"exists": False, "errors": []}
    
    try:
        # 使用 journalctl 或直接读取文件
        if "journal" in log_file:
            cmd = f'journalctl -u openclaw-gateway --since "{hours} hours ago" | grep -i error'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
            errors = result.stdout.strip().split('\n') if result.stdout.strip() else []
        else:
            with open(log_file, 'r') as f:
                lines = f.readlines()[-1000:]  # 最后1000行
            errors = [line for line in lines if 'error' in line.lower() or 'exception' in line.lower()]
        
        return {"exists": True, "errors": errors[-10:]}  # 最多返回10个错误
    except Exception as e:
        return {"exists": True, "errors": [f"Log check failed: {e}"]}

def check_disk_space():
    """检查磁盘空间"""
    try:
        result = subprocess.run(['df', '-h', '/'], capture_output=True, text=True, timeout=5)
        lines = result.stdout.strip().split('\n')
        if len(lines) > 1:
            parts = lines[1].split()
            if len(parts) >= 5:
                usage = parts[4].rstrip('%')
                return int(usage) if usage.isdigit() else 0
        return 0
    except Exception as e:
        return f"error: {e}"

def check_memory_usage():
    """检查内存使用率"""
    try:
        result = subprocess.run(['free'], capture_output=True, text=True, timeout=5)
        lines = result.stdout.strip().split('\n')
        if len(lines) > 1:
            mem_line = lines[1]
            parts = mem_line.split()
            if len(parts) >= 3:
                total = int(parts[1])
                used = int(parts[2])
                return round((used / total) * 100, 1) if total > 0 else 0
        return 0
    except Exception as e:
        return f"error: {e}"

def main():
    print(f"Nanobot Health Check - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # 检查 Nanobot 服务
    nanobot_status = check_service_status('nanobot.service')
    print(f"Nanobot Service: {nanobot_status}")
    
    # 检查 OpenClaw Gateway 服务
    openclaw_status = check_service_status('openclaw-gateway.service')
    print(f"OpenClaw Gateway: {openclaw_status}")
    
    # 检查进程
    nanobot_running = check_process_running('nanobot-core.py')
    print(f"Nanobot Process: {'Running' if nanobot_running else 'Not Running'}")
    
    openclaw_running = check_process_running('openclaw gateway')
    print(f"OpenClaw Process: {'Running' if openclaw_running else 'Not Running'}")
    
    # 检查日志错误
    log_check = check_log_errors('/tmp/nanobot.log')
    print(f"Nanobot Log Errors: {len(log_check['errors'])} recent errors")
    if log_check['errors']:
        for error in log_check['errors'][:3]:  # 显示前3个错误
            print(f"  - {error[:100]}...")
    
    # 检查系统资源
    disk_usage = check_disk_space()
    print(f"Disk Usage (/): {disk_usage}%" if isinstance(disk_usage, int) else f"Disk Usage: {disk_usage}")
    
    memory_usage = check_memory_usage()
    print(f"Memory Usage: {memory_usage}%" if isinstance(memory_usage, (int, float)) else f"Memory Usage: {memory_usage}")
    
    # 总体健康状态
    issues = []
    if nanobot_status != 'active':
        issues.append("Nanobot service not active")
    if openclaw_status != 'active':
        issues.append("OpenClaw gateway not active")
    if not nanobot_running:
        issues.append("Nanobot process not running")
    if not openclaw_running:
        issues.append("OpenClaw process not running")
    if isinstance(disk_usage, int) and disk_usage > 85:
        issues.append(f"High disk usage: {disk_usage}%")
    if isinstance(memory_usage, (int, float)) and memory_usage > 85:
        issues.append(f"High memory usage: {memory_usage}%")
    if len(log_check['errors']) > 5:
        issues.append(f"Many recent errors: {len(log_check['errors'])}")
    
    print("\n" + "=" * 60)
    if issues:
        print("HEALTH ISSUES DETECTED:")
        for issue in issues:
            print(f"  ⚠️  {issue}")
        print(f"\nOverall Status: UNHEALTHY ({len(issues)} issues)")
    else:
        print("✅ All systems operational")
        print("Overall Status: HEALTHY")

if __name__ == "__main__":
    main()