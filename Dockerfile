FROM node:18 AS build

RUN npm i -g npm

WORKDIR /opt
COPY package.json package-lock.json /opt/
RUN npm i

COPY tsconfig.json /opt/
COPY prisma /opt/prisma
COPY src /opt/src
RUN npm run build

FROM node:18 AS run

RUN npm i -g npm

WORKDIR /opt
COPY package.json package-lock.json /opt/
RUN npm i --omit dev

COPY --from=build /opt/node_modules/.prisma /opt/node_modules/.prisma
COPY --from=build /opt/dist /opt/dist

ENV MYSQL_HOST "${MYSQL_HOST}"
ENV MYSQL_USER "${MYSQL_USER}"
ENV MYSQL_PASSWORD "${MYSQL_PASSWORD}"
ENV MYSQL_DATABASE "${MYSQL_DATABASE}"
ENV DATABASE_URL "mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@${MYSQL_HOST}:3306/${MYSQL_DATABASE}"
ENV JWT_SECRET "${JWT_SECRET}"
EXPOSE 3000

CMD node /opt/dist/main.js
