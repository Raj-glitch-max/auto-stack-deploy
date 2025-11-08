# ---- Base image ----
FROM node:20-bullseye

# ---- Working directory ----
WORKDIR /app

# ---- Copy dependency files ----
COPY package*.json ./

# ---- Clear any lock corruption ----
RUN rm -rf node_modules package-lock.json

# ---- Install dependencies cleanly ----
RUN npm install --force

# ---- Copy the entire project ----
COPY . .

# ---- Force reinstall Next.js properly ----
RUN npm install next@latest --force

# ---- Build the Next.js app ----
RUN npm run build

# ---- Expose port ----
EXPOSE 3000

# ---- Run in production mode ----
CMD ["npm", "run", "start"]
