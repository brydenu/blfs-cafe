# Complete AWS EC2 Deployment Guide for BaristaOS

This guide will walk you through deploying your Next.js application to AWS EC2 step-by-step.

## Prerequisites Checklist

-   [ ] AWS EC2 instance running (Ubuntu recommended)
-   [ ] Domain name configured
-   [ ] AWS credentials ready
-   [ ] SSH access to EC2 instance
-   [ ] Database (PostgreSQL) - either RDS or on EC2
-   [ ] Email credentials for notifications (Gmail App Password or SMTP)

---

## PHASE 1: EC2 Instance Setup

### Step 1.1: Connect to Your EC2 Instance

```bash
# From your local machine
ssh -i /path/to/your-key.pem ubuntu@your-ec2-public-ip
```

**Note:** Replace `/path/to/your-key.pem` with your actual key file path and `your-ec2-public-ip` with your EC2 instance's public IP address.

### Step 1.2: Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 1.3: Install Node.js 20.x

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Step 1.4: Install PostgreSQL (if not using RDS)

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, create database and user:
CREATE DATABASE baristaos;
CREATE USER baristaos_user WITH PASSWORD 'YOUR_SECURE_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE baristaos TO baristaos_user;
ALTER USER baristaos_user CREATEDB;
\q
```

**Important:** Replace `YOUR_SECURE_PASSWORD_HERE` with a strong password. Save this password - you'll need it for the DATABASE_URL.

### Step 1.5: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### Step 1.6: Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 1.7: Install Certbot (for SSL)

```bash
sudo apt install certbot python3-certbot-nginx -y
```

---

## PHASE 2: Deploy Application Code

### Step 2.1: Create Application Directory

```bash
cd /home/ubuntu
mkdir -p blfs-cafe
cd blfs-cafe
```

### Step 2.2: Upload Your Code

**Option A: Using Git (Recommended for Automatic Deployment)**

```bash
# If your code is in a Git repository
git clone https://github.com/your-username/your-repo.git .

# Or if using SSH
git clone git@github.com:your-username/your-repo.git .

# Make deploy script executable
chmod +x deploy.sh
```

**Option B: Using SCP (from your local machine)**

```bash
# On your LOCAL machine, create a tarball (exclude node_modules, .next, .git)
cd /Users/bryden/Documents/code/typescript/blfs-cafe
tar -czf blfs-cafe.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='.env.local' \
  .

# Upload to EC2
scp -i /path/to/your-key.pem blfs-cafe.tar.gz ubuntu@your-ec2-ip:/home/ubuntu/blfs-cafe/

# On EC2, extract
cd /home/ubuntu/blfs-cafe
tar -xzf blfs-cafe.tar.gz
rm blfs-cafe.tar.gz
```

### Step 2.3: Install Dependencies

```bash
cd /home/ubuntu/blfs-cafe
npm install
```

---

## PHASE 3: Database Setup

### Step 3.1: Set Up Environment Variables

```bash
cd /home/ubuntu/blfs-cafe
nano .env
```

Add the following (replace with your actual values):

```env
# Database
# If using RDS:
DATABASE_URL="postgresql://baristaos_user:YOUR_PASSWORD@your-rds-endpoint:5432/baristaos?schema=public"
# If using local PostgreSQL:
DATABASE_URL="postgresql://baristaos_user:YOUR_PASSWORD@localhost:5432/baristaos?schema=public"

# NextAuth
AUTH_SECRET="GENERATE_A_RANDOM_SECRET_HERE"
AUTH_URL="https://yourdomain.com"

# Application URL
NEXT_PUBLIC_URL="https://yourdomain.com"

# Socket Server
NEXT_PUBLIC_SOCKET_URL="https://yourdomain.com"
NEXT_PUBLIC_SOCKET_PORT="443"
SOCKET_SERVER_URL="http://localhost:3001"

# Email Configuration
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"  # Gmail App Password, not regular password

