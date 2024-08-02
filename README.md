## 简介

自动删除 yyw 网盘（连同回收站）中的“我的接收”目录

## docker-componse使用

### 1. 创建配置文件夹和配置文件

```yaml
# alist配置
alist:
  # alist地址
  addr: http://172.17.0.1:8096
  # alist token
  token: alist token
cleans:
  # alist中要清除的yyw盘的挂载路径
  - path: /115
    # 清除盘的间隔（单位秒）120秒 = 2分钟
    intervalTime: 120
    # 回收站密码
    password: 123456
```

注意：

- 清除盘的间隔不要写太短，以免被风控
- path 配置不要写错以免重要文件被误删

### 2. 创建 docker-compose.yml

```yaml
version: "3.8"
services:
  yyw-auto-clean:
    restart: always
    container_name: yyw-auto-clean
    image: registry.cn-hangzhou.aliyuncs.com/goodmangll/yyw-auto-clean:stable
    volumes:
      # 挂载配置文件
      - ./config:/user/src/app/config
```

注意：

- 配置文件目录要和容器目录一致
