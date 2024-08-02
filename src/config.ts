export default interface Config {

    alist: {
        addr: string
        token: string
    }
    cleans: Clean[]
}

interface Clean {
    path: string
    intervalTime: number
    password: string
}