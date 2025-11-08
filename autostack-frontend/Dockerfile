# ---- Base image ----
FROM node:20-bullseye

# ---- Build arguments for Next.js ----
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_USE_MOCKS=false

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

# ---- Set environment variables for build ----
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_USE_MOCKS=$NEXT_PUBLIC_USE_MOCKS

# ---- Build the Next.js app ----
RUN npm run build


# ---- Expose port ----
EXPOSE 3000

# ---- Run in production mode ----
CMD ["npm", "run", "start"]
