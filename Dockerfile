FROM mcr.microsoft.com/playwright:bionic
WORKDIR /app
COPY yarn.lock /app
COPY package.json /app
RUN PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 yarn install
COPY . /app
RUN yarn build
RUN mv /root/.cache /home/.cache
CMD ls /home/.cache & yarn start:prod
