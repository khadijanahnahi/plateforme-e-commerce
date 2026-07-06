FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .
RUN mvn -q dependency:go-offline

COPY src ./src
RUN mvn -q clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

RUN addgroup -S shopsphere && adduser -S shopsphere -G shopsphere
RUN mkdir -p /app/storage/invoices && chown -R shopsphere:shopsphere /app

USER shopsphere

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
