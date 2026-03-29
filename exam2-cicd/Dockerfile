# ============================================================
# Dockerfile CORREGIDO - Examen 2, Actividad 1 Parte A
# 4 errores identificados y corregidos
# Verificación: docker build -t myapp .
# ============================================================
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]