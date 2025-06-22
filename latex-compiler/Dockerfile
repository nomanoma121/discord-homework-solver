# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum* ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
ENV CGO_ENABLED=0
ENV GOOS=linux
RUN go build -o server .

# Final stage
FROM alpine:latest

# Install LaTeX packages
RUN apk add --no-cache texlive texlive-luatex texlive-xetex curl

# Copy the binary from builder stage
COPY --from=builder /app/server /server

# Expose port
EXPOSE 8080

# Run the server
CMD ["/server"]
