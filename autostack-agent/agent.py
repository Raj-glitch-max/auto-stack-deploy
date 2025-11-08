#!/usr/bin/env python3
"""
AutoStack Monitoring Agent
Collects system metrics and sends to AutoStack backend
"""

import os
import sys
import time
import socket
import platform
import psutil
import requests
from datetime import datetime
from typing import Dict, Optional
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('autostack-agent')


class AutoStackAgent:
    """Monitoring agent that collects and sends system metrics"""
    
    def __init__(self, api_key: str, backend_url: str, interval: int = 30):
        """
        Initialize the agent
        
        Args:
            api_key: API key for authentication
            backend_url: URL of AutoStack backend
            interval: Seconds between metric collections (default: 30)
        """
        self.api_key = api_key
        self.backend_url = backend_url.rstrip('/')
        self.interval = interval
        self.agent_id: Optional[str] = None
        self.hostname = socket.gethostname()
        
        logger.info(f"Initializing AutoStack Agent on {self.hostname}")
    
    def get_local_ip(self) -> str:
        """Get local IP address"""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"
    
    def register(self) -> bool:
        """Register agent with backend"""
        try:
            data = {
                "hostname": self.hostname,
                "ip_address": self.get_local_ip(),
                "os": platform.system(),
                "os_version": platform.release(),
                "python_version": platform.python_version(),
            }
            
            response = requests.post(
                f"{self.backend_url}/agents/register",
                json=data,
                headers={"X-API-Key": self.api_key},
                timeout=10
            )
            
            if response.status_code == 201:
                result = response.json()
                self.agent_id = result.get("id")
                logger.info(f"Agent registered successfully with ID: {self.agent_id}")
                return True
            else:
                logger.error(f"Registration failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Registration error: {e}")
            return False
    
    def collect_metrics(self) -> Dict:
        """Collect system metrics"""
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Memory metrics
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_total = memory.total
            memory_used = memory.used
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            disk_total = disk.total
            disk_used = disk.used
            
            # Network metrics
            net_io = psutil.net_io_counters()
            network_sent = net_io.bytes_sent
            network_recv = net_io.bytes_recv
            
            # System uptime
            boot_time = psutil.boot_time()
            uptime_seconds = time.time() - boot_time
            
            # Process count
            process_count = len(psutil.pids())
            
            metrics = {
                "timestamp": datetime.utcnow().isoformat(),
                "cpu_percent": cpu_percent,
                "cpu_count": cpu_count,
                "memory_percent": memory_percent,
                "memory_total_bytes": memory_total,
                "memory_used_bytes": memory_used,
                "disk_percent": disk_percent,
                "disk_total_bytes": disk_total,
                "disk_used_bytes": disk_used,
                "network_sent_bytes": network_sent,
                "network_recv_bytes": network_recv,
                "uptime_seconds": uptime_seconds,
                "process_count": process_count,
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error collecting metrics: {e}")
            return {}
    
    def send_heartbeat(self) -> bool:
        """Send heartbeat with metrics to backend"""
        if not self.agent_id:
            logger.warning("Agent not registered, attempting registration...")
            if not self.register():
                return False
        
        try:
            metrics = self.collect_metrics()
            
            if not metrics:
                logger.warning("No metrics collected, skipping heartbeat")
                return False
            
            data = {
                "agent_id": self.agent_id,
                "status": "active",
                "metrics": metrics
            }
            
            response = requests.post(
                f"{self.backend_url}/agents/heartbeat",
                json=data,
                headers={"X-API-Key": self.api_key},
                timeout=10
            )
            
            if response.status_code == 200:
                logger.debug(f"Heartbeat sent successfully")
                return True
            else:
                logger.warning(f"Heartbeat failed: {response.status_code}")
                return False
                
        except requests.exceptions.ConnectionError:
            logger.error("Cannot connect to backend")
            return False
        except Exception as e:
            logger.error(f"Heartbeat error: {e}")
            return False
    
    def run(self):
        """Main agent loop"""
        logger.info("Starting AutoStack Agent...")
        
        # Initial registration
        if not self.register():
            logger.error("Failed to register agent. Retrying in 60 seconds...")
            time.sleep(60)
        
        # Main monitoring loop
        consecutive_failures = 0
        max_failures = 5
        
        while True:
            try:
                success = self.send_heartbeat()
                
                if success:
                    consecutive_failures = 0
                else:
                    consecutive_failures += 1
                
                if consecutive_failures >= max_failures:
                    logger.error(f"Failed {max_failures} times, attempting re-registration...")
                    self.agent_id = None
                    consecutive_failures = 0
                
                time.sleep(self.interval)
                
            except KeyboardInterrupt:
                logger.info("Agent stopped by user")
                break
            except Exception as e:
                logger.error(f"Unexpected error in main loop: {e}")
                time.sleep(60)


def main():
    """Entry point"""
    # Get configuration from environment
    api_key = os.getenv("AUTOSTACK_API_KEY")
    backend_url = os.getenv("AUTOSTACK_BACKEND_URL", "http://localhost:8000")
    interval = int(os.getenv("AUTOSTACK_INTERVAL", "30"))
    
    if not api_key:
        logger.error("AUTOSTACK_API_KEY environment variable is required")
        sys.exit(1)
    
    # Create and run agent
    agent = AutoStackAgent(
        api_key=api_key,
        backend_url=backend_url,
        interval=interval
    )
    
    agent.run()


if __name__ == "__main__":
    main()
