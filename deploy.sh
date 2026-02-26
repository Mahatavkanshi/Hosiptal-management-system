#!/bin/bash

# Digital Ocean Deployment Script for Hospital Management System
# Run this script on your Digital Ocean droplet

echo "🚀 Starting deployment of Hospital Management System..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

echo "✅ System dependencies installed"

# Navigate to project directory
cd /root/Hosiptal-management-system || cd /home/$USER/Hosiptal-management-system

echo "📦 Installing backend dependencies..."
cd backend
npm install

# Install missing type definitions
npm install --save-dev @types/node

echo "🔨 Building backend..."
npm run build

echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo "🔨 Building frontend..."
npm run build

echo "✅ Build completed"

echo "📝 Setting up environment..."
cd ../backend

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cat > .env << EOF
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://username:password@localhost:5432/hospital_db
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
FRONTEND_URL=http://your-droplet-ip
EOF
    echo "⚠️  Please update the .env file with your actual configuration"
fi

echo "🚀 Starting backend with PM2..."
# Start with PM2
pm2 start dist/server.js --name "hospital-backend"

# Save PM2 config
pm2 save

# Setup PM2 startup script
pm2 startup systemd

echo "✅ Deployment script completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update the .env file with your actual database credentials"
echo "2. Create the PostgreSQL database"
echo "3. Run migrations: npm run db:migrate"
echo "4. Setup Nginx as reverse proxy (optional)"
echo "5. Configure firewall: sudo ufw allow 5000"
echo ""
echo "🔗 Backend will be running on: http://your-droplet-ip:5000"
echo "🔗 Frontend build is in: /frontend/dist"
