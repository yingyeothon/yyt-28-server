# YYT 28 Server

## Stack

- Mariadb
- Node.js 16

```bash
sudo systemctl start redis mariadb mariadb-server

sudo systemctl start redis
sudo systemctl start mariadb

sudo systemctl enable --now mariadb
sudo systemctl enable --now redis

sudo yum install -y gcc-c++ make
curl -sL https://rpm.nodesource.com/setup_16.x | sudo -E bash -
sudo yum install -y nodejs

sudo yum install git
```

## Certbot

```bash
# sudo yum -y install epel-release yum-utils
sudo amazon-linux-extras install epel
sudo yum install certbot certbot-nginx
sudo yum install nginx  # Download cert files.
sudo service nginx start

sudo certbot --nginx -d your.domain.name --email your-email@address.com --agree-tos
```
