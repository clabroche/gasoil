FROM alpine:3.11 as builder
RUN apk --no-cache add gcc g++ make python3 nodejs npm

WORKDIR /gasoil
COPY ./server .
RUN npm ci --production

FROM alpine:3.11
RUN apk --no-cache add nodejs
WORKDIR /gasoil
COPY --from=builder /gasoil .
CMD ["node", "bin/www"]
