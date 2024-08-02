#!/bin/bash

set -e

# 定义镜像仓库地址
IMAGE_REGISTRY="registry.cn-hangzhou.aliyuncs.com/goodmangll/yyw-auto-clean"

# 定义错误处理函数
function error_exit {
    echo "$1" 1>&2
    exit 1
}


# 定义函数：检查参数是否合法
function validate_version {
    if [ -z "$version" ]; then
        error_exit "请输入 -v 参数\n如: ./build.sh -v beta2.0"
    elif [[ ! "$version" =~ ^[a-zA-Z0-9.-]+$ ]]; then
        error_exit "版本号格式不正确，请输入符合规范的版本号。"
    fi
}

while getopts 'v:p:' OPT; do
    case $OPT in
    v) version="$OPTARG" ;;
    p) platform="$OPTARG" ;; # 预留平台参数处理
    esac
done

validate_version

if [ "$version" == "stable" ]; then
    read -p "确认操作？(y/n): " choice
    if [ "$choice" != "y" ]; then
        echo "操作已取消。"
        exit 1
    fi
fi

image="$IMAGE_REGISTRY"

image_version=$image:$version

echo "镜像名: $image_version"
echo "版本: $version"

pnpm install

docker build --platform linux/amd64 -t $image_version -f Dockerfile . || error_exit "Docker 镜像构建失败。"
docker push $image_version || error_exit "Docker 镜像推送失败。"
