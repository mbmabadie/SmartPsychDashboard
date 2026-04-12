#!/bin/bash
# ═══════════════════════════════════════
# Smart Psych Dashboard - Setup Script
# Run from the dashboard/ folder:
#   chmod +x deploy/setup.sh
#   sudo deploy/setup.sh admin.yourdomain.com api-server-ip
# ═══════════════════════════════════════

set -e

GREEN='\033[0;32m'
NC='\033[0m'
log() { echo -e "${GREEN}[✓]${NC} $1"; }

DOMAIN="${1:-$(curl -s ifconfig.me)}"
API_HOST="${2:-127.0.0.1}"
DEPLOY_DIR="/var/www/smartpsych-dashboard"

echo ""
echo "═══════════════════════════════════"
echo "  Smart Psych Dashboard Setup"
echo "  Domain:    ${DOMAIN}"
echo "  API Host:  ${API_HOST}"
echo "═══════════════════════════════════"
echo ""

# 1. Node.js
if ! command -v node &>/dev/null; then
    log "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
log "Node $(node -v)"

# 2. Nginx
if ! command -v nginx &>/dev/null; then
    log "Installing Nginx..."
    apt install -y nginx
    systemctl enable nginx
fi

# 3. Build
log "Installing dependencies..."
npm install

log "Building dashboard..."
npm run build

# 4. Deploy
log "Deploying to ${DEPLOY_DIR}..."
mkdir -p ${DEPLOY_DIR}
rm -rf ${DEPLOY_DIR}/dist
cp -r dist ${DEPLOY_DIR}/

# 5. Nginx
log "Configuring Nginx..."
cat > /etc/nginx/sites-available/smartpsych-dashboard << NGINX
server {
    listen 80;
    server_name ${DOMAIN};

    root ${DEPLOY_DIR}/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://${API_HOST}:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 90s;
        client_max_body_size 10M;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)\$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
NGINX

ln -sf /etc/nginx/sites-available/smartpsych-dashboard /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo ""
echo "═══════════════════════════════════════"
echo -e "  ${GREEN}Dashboard Ready!${NC}"
echo "═══════════════════════════════════════"
echo ""
echo "  URL:      http://${DOMAIN}"
echo "  API:      http://${API_HOST}:3000"
echo "  Admin:    mbmabadie@gmail.com / 123456"
echo ""
echo "  SSL:"
echo "    certbot --nginx -d ${DOMAIN}"
echo "═══════════════════════════════════════"
