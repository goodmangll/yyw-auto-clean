import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import Config from './config';
import AlistTemplate from 'alist-sdk-ts';
import axios from 'axios';



let config: Config

let alistTemplate: AlistTemplate

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function loadConfig() {
    console.log('加载配置...')
    // 定义配置文件的路径
    const configPath = path.join(process.cwd(), '/config/config.yml')
    // 读取文件内容
    const fileContent = fs.readFileSync(configPath, 'utf8');
    // 解析 YAML 字符串为 JavaScript 对象
    config = yaml.load(fileContent) as Config
}

async function getStorageItemByPath(path: string) {
    const page = await alistTemplate.client.adminStorageList()
    return page.content.find(item => item.mount_path === path)
}

async function addTask() {
    console.log('加载alist连接...')
    alistTemplate = new AlistTemplate(config.alist.addr, config.alist.token)
    await alistTemplate.awaitNormal()
    config.cleans.forEach(async (clean) => {
        new Promise(async () => {
            let yywAxios
            let first = true
            let logs: string[] | undefined
            while (true) {
                if (logs) {
                    logs.push(`------ ${clean.path} end ------`)
                    const log = logs.join('\n')
                    console.log(log)
                }
                logs = [`------ ${clean.path} begin ------`]
                try {
                    if (first) {
                        first = false
                    } else {
                        await sleep(clean.intervalTime * 1000)
                    }
                    const storageItem = await getStorageItemByPath(clean.path)
                    if (!storageItem) {
                        logs.push(`${clean.path} 所在的存储不存在！！`)
                        continue
                    }

                    if (storageItem?.driver !== '115 Cloud') {
                        logs.push(`${clean.path} 所在的存储不是115云盘！！`)
                        continue
                    }

                    const addition = storageItem.addition
                    const cookie = JSON.parse(addition)['cookie']

                    yywAxios = axios.create({
                        baseURL: 'https://webapi.115.com',
                        headers: {
                            'Cookie': cookie,
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
                        }
                    })

                    await alistTemplate.client.fsList({path: clean.path, refresh: true})

                    await sleep(500)

                    // 1. 删除“我的接收”目录
                    logs.push(`1. 删除“我的接收”目录...`)
                    await alistTemplate.client.fsRemove(clean.path, ['我的接收'])
                    logs.push(`删除“我的接收目录”成功！`)

                    await sleep(500)


                    logs.push(`2. 创建“我的接收”目录...`)
                    const mkPath = path.join('/', clean.path, '/我的接收')
                    await alistTemplate.client.fsMkdir(mkPath)
                    logs.push(`创建“我的接收”目录成功！`)

                    await sleep(500)

                    logs.push(`3. 获取回收站中“我的接收”目录的ID...`)
                    let res = await (await yywAxios.get('/rb?aid=7&cid=0&offset=0&limit=32&source=&format=json')).data
                    if (!res['state']) {
                        logs.push(`获取回收站中“我的接收”目录的ID失败！！`)
                        continue
                    }

                    if (!res.data || !res.data.length) {
                        logs.push(`回收站中未找到“我的接收”目录！`)
                        continue
                    }

                    await sleep(500)
                    
                    const rbArr = res.data as Record<string, undefined>[]
                    const rbIds = rbArr
                        .filter(item => item['file_name'] === '我的接收' && item['cid'] === 0)
                        .map(item => item['id'])

                    if (!rbIds || !rbIds.length) {
                        logs.push(`回收站中未找到“我的接收”目录！`)
                        continue
                    }

                    await sleep(500)

                    logs.push(`4. 清除回收站中“我的接收”目录...`)
                    let formData = new FormData()
                    formData.append('password', String(clean.password))
                    rbIds.forEach((id, index) => {
                        formData.append(`rid[${index}]`, String(id))
                    })

                    res = (await yywAxios.post('/rb/clean', formData)).data
                    if (!res['state']) {
                        logs.push(`清除回收站中“我的接收”目录失败！！`)
                        continue
                    }

                    logs.push('全部完成！')
                    
                } catch (error) {
                    logs.push((error as Error).message)
                }
            }
        })
    })
}

function start() {
    loadConfig()
    addTask()
}

start()


