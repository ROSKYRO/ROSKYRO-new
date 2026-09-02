# ---- Build stage ----
FROM node:20-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Railway build-time variables: declare each VITE_* var as an ARG so Railway's
# "Build Arguments" (Service Settings -> Variables, marked as build-time) get
# baked into the static build. Vite only reads import.meta.env.VITE_* at build time.
ARG VITE_API_URL
ARG VITE_WHATSAPP_BOOKING_NUMBER
ARG VITE_WHATSAPP_SUPPORT_NUMBER
ARG VITE_SUPPORT_PHONE_DISPLAY
ENV VITE_API_URL=$VITE_API_URL \
    VITE_WHATSAPP_BOOKING_NUMBER=$VITE_WHATSAPP_BOOKING_NUMBER \
    VITE_WHATSAPP_SUPPORT_NUMBER=$VITE_WHATSAPP_SUPPORT_NUMBER \
    VITE_SUPPORT_PHONE_DISPLAY=$VITE_SUPPORT_PHONE_DISPLAY

RUN npm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template

# nginx's official entrypoint auto-runs envsubst on templates/*.template into
# conf.d/*.conf, substituting ${PORT}. Default to 80 for local `docker run`;
# Railway overrides PORT at runtime and nginx will listen on that automatically.
ENV PORT=80
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
