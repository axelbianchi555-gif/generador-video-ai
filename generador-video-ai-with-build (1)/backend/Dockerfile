FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY . .
RUN mkdir -p storage/uploads storage/outputs
EXPOSE 8000
CMD ["node","index.js"]
