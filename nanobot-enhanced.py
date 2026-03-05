#!/usr/bin/env python3
"""
Enhanced Nanobot with process monitoring
"""

import os
import json
import time
import logging
import subprocess
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class EnhancedNanobot:
    def __init__(self):
        self.workspace = "/home/admin/.openclaw"
        self.log_file = "/tmp/nanobot-enhanced.log"
        self.openclaw_pid_file = "/tmp/openclaw.pid"
        self.setup_logging()
        
    def setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(self.log_file),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
    def is_openclaw_running(self):
        """检查 OpenClaw 进程是否运行"""
        try:
            result = subprocess.run(['pgrep', '-f', 'openclaw-gateway'], 
                                  capture_output=True, text=True)
            return len(result.stdout.strip()) > 0
        except Exception as e:
            self.logger.error(f"进程检查失败: {e}")
            return False
            
    def restart_openclaw(self):
        """重启 OpenClaw"""
        self.logger.info("检测到 OpenClaw 停止，正在重启...")
        try:
            # 停止现有进程
            subprocess.run(['pkill', '-f', 'openclaw-gateway'])
            time.sleep(2)
            # 启动新进程
            subprocess.Popen(['nohup', 'openclaw', 'gateway', '--port', '16195', 
                           '>', '/tmp/openclaw.log', '2>&1', '&'], 
                          shell=True)
            self.logger.info("OpenClaw 重启成功")
            return True
        except Exception as e:
            self.logger.error(f"OpenClaw 重启失败: {e}")
            return False
            
    def monitor_process(self):
        """监控 OpenClaw 进程"""
        self.logger.info("开始进程监控...")
        while True:
            if not self.is_openclaw_running():
                self.logger.warning("OpenClaw 进程未运行")
                self.restart_openclaw()
            time.sleep(30)  # 每30秒检查一次
            
    def start(self):
        """启动增强版 Nanobot"""
        self.logger.info("增强版 Nanobot 启动")
        # 启动进程监控线程
        import threading
        process_thread = threading.Thread(target=self.monitor_process)
        process_thread.daemon = True
        process_thread.start()
        
        # 继续原有的日志监控
        self.monitor_openclaw_logs()

if __name__ == "__main__":
    nanobot = EnhancedNanobot()
    nanobot.start()