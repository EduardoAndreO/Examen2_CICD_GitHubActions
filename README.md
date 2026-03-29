# Examen 2: CI/CD con GitHub Actions y Docker
**Sistemas Operativos I** | CEUTEC San Pedro Sula  
Docente: Ing. Kevin Ivan Cruz Medina

---

## Estructura del Proyecto

```
exam2-cicd/
├── .github/
│   └── workflows/
│       ├── ci.yml          # Actividad 2: Pipeline CI
│       └── cd.yml          # Actividad 3: Pipeline CD
├── src/
│   └── index.js            # App Express
├── tests/
│   └── app.test.js         # Tests con Jest + Supertest
├── .eslintrc.json          # Reglas de ESLint
├── jest.config.js          # Configuración de Jest
├── package.json
├── Dockerfile              # Actividad 1A (corregido)
├── docker-compose.yml      # Actividad 1B
├── render.yaml             # Blueprint para Render
├── .env.example
└── README.md
```

---

## Actividad 1A — Dockerfile Corregido

Los 4 errores identificados y sus correcciones:

| # | Línea Original | Línea Corregida | Razón |
|---|---|---|---|
| 1 | `FROM node:latest` | `FROM node:18-alpine` | `latest` es no determinístico y puede romper builds. Se usa versión específica + alpine para imagen ligera. |
| 2 | `COPY . .` (antes de install) | `COPY package*.json ./` primero, luego `COPY . .` | Layer caching: si solo cambia el código fuente, Docker reutiliza la capa de `node_modules` sin reinstalar. |
| 3 | `npm install --production` | `RUN npm install --production` | Faltaba la instrucción `RUN`. Sin ella, Dockerfile no ejecuta el comando y el build falla. |
| 4 | `EXPOSE 80` | `EXPOSE 3000` | Node.js/Express corre en el puerto 3000 por defecto. El puerto 80 corresponde a servidores HTTP como Nginx. |

---

## Actividad 1B — Docker Compose

**Servicios definidos:**
- `web`: App Node.js/Express (build local)
- `db`: PostgreSQL 15 Alpine

**Características:**
- ✅ Volumen persistente `postgres_data` para la base de datos
- ✅ Red personalizada `app-network` (bridge)
- ✅ Health check en el servicio `db`
- ✅ `depends_on` con condición `service_healthy`

**Comandos:**
```bash
# Levantar todos los servicios
docker-compose up

# En segundo plano
docker-compose up -d

# Detener y eliminar contenedores (volúmenes se conservan)
docker-compose down

# Eliminar también los volúmenes
docker-compose down -v
```

---

## Actividad 2 — CI Pipeline

**Archivo:** `.github/workflows/ci.yml`

| Requisito | Implementación |
|---|---|
| Triggers | `push: [main]` y `pull_request: [main]` |
| Job lint | ESLint en Node 18.x y 20.x (matrix) |
| Job test | Jest en Node 18.x y 20.x (matrix) |
| Job coverage | Jest --coverage, sube artefacto |
| Matrix strategy | `node-version: [18.x, 20.x]` |
| Cache npm | `cache: 'npm'` en `actions/setup-node@v4` |

---

## Actividad 3 — CD Pipeline + Configuración de Render

**Archivo:** `.github/workflows/cd.yml`

### Paso 1: Crear servicio en Render

