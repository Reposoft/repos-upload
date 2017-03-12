FROM solsson/rweb-httpd:latest

RUN curl -sL https://deb.nodesource.com/setup_6.x | bash - \
  && apt-get update \
  && apt-get install -y nodejs

WORKDIR /usr/src/app/build-contracts/ui

COPY . /usr/src/app

RUN npm install \
  && ./node_modules/.bin/webpack \
  && cp *.html /usr/local/apache2/htdocs \
  && cp bundle.js /usr/local/apache2/htdocs

COPY build-contracts/ui /usr/local/apache2/htdocs
