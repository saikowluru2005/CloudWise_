#!/bin/bash
echo "=========================================="
echo " Starting CloudWise Deployment Script..."
echo "=========================================="

sudo apt-get update -y
sudo apt-get install -y python3 python3-pip python3-venv nginx git curl software-properties-common

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

read -p "Enter your GitHub Repository URL (e.g., https://github.com/username/CloudWise_.git): " REPO_URL
sudo rm -rf /opt/cloudwise
sudo git clone "$REPO_URL" /opt/cloudwise
sudo chown -R ubuntu:ubuntu /opt/cloudwise

echo "Setting up Backend..."
cd /opt/cloudwise/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

echo "Creating systemd service for FastAPI..."
sudo cat <<EOF > /etc/systemd/system/cloudwise-backend.service
[Unit]
Description=Cloudwise FastAPI Backend
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/opt/cloudwise/backend
Environment="PATH=/opt/cloudwise/backend/venv/bin"
ExecStart=/opt/cloudwise/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable cloudwise-backend
sudo systemctl start cloudwise-backend

echo "Building Frontend..."
cd /opt/cloudwise/frontend

echo "VITE_API_URL=/api" > .env
echo "VITE_WS_URL=PROD" >> .env
npm install
npm run build

echo "Configuring Nginx..."
sudo cat <<EOF > /etc/nginx/sites-available/cloudwise
server {
    listen 80;
    server_name _;

    # Serve React static files
    root /opt/cloudwise/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy API requests to FastAPI
    location /api/ {
        proxy_pass http://127.0.0.1:8000/; # Notice the trailing slash strips the /api part
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSockets Support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/cloudwise /etc/nginx/sites-enabled/
sudo systemctl restart nginx

echo "=========================================="
echo " Deployment Complete!"
echo " Your app is live at: http://$PUBLIC_IP"
echo " (Make sure you set your GEMINI_API_KEY in /opt/cloudwise/backend/.env !)"
echo "=========================================="
