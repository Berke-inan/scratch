# -------------------------------------------------------------
# Stage 1: Build & Publish
# -------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Önbellek optimizasyonu (Docker layer cache):
# Çözüm ve proje dosyalarını önce kopyalayıp bağımlılıkları restore ediyoruz.
COPY MenuApp.slnx ./
COPY MenuApp.Core/*.csproj MenuApp.Core/
COPY MenuApp.Infrastructure/*.csproj MenuApp.Infrastructure/
COPY MenuApp.Api/*.csproj MenuApp.Api/

RUN dotnet restore MenuApp.Api/MenuApp.Api.csproj

# Kalan tüm kaynak kodları kopyala
COPY . .

# MenuApp.Api projesini Release modunda publish et
WORKDIR /src/MenuApp.Api
RUN dotnet publish -c Release -o /app/publish --no-restore

# -------------------------------------------------------------
# Stage 2: Runtime
# -------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Render ve modern bulut container standartları için port yapılandırması
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

# Build aşamasından publish edilen dosyaları kopyala
COPY --from=build /app/publish .

# Uygulama giriş noktası
ENTRYPOINT ["dotnet", "MenuApp.Api.dll"]
