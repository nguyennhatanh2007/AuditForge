#!/bin/sh
set -eu

node /app/docker/wait-for-db.js
node /app/docker/bootstrap-db.js
exec npm start