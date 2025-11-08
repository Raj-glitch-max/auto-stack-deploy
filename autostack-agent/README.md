# AutoStack Monitoring Agent

Lightweight Python daemon that collects system metrics and sends them to AutoStack backend.

## Features

- 📊 Collects CPU, memory, disk, and network metrics
- 🔄 Auto-registration with backend
- 💓 Periodic heartbeat with metrics
- 🔐 Secure API key authentication
- 🔁 Auto-reconnect on failures
- 📝 Comprehensive logging

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Make executable
chmod +x agent.py
```

## Configuration

Set environment variables:

```bash
export AUTOSTACK_API_KEY="your-api-key-here"
export AUTOSTACK_BACKEND_URL="http://localhost:8000"
export AUTOSTACK_INTERVAL="30"  # seconds between metrics
```

## Usage

### Run directly
```bash
python3 agent.py
```

### Run as systemd service (Ubuntu/Linux)

1. Create service file:
```bash
sudo nano /etc/systemd/system/autostack-agent.service
```

2. Add configuration:
```ini
[Unit]
Description=AutoStack Monitoring Agent
After=network.target

[Service]
Type=simple
User=autostack
Environment="AUTOSTACK_API_KEY=your-key-here"
Environment="AUTOSTACK_BACKEND_URL=http://your-backend:8000"
Environment="AUTOSTACK_INTERVAL=30"
ExecStart=/usr/bin/python3 /opt/autostack/agent.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

3. Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable autostack-agent
sudo systemctl start autostack-agent
sudo systemctl status autostack-agent
```

### View logs
```bash
sudo journalctl -u autostack-agent -f
```

## Metrics Collected

- **CPU**: Usage percentage, core count
- **Memory**: Usage percentage, total, used
- **Disk**: Usage percentage, total, used
- **Network**: Bytes sent/received
- **System**: Uptime, process count
- **Timestamp**: UTC timestamp

## API Endpoints Used

- `POST /agents/register` - Register agent
- `POST /agents/heartbeat` - Send metrics

## Security

- Uses API key authentication
- Sends data over HTTPS (in production)
- No sensitive data collected
- Configurable collection interval

## Troubleshooting

**Agent won't register:**
- Check API key is correct
- Verify backend URL is accessible
- Check backend logs

**Metrics not appearing:**
- Verify heartbeat endpoint is working
- Check agent logs for errors
- Ensure interval is reasonable (>10s)

**High CPU usage:**
- Increase interval (default: 30s)
- Check for network issues causing retries
