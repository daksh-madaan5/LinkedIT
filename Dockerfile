# ----------------------------------------------------
# Stage 1: Build the Maven Project
# ----------------------------------------------------
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Copy POM definitions for dependency caching
COPY pom.xml .
COPY jsprit-core/pom.xml jsprit-core/
COPY routing-backend/pom.xml routing-backend/

# Copy all source files
COPY jsprit-core/src jsprit-core/src
COPY routing-backend/src routing-backend/src

# Package backend fat JAR
RUN mvn clean package -DskipTests

# ----------------------------------------------------
# Stage 2: Minimal Production JRE Runtime (512MB friendly)
# ----------------------------------------------------
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Run as non-root user
RUN addgroup -S linkedit && adduser -S linkedit -G linkedit
USER linkedit

# Copy compiled JAR from builder stage
COPY --from=builder /build/routing-backend/target/routing-backend-*.jar app.jar

EXPOSE 8080

# Configure JVM memory optimizations for free cloud tiers (512MB RAM)
ENV JAVA_OPTS="-Xms128m -Xmx384m -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
