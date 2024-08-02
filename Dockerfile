FROM node:22-alpine

# 设置工作目录
WORKDIR /user/src/app

# 安装 tzdata 包以设置时区
RUN apk add tzdata

# 设置时区为 Asia/Shanghai
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "TZ='Asia/Shanghai'; export TZ" >> /etc/profile && \
    source /etc/profile

# 添加使用淘宝镜像的命令
RUN npm config set registry https://registry.npmmirror.com

# 安装 cnpm，然后使用 cnpm 安装依赖
RUN npm install -g cnpm && cnpm install -g ts-node

# 复制当前目录下所有文件到工作目录
COPY . .

# 定义启动容器时的运行命令
CMD ["sh", "-c", "npm run start"]
