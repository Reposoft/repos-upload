FROM solsson/rweb-httpd:latest

RUN apt-get update \
  && apt-get install -y apt-transport-https lsb-release curl \
  && curl -s https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - \
  && echo 'deb https://deb.nodesource.com/node_6.x jessie main' > /etc/apt/sources.list.d/nodesource.list \
  && apt-get update \
  && apt-get install -y nodejs

WORKDIR /usr/src/app/build-contracts/ui

COPY . /usr/src/app

RUN cd /usr/src/app && npm install

RUN npm install \
  && ./node_modules/.bin/webpack \
  && cp *.html /usr/local/apache2/htdocs \
  && cp bundle.js /usr/local/apache2/htdocs

COPY build-contracts/ui /usr/local/apache2/htdocs
