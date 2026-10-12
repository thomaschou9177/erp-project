# 階段一：建置 (Build) 專案
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

# 複製依賴與原始碼
COPY . .

# 使用 Maven wrapper 打包出 jar 檔 (跳過測試以加速)
RUN ./mvnw clean package -DskipTests

# 階段二：執行 (Run) 專案
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# 從建置階段把打包好的 jar 檔複製過來
COPY --from=build /app/target/*.jar app.jar

# Cloud Run 預設會監聽 8080 連接埠 (請確保你的 Spring Boot 設定也是 8080，或透過環境變數對應)
EXPOSE 8080

# 啟動應用程式
ENTRYPOINT ["java", "-jar", "app.jar"]