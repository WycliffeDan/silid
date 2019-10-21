silid
=====

SIL Identity and group membership manager

This code is originally bootstrapped from the _Node.js Quick Start Application_ provided by [Auth0](https://auth0.com).

## Setup

```
cp .env.example .env
npm install
```

Configure `.env` with Auth0 credentials:

```
AUTH0_CLIENT_ID=YOUR_CLIENT_ID
AUTH0_DOMAIN=dev-sillsdev.auth0.com
AUTH0_CLIENT_SECRET=YOUR_CLIENT_SECRET
AUTH0_CALLBACK_URL=http://localhost:3000/callback
```

Execute:

```
npm start
```

## Production

In the application directory:

```
cd silid
NODE_ENV=production npm install
```

The _Dockerized_ production is meant to be deployed behind an [`nginx-proxy`/`lets-encrypt`](https://libertyseeds.ca/2017/07/31/Nginx-Proxy-Let-s-Encrypt-Companion-and-Docker-Compose-Version-3/) combo:

```
docker-compose -f docker-compose.prod.yml up -d
```

### Seed database:

_Coming soon..._

```
docker-compose -f docker-compose.prod.yml run --rm node node seed.js NODE_ENV=production
```

### Database backup and recovery

Backup:

```
docker-compose -f docker-compose.prod.yml exec mongo mongodump --host mongo --db silid_production --gzip --out ./backups
tar zcvf silid_production.tar.gz backups/silid_production/
tar zcvf uploads.tar.gz uploads/
```

Restore:

```
tar zxvf silid_production.tar.gz
tar zxvf uploads.tar.gz
docker-compose -f docker-compose.prod.yml exec mongo mongorestore --gzip --db silid_production backups/silid_production
```

Restore to dev:

```
docker exec -it dev-mongo mongorestore -d silid_development --gzip backups/silid_production
```

#### Database Operations

Connect to DB container like this:

```
docker-compose -f docker-compose.prod.yml exec mongo mongo silid_production
```

Show databases:

```
show dbs
```

Use database:

```
use silid_production
```

Show collections:

```
show collections
```