# Node Environment
NODE_ENV="production"
```

**Generate AUTH_SECRET:**

```bash
openssl rand -base64 32
```

Copy the output and paste it as your `AUTH_SECRET` value.

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`.

### Step 3.2: Set Up Database Schema

```bash
cd /home/ubuntu/blfs-cafe

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed the database
npx prisma db seed
```

---

## PHASE 4: Build Application

### Step 4.1: Build Next.js Application

```bash
cd /home/ubuntu/blfs-cafe
npm run build
```

This will create the `.next` directory with the production build.

---

## PHASE 5: Configure Socket Server

The socket server is already configured in `socket-server.js`. It will run on port 3001.

---

## PHASE 6: Set Up PM2 Process Manager

### Step 6.1: Create PM2 Ecosystem File

The `ecosystem.config.js` file should already exist. Verify it's correct:

```bash
cat /home/ubuntu/blfs-cafe/ecosystem.config.js
```

If it doesn't exist or needs updating, create/edit it (see ecosystem.config.js in the repo).

### Step 6.2: Create Logs Directory

```bash
mkdir -p /home/ubuntu/blfs-cafe/logs
```

### Step 6.3: Start Applications with PM2

```bash
cd /home/ubuntu/blfs-cafe
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Important:** The `pm2 startup` command will output a command. Copy and run it to enable PM2 on system boot.

### Step 6.4: Verify PM2 Status

```bash
pm2 status
pm2 logs
```

You should see both `baristaos-nextjs` and `baristaos-socket` running.

---

## PHASE 7: Configure Nginx Reverse Proxy

### Step 7.1: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/baristaos
```

Paste the following configuration:

```nginx
# WebSocket upgrade map
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

# HTTP Server - Redirect to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Next.js Application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Socket.io WebSocket endpoint
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

**Replace `yourdomain.com` with your actual domain name.**

Save and exit: `Ctrl+X`, then `Y`, then `Enter`.

### Step 7.2: Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/baristaos /etc/nginx/sites-enabled/
sudo nginx -t
```

If the test is successful, reload Nginx:

```bash
sudo systemctl reload nginx
```

---

## PHASE 8: Set Up SSL/HTTPS

### Step 8.1: Obtain SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Replace `yourdomain.com` with your actual domain.**

Follow the prompts:

-   Enter your email address
-   Agree to terms of service
-   Choose whether to redirect HTTP to HTTPS (recommend Yes)

Certbot will automatically update your Nginx configuration with SSL certificates.

### Step 8.2: Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

SSL certificates auto-renew, but you can verify the renewal process works.

---

## PHASE 9: Configure Domain DNS

### Step 9.1: Get Your EC2 Public IP

```bash
# On EC2 instance
curl ifconfig.me
```

Or check in AWS Console: EC2 → Instances → Your Instance → Public IPv4 address

### Step 9.2: Configure DNS Records

In your domain registrar (Route 53, Cloudflare, GoDaddy, etc.):

1. **Create A Record:**

    - Name: `@` (or leave blank for root domain)
    - Type: `A`
    - Value: `your-ec2-public-ip`
    - TTL: `300` (or default)

2. **Create A Record for www:**
    - Name: `www`
    - Type: `A`
    - Value: `your-ec2-public-ip`
    - TTL: `300` (or default)

**Wait for DNS propagation** (5 minutes to 48 hours, usually 5-15 minutes).

---

## PHASE 10: Configure Firewall (Security Groups)

### Step 10.1: Configure AWS Security Group

In AWS Console:

