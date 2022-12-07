#!/bin/bash

# Start DB instance.
docker pull mariadb:10.5 && \
  docker run -d --rm --name db -p 3306:3306 -e MARIADB_ROOT_PASSWORD=root mariadb:10.5

# Wait until startup.
while [ -z "$(docker logs db 2>&1 | grep "ready for connections.")" ]; do
  sleep 1
done
sleep 5

# Initialize database.
cat << EOF | tee | mysql -Ns -uroot -proot
CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';
GRANT ALL PRIVILEGES ON *.* TO '${MYSQL_USER}'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
EOF

