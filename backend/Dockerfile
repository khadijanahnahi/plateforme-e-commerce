FROM maven:3.9-eclipse-temurin-26 AS build

WORKDIR /app

COPY pom.xml .
RUN mvn -q dependency:go-offline

COPY src ./src
RUN mvn -q clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

RUN addgroup -S -g 10001 shopsphere \
    && adduser -S -D -H -u 10001 -G shopsphere shopsphere
RUN mkdir -p /app/storage/invoices && chown -R shopsphere:shopsphere /app

USER 10001:10001

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