1. Go to EC2 → Security Groups
2. Select your instance's security group
3. Edit Inbound Rules:
    - **SSH (22)** - Your IP only (for security)
    - **HTTP (80)** - 0.0.0.0/0 (for Let's Encrypt)
    - **HTTPS (443)** - 0.0.0.0/0 (for your website)

### Step 10.2: Configure UFW Firewall (on EC2)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## PHASE 11: Final Configuration

### Step 11.1: Secure File Permissions

```bash
cd /home/ubuntu/blfs-cafe
chmod 600 .env
chmod 700 /home/ubuntu/blfs-cafe
```

### Step 11.2: Update Socket Server for Production

The socket server should already be configured. Verify it uses environment variables if needed.

---

## PHASE 12: Testing

### Step 12.1: Test Application

1. Visit `https://yourdomain.com`
2. Test user registration/login
3. Test ordering flow
4. Test admin dashboard
5. Test WebSocket connections (queue updates should work in real-time)

### Step 12.2: Check Logs

```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Application logs
pm2 logs baristaos-nextjs
pm2 logs baristaos-socket
```

### Step 12.3: Verify Services

```bash
# Check PM2
pm2 status

# Check Nginx
sudo systemctl status nginx

# Check PostgreSQL (if local)
sudo systemctl status postgresql
```

---

## PHASE 13: Maintenance Commands

### Update Application

```bash
cd /home/ubuntu/blfs-cafe

# Pull latest code (if using Git)
git pull

# Install new dependencies
npm install

# Regenerate Prisma Client
npx prisma generate

# Run database migrations (if any)
npx prisma db push

# Rebuild application
npm run build

# Restart PM2
pm2 restart all
```

### View Logs

```bash
pm2 logs
pm2 logs baristaos-nextjs --lines 100
pm2 logs baristaos-socket --lines 100
```

### Restart Services

```bash
pm2 restart all
sudo systemctl restart nginx
```

---

## Troubleshooting

### Application won't start

```bash
pm2 logs baristaos-nextjs
# Check for errors in logs
```

### Database connection issues

```bash
# Test database connection
psql $DATABASE_URL
```

### Nginx errors

```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Port conflicts

```bash
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001
```

### SSL certificate issues

```bash
sudo certbot certificates
sudo certbot renew
```

---

## Security Checklist

-   [ ] `.env` file has correct permissions (600)
-   [ ] Database password is strong
-   [ ] AUTH_SECRET is randomly generated
-   [ ] SSH key is secured
-   [ ] Security group only allows necessary ports
-   [ ] UFW firewall is enabled
-   [ ] SSL/HTTPS is working
-   [ ] Regular backups are configured (optional but recommended)

---

---

## PHASE 14: Set Up Automatic Deployment from GitHub

### Step 14.1: Upload Deployment Script to EC2

```bash
# On EC2, make sure the deploy script exists and is executable
cd /home/ubuntu/blfs-cafe
chmod +x deploy.sh
```

### Step 14.2: Configure GitHub Secrets

In your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

    **EC2_HOST:**

    - Name: `EC2_HOST`
    - Value: Your EC2 public IP address (e.g., `54.123.45.67`)

    **EC2_SSH_KEY:**

    - Name: `EC2_SSH_KEY`
    - Value: The contents of your private key file (`.pem` file)
        - Open your `.pem` file and copy the entire contents (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`)

### Step 14.3: Verify GitHub Actions Workflow

The workflow file `.github/workflows/deploy.yml` should already be in your repository. It will:

-   Trigger on every push to `main` branch
-   SSH into your EC2 instance
-   Run the `deploy.sh` script
-   Automatically pull latest code, install dependencies, build, and restart

### Step 14.4: Test Automatic Deployment

1. Make a small change to your code
2. Commit and push to `main` branch:
    ```bash
    git add .
    git commit -m "Test automatic deployment"
    git push origin main
    ```
3. Go to GitHub → **Actions** tab to see the deployment progress
4. Check your EC2 server to verify the deployment ran:
    ```bash
    # On EC2
    pm2 logs
    ```

### Step 14.5: Manual Deployment (Alternative)

If you prefer to deploy manually or if GitHub Actions isn't working:

```bash
# SSH into EC2
ssh -i /path/to/your-key.pem ubuntu@your-ec2-ip

# Run deployment script
cd /home/ubuntu/blfs-cafe
./deploy.sh
```

---

## Success!

Your application should now be live at `https://yourdomain.com`!

**With automatic deployment set up, every push to `main` will automatically update your production server!**

If you encounter any issues, check the logs and refer to the troubleshooting section above.
