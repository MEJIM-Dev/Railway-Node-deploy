const fs = require("fs")

const start = new Date()
// fs.writeFile("sample2.txt","samfgchgfcgh",function(){
//     const now = new Date()
//     console.log("async done",start.getMilliseconds(),now.getMilliseconds())
// })

console.log("sync start", new Date().getMilliseconds())
fs.writeFileSync("sample.txt","sample")
const Syncnow = new Date()
console.log("sync done",start.getMilliseconds(),Syncnow.getMilliseconds())

let data = fs.readFileSync("sample2.txt","utf-8")
console.log(data)

fs.readFile("sample2.txt","utf8",function(err,data){
    console.log(err,data)
})

fs.appendFile("sample2.txt","another data",(err)=>{
    console.log(err)
})

function write(filename,content){
    fs.readFile(filename,"utf-8",function(err,data){
        const oldText = data;
        const newText = err!=null ? content : oldText+" "+content
        fs.writeFile(filename,newText,(err)=>{
            console.log("done")
        })
    })
}

// write("sample3.txt","apples")
const obj = { "name": "Abraham", "age": 30}

fs.writeFile("sample.json",JSON.stringify(obj,null,2),()=>{})