1. Ir a [render.com](https://render.com) → **New > Web Service**
2. Conectar tu repositorio de GitHub
3. Configurar:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
4. Hacer clic en **Deploy**

### Paso 2: Obtener credenciales para GitHub Secrets

**RENDER_API_KEY:**
1. En Render → click en tu avatar (esquina superior derecha)
2. **Account Settings > API Keys**
3. Clic en **Create API Key** → copiar la clave

**RENDER_SERVICE_ID:**
1. En Render → selecciona tu Web Service
2. En la URL verás algo como: `https://dashboard.render.com/web/srv-abc123xyz`
3. El Service ID es: `srv-abc123xyz`

### Paso 3: Configurar GitHub Secrets

1. En tu repositorio GitHub → **Settings > Secrets and variables > Actions**
2. Clic en **New repository secret**
3. Agregar:
   - Name: `RENDER_API_KEY` → pegar el API Key de Render
   - Name: `RENDER_SERVICE_ID` → pegar el Service ID (`srv-xxxxx`)

### Paso 4: Configurar GitHub Environment

1. En tu repositorio → **Settings > Environments**
2. Clic en **New environment**
3. Nombre: `production`
4. Opcional: agregar **Required reviewers** para aprobación manual

### Verificación del Pipeline

Después de hacer push a `main`, ve a la pestaña **Actions** de tu repositorio para ver el pipeline ejecutarse. Toma un screenshot del run exitoso para incluir como evidencia.

> **Evidencia:** *(Agregar aquí screenshot del deployment exitoso en la pestaña Actions)*

---

## Actividad 4 — Troubleshooting (Corrección de Snippets YAML)

### Snippet 1 — Error de sintaxis en triggers

**INCORRECTO:**
```yaml
on:
  push
  branches: [main]
  pull_request
  branches [main, develop]
```

**CORRECTO:**
```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main, develop]
```

**Errores encontrados:**
1. Faltaba `:` después de `push` → `push:` (declaración de mapa YAML)
2. `branches` no estaba indentado correctamente bajo `push:` (debía ser hijo de `push:`)
3. Faltaba `:` después de `pull_request` → `pull_request:`
4. Faltaba `:` después del segundo `branches` → `branches:`

---

### Snippet 2 — Referencia incorrecta a secrets

**INCORRECTO:**
```yaml
env:
  VERCEL_TOKEN: secrets.VERCEL_TOKEN
```

**CORRECTO:**
```yaml
env:
  VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

**Error encontrado:** Los secrets de GitHub deben referenciarse con la sintaxis de expresión `${{ secrets.NOMBRE }}`. Sin los delimitadores `${{ }}`, GitHub Actions lo trata como una cadena de texto literal y no resuelve el valor del secret.

---

### Snippet 3 — Matrix inválida

**INCORRECTO:**
```yaml
strategy:
  matrix:
    node-version: 18        # ← escalar, no array
```

**CORRECTO:**
```yaml
strategy:
  matrix:
    node-version: [18, 20]  # ← array con mínimo 2 versiones
```

**Error encontrado:** El valor de `node-version` en la matrix debe ser un **array** (lista) para que GitHub Actions genere múltiples jobs en paralelo. Un valor escalar (`18`) no genera matrix y puede causar un error de tipo en la expresión `${{ matrix.node-version }}`.

---

## Actividad 5 — Preguntas Conceptuales

### 5. ¿Cuál es la diferencia fundamental entre CI y CD?

**Integración Continua (CI)** es el proceso de integrar cambios de código frecuentemente al repositorio principal, ejecutando builds y pruebas automatizadas en cada commit o pull request. Su objetivo es detectar errores de integración lo antes posible.

**Entrega Continua (CD)** extiende CI al automatizar el despliegue del código hacia entornos de staging o producción una vez que las pruebas de CI pasan satisfactoriamente. Mientras CI asegura que el código funciona, CD asegura que el código **puede desplegarse** (Continuous Delivery) o **se despliega automáticamente** (Continuous Deployment).

En resumen: CI = integrar y verificar | CD = desplegar automáticamente.

---

### 6. ¿Qué es un GitHub self-hosted runner y cuándo usarlo?

Un **self-hosted runner** es una máquina propia (servidor físico, VM, o contenedor) que el usuario registra en GitHub para ejecutar workflows de GitHub Actions, en lugar de usar los runners hospedados por GitHub.

**Se necesita cuando:**
- La aplicación requiere hardware específico (GPU, arquitectura ARM, equipos industriales)
- El workflow necesita acceso a recursos de red privada (servidores internos, bases de datos on-premise)
- Se requiere reducir costos en pipelines de alto volumen (los runners de GitHub tienen límites en el plan gratuito)
- Existen requisitos de compliance o seguridad que prohíben ejecutar código en infraestructura de terceros
- Se necesitan dependencias de sistema muy específicas preinstaladas

---

### 7. ¿Cuál es el propósito de los GitHub Environments y cómo se usan?

Los **GitHub Environments** son configuraciones nombradas de despliegue (ej: `staging`, `production`) que permiten:
- Definir **reglas de protección**: aprobación requerida de revisores antes de desplegar
- Asociar **secrets específicos por entorno** (distintos del repositorio general)
- Establecer **wait timers** para retrasar un deploy
- Registrar el historial de deployments por entorno

**Uso en workflows:**
```yaml
jobs:
  deploy:
    environment: production   # activa las reglas y secrets de este environment
    steps:
      - run: echo ${{ secrets.API_KEY }}  # secret específico del environment
```

Esto garantiza que un push accidental a `main` no desplegará a producción sin aprobación.

---

### 8. ¿Qué es una rollback strategy y cómo se implementaría en un pipeline CD?

Una **rollback strategy** es el plan para revertir el sistema a una versión anterior estable cuando un deployment falla o introduce errores en producción.

**Implementación en un pipeline CD:**

1. **Versionado de releases**: usar tags de Git (`v1.0.0`, `v1.1.0`) para identificar versiones desplegables
2. **Docker tags**: mantener imágenes anteriores en Docker Hub (`app:v1.0.0`, `app:stable`)
3. **Rollback automático**: detectar fallos post-deploy con health checks y disparar re-deploy de la versión anterior

**Ejemplo en GitHub Actions:**
```yaml
- name: Health check post-deploy
  run: |
    sleep 30
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${{ secrets.APP_URL }}/health)
    if [ "$STATUS" != "200" ]; then
      # Re-desplegar la última versión estable
      curl -X POST "https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID }}/deploys" \
        -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
        -d '{"commitId": "${{ secrets.LAST_STABLE_COMMIT }}"}'
      exit 1
    fi
```

---

## Comandos de Verificación Local

```bash
# Clonar e instalar
git clone <tu-repo-url>
cd exam2-cicd
npm install

# Ejecutar tests
npm test

# Ejecutar lint
npm run lint

# Ver cobertura
npm run coverage

# Build Docker
docker build -t myapp .

# Docker Compose
docker-compose up

# Iniciar app local
npm start
# → http://localhost:3000
# → http://localhost:3000/health
```