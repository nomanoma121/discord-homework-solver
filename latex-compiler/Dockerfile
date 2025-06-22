# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
ENV CGO_ENABLED=0
ENV GOOS=linux
RUN go build -o server .

# Final stage
FROM debian:bullseye-slim

# Install dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        texlive-full \
        fonts-ipafont \
        fontconfig && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy the binary
COPY --from=builder /app/server /server

EXPOSE 8080
CMD ["/server"]
