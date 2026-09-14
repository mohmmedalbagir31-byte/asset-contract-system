# --- المرحلة الأولى: بناء الفرت إند ---
FROM node:18 AS build-frontend
WORKDIR /app/frontend
COPY frontend-app/package*.json ./
RUN npm install
COPY frontend-app/./ ./
RUN npm run build

# --- المرحلة الثانية: بناء الباك إند .NET ---
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build-backend
WORKDIR /app
COPY AssetContractSystem/*.csproj ./AssetContractSystem/
RUN dotnet restore AssetContractSystem/AssetContractSystem.csproj

COPY . .
WORKDIR /app/AssetContractSystem
RUN dotnet publish -c Release -o /out

# --- المرحلة الثالثة: تجميع النسخة النهائية للتشغيل ---
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build-backend /out .

# نسخ ملفات الـ React البيلد إلى wwwroot الخاص بالباك إند داخل الحاوية
COPY --from=build-frontend /app/frontend/dist /app/wwwroot

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "AssetContractSystem.dll"]