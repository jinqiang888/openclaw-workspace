#!/usr/bin/env python3
"""
Nanobot - OpenClaw 智能维修系统
按照标准架构实现三级错误诊断和修复
"""

import os
import json
import time
import logging
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class Nanobot:
    def __init__(self):
        self.workspace = "/home/admin/.openclaw"
        self.log_file = "/tmp/nanobot.log"
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
        
    def diagnose_error(self, error_content):
        """三级错误诊断"""
        if "syntax" in error_content.lower() or "invalid json" in error_content.lower():
            return "L1"  # 语法错误
        elif "conflict" in error_content.lower() or "logic" in error_content.lower():
            return "L2"  # 逻辑冲突  
        else:
            return "L3"  # 资源死锁或其他
        
    def fix_l1_error(self, config_file):
        """L1: 自动修正语法错误"""
        self.logger.info("L1修复: 自动修正语法错误")
        # 实现 DCMP 差分配置比对
        # 这里简化为基本的 JSON 修复
        try:
            with open(config_file, 'r') as f:
                content = f.read()
            # 修复常见的 JSON 问题
            fixed_content = content.strip()
            if not fixed_content.endswith('}'):
                fixed_content += '\n}'
            with open(config_file, 'w') as f:
                f.write(fixed_content)
            self.logger.info("L1修复完成")
            return True
        except Exception as e:
            self.logger.error(f"L1修复失败: {e}")
            return False
            
    def fix_l2_error(self, config_file):
        """L2: 生成修复方案，需要用户确认"""
        self.logger.info("L2修复: 生成修复方案")
        # 生成修复建议
        fix_proposal = {
            "action": "review_config",
            "file": config_file,
            "suggested_fixes": [
                "检查模型配置格式",
                "验证 API 字段完整性", 
                "确认输入参数有效性"
            ]
        }
        # 保存修复方案
        with open("/tmp/nanobot_fix_proposal.json", "w") as f:
            json.dump(fix_proposal, f, indent=2)
        self.logger.info("L2修复方案已生成: /tmp/nanobot_fix_proposal.json")
        return fix_proposal
        
    def fix_l3_error(self):
        """L3: 启动备用实例"""
        self.logger.info("L3修复: 启动备用实例")
        # 启动备用 OpenClaw 实例
        os.system("nohup openclaw gateway --port 16197 > /tmp/openclaw-backup.log 2>&1 &")
        self.logger.info("备用实例已启动在端口 16197")
        return True
        
    def monitor_openclaw_logs(self):
        """监听 OpenClaw 异常"""
        self.logger.info("开始监听 OpenClaw 日志...")
        log_path = "/tmp/openclaw/"
        
        class LogHandler(FileSystemEventHandler):
            def __init__(self, nanobot):
                self.nanobot = nanobot
                
            def on_modified(self, event):
                if event.is_directory:
                    return
                if "openclaw-" in event.src_path:
                    try:
                        with open(event.src_path, 'r') as f:
                            lines = f.readlines()
                            if lines:
                                last_line = lines[-1]
                                if "error" in last_line.lower() or "exception" in last_line.lower():
                                    self.nanobot.handle_error(last_line)
                    except Exception as e:
                        self.nanobot.logger.error(f"日志监控错误: {e}")
                        
        observer = Observer()
        observer.schedule(LogHandler(self), log_path, recursive=False)
        observer.start()
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            observer.stop()
        observer.join()
        
    def handle_error(self, error_content):
        """处理错误的主逻辑"""
        self.logger.info(f"检测到错误: {error_content[:100]}...")
        error_level = self.diagnose_error(error_content)
        
        if error_level == "L1":
            self.fix_l1_error(os.path.join(self.workspace, "openclaw.json"))
        elif error_level == "L2":
            self.fix_l2_error(os.path.join(self.workspace, "openclaw.json"))
        elif error_level == "L3":
            self.fix_l3_error()
            
    def start(self):
        """启动 Nanobot"""
        self.logger.info("Nanobot 智能维修系统启动")
        self.monitor_openclaw_logs()

if __name__ == "__main__":
    nanobot = Nanobot()
    nanobot.start()