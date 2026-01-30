# Automatic Deployment Setup Guide

This guide explains how to set up automatic deployment so that every push to your `main` branch automatically updates your production server.

## How It Works

1. You push code to GitHub `main` branch
2. GitHub Actions workflow triggers
3. Workflow SSHs into your EC2 server
4. Deployment script runs:
   - Pulls latest code
   - Installs dependencies
   - Generates Prisma Client
   - Runs database migrations
   - Builds the application
   - Restarts PM2 processes

## Prerequisites

- [ ] Code is in a GitHub repository
- [ ] EC2 instance is set up and running
- [ ] Initial manual deployment completed (following DEPLOYMENT_GUIDE.md)
- [ ] SSH access to EC2 working

## Setup Steps

### Step 1: Ensure Deployment Script is on EC2

The `deploy.sh` script should be in your repository. After cloning to EC2, make it executable:

```bash
# On EC2
cd /home/ubuntu/blfs-cafe
chmod +x deploy.sh
```

### Step 2: Configure GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

#### Add EC2_HOST Secret

- **Name:** `EC2_HOST`
- **Value:** Your EC2 public IP address
  - Example: `54.123.45.67`
  - You can find this in AWS Console or by running `curl ifconfig.me` on EC2

#### Add EC2_SSH_KEY Secret

- **Name:** `EC2_SSH_KEY`
- **Value:** Your private SSH key contents
  - Open your `.pem` file (the one you use to SSH into EC2)
  - Copy the **entire contents**, including:
    ```
    -----BEGIN RSA PRIVATE KEY-----
    [key content]
    -----END RSA PRIVATE KEY-----
    ```
  - Paste the entire key as the secret value

**Important:** Never commit your `.pem` file to Git! Only add it as a GitHub Secret.

### Step 3: Verify GitHub Actions Workflow

The workflow file `.github/workflows/deploy.yml` should be in your repository. It contains:

```yaml
name: Deploy to EC2

on:
  push:
    branches:
      - main

jobs:
  deploy:
    name: Deploy to AWS EC2
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to EC2 via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/ubuntu/blfs-cafe
            ./deploy.sh
```

This workflow will automatically run on every push to `main`.

### Step 4: Test Automatic Deployment

1. Make a small change to your code (e.g., update a comment)
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test automatic deployment"
   git push origin main
   ```
3. Go to GitHub → **Actions** tab
4. You should see a workflow run called "Deploy to EC2"
5. Click on it to see the deployment progress
6. Wait for it to complete (usually 2-5 minutes)

### Step 5: Verify Deployment

```bash
# SSH into EC2
ssh -i /path/to/your-key.pem ubuntu@your-ec2-ip

# Check PM2 status
pm2 status

# Check recent logs
pm2 logs --lines 50
```

## Troubleshooting

### GitHub Actions Fails with "Permission denied"

- **Issue:** SSH key not configured correctly
- **Solution:** 
  - Verify the `EC2_SSH_KEY` secret contains the complete private key
  - Make sure there are no extra spaces or line breaks
  - Ensure the key file format is correct

### GitHub Actions Fails with "Host key verification failed"

- **Issue:** EC2 host key not in known hosts
- **Solution:** Add this to the workflow before the SSH step:
  ```yaml
  - name: Add EC2 to known hosts
    run: |
      ssh-keyscan -H ${{ secrets.EC2_HOST }} >> ~/.ssh/known_hosts
  ```

### Deployment Script Fails

- **Issue:** Script not executable or path issues
- **Solution:**
  ```bash
  # On EC2
  cd /home/ubuntu/blfs-cafe
  chmod +x deploy.sh
  ls -la deploy.sh  # Should show -rwxr-xr-x
  ```

### Build Fails

- **Issue:** Missing dependencies or environment variables
- **Solution:**
  - Check that `.env` file exists on EC2
  - Verify all environment variables are set
  - Check PM2 logs: `pm2 logs baristaos-nextjs`

### Database Migration Fails

- **Issue:** Schema changes not compatible
- **Solution:**
  - Review the migration error in GitHub Actions logs
  - You may need to manually run migrations first
  - Consider using `prisma migrate dev` locally before pushing

## Manual Deployment (Fallback)

If automatic deployment isn't working, you can deploy manually:

```bash
# SSH into EC2
ssh -i /path/to/your-key.pem ubuntu@your-ec2-ip

# Run deployment script
cd /home/ubuntu/blfs-cafe
./deploy.sh
```

Or step by step:

```bash
cd /home/ubuntu/blfs-cafe
git pull origin main
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 restart all
```

## Security Best Practices

1. **Never commit secrets:** Keep `.env` and `.pem` files out of Git
2. **Use GitHub Secrets:** Store sensitive data in GitHub Secrets, not in code
3. **Limit SSH access:** Only allow your IP in the security group for SSH (port 22)
4. **Rotate keys:** Periodically rotate your SSH keys
5. **Monitor deployments:** Check GitHub Actions logs regularly

## Workflow Customization

### Deploy Only on Tags

If you want to deploy only when you create a tag:

```yaml
on:
  push:
    tags:
      - 'v*'
```

### Deploy to Different Branches

To deploy from a different branch:

```yaml
on:
  push:
    branches:
      - production  # Change from 'main' to your branch
```

### Add Notifications

Add Slack/Discord notifications on deployment:

```yaml
- name: Notify on Success
  if: success()
  run: |
    # Add your notification logic here
    echo "Deployment successful!"
```

## Success!

Once set up, every push to `main` will automatically:
1. ✅ Pull latest code
2. ✅ Install dependencies  
3. ✅ Update database schema
4. ✅ Build application
5. ✅ Restart services

Your production server will always be up-to-date! 🚀
