FROM denoland/deno:1.40.2

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY . .

# 缓存依赖
RUN deno cache main.ts

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "--unstable-kv", "main.ts"]