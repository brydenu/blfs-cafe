# Quick Deployment Checklist

Use this checklist to track your deployment progress.

## Pre-Deployment

- [ ] Code is committed and pushed to repository (if using Git)
- [ ] All environment variables documented
- [ ] Database credentials ready
- [ ] Email credentials ready (Gmail App Password or SMTP)
- [ ] Domain name ready
- [ ] EC2 instance running
- [ ] Security group configured (ports 22, 80, 443)

## EC2 Setup

- [ ] Connected to EC2 via SSH
- [ ] System packages updated
- [ ] Node.js 20.x installed
- [ ] PostgreSQL installed (or RDS configured)
- [ ] PM2 installed globally
- [ ] Nginx installed
- [ ] Certbot installed

## Application Deployment

- [ ] Application code uploaded to EC2
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with all variables
- [ ] Prisma Client generated (`npx prisma generate`)
- [ ] Database schema pushed (`npx prisma db push`)
- [ ] Database seeded (`npx prisma db seed`)
- [ ] Application built (`npm run build`)
- [ ] PM2 ecosystem file created/verified
- [ ] Logs directory created
- [ ] PM2 processes started
- [ ] PM2 startup configured

## Nginx Configuration

- [ ] Nginx config file created
- [ ] Domain name updated in config
- [ ] Site enabled
- [ ] Nginx config tested (`sudo nginx -t`)
- [ ] Nginx reloaded

## SSL/HTTPS

- [ ] DNS records configured (A records for domain and www)
- [ ] DNS propagated (checked with `nslookup` or `dig`)
- [ ] SSL certificate obtained (`sudo certbot --nginx`)
- [ ] SSL auto-renewal tested

## Security

- [ ] `.env` file permissions set (600)
- [ ] UFW firewall configured
- [ ] Security group rules verified
- [ ] Strong passwords used
- [ ] AUTH_SECRET generated

## Testing

- [ ] Application accessible at `https://yourdomain.com`
- [ ] User registration works
- [ ] User login works
- [ ] Ordering flow works
- [ ] Admin dashboard accessible
- [ ] WebSocket connections work (real-time updates)
- [ ] Email notifications work (if configured)
- [ ] All pages load correctly
- [ ] Mobile responsive design works

## Post-Deployment

- [ ] Monitoring set up (optional)
- [ ] Backups configured (optional but recommended)
- [ ] Documentation updated
- [ ] Team notified

## Quick Commands Reference

```bash
# PM2
pm2 status
pm2 logs
pm2 restart all
pm2 stop all
pm2 start all

# Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log

# Application
cd /home/ubuntu/blfs-cafe
npm run build
pm2 restart all

# Database
npx prisma db push
npx prisma db seed
npx prisma generate

# SSL
sudo certbot renew
sudo certbot certificates
```
