# YYT 28 Server

## Stack

- NGINX
- Mariadb
- Node.js 18

```bash
sudo yum install nginx docker

sudo systemctl start nginx
sudo systemctl start docker
sudo systemctl enable --now nginx
sudo systemctl enable --now docker
```

## Certbot

```bash
sudo amazon-linux-extras install epel
sudo yum install certbot certbot-nginx
sudo yum install nginx
sudo service nginx start

sudo certbot --nginx -d your.domain.name --email your-email@address.com --agree-tos
```
