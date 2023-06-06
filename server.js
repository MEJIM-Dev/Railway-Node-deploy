const express = require("express")
const fs = require("fs")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const cookieParser = require("cookie-parser")
const { sendLoginMail,sendRegistrationMail } = require("./appUtil.js")
const crypto = require("crypto")
require("dotenv").config({})

const app = express()

const {DB_URL} = process.env

function writeToFileDb(filename,content){
    fs.readFile(filename,"utf-8",function(err,data){
        const oldContent = JSON.parse(data);
        const newContent = addNewContent(oldContent,content)
        fs.writeFile(filename,JSON.stringify(newContent,null,2),(err)=>{
            console.log("done")
        })
    })
}

mongoose.connect(DB_URL)
.then(e=>{
    console.log("DB connected successfully")
})
.catch(e=>{
    console.log(e)
})

const userSchema = new mongoose.Schema({
    id:{type: Number, required:true},
    firstname: {type: String, required:true},
    lastname: {type: String, required:true},
    gender: {type: String, required:true},
    dob: {type: Date, required:true},
    email: {type: String, required:true, unique:true},
    phone: {type: Number, required:true, unique:true},
    countryCode: {type: Number, required:true},
    password: {type: String, required:true},
    active: {type: Boolean, default: false},
},{timestamps:true})

const postSchema = new mongoose.Schema({
    userId: Number,
    id: Number,
    title: String,
    body: String
})

const registrationTokenSchema = new mongoose.Schema({
    token: {type: String, required: true},
    used: {type: Boolean, required: true, default: false},
    email: {type:String, required: true}
}, {timestamps:true})

const RegistrationToken = new mongoose.model("RegistrationToken",registrationTokenSchema)

const User = new mongoose.model("User",userSchema)

const Post = new mongoose.model("Post",postSchema)

function addNewContent(oldArray,newContent){
    if(oldArray){
        oldArray.push(newContent)
        return oldArray;
    }
    return [newContent];
}

app.use(express.json())
app.use(cookieParser())

// app.use(["/posts","/post"],function(req,res,next){
//     console.log("middleware executed")
//     if(true){
//         return res.status(401).send({"msg":"unauthorized"})
//     }
//     next()
// })

app.get("/posts", function(req,res){
    // fs.readFile("posts.json","utf-8",(err,data)=>{
    //     if(err){
    //         return res.status(404).send("can't read file")
    //     }
    //     const posts = JSON.parse(data)
    //     if( req.query.start<1 || req.query.start>posts.length || req.query.end<1 || req.query.end>posts.length ){
    //         res.status(400).send("Inavlid query parameters")
    //         return
    //     }
    //     const start = parseInt(req.query.start)
    //     const end = parseInt(req.query.end)
    //     // if(req.query.start<1 ){
    //     //     start = 1
    //     // } else if(req.query.start>posts.length){
    //     //     start = posts.length
    //     // } else {
    //     //     start = req.query.start
    //     // }
    //     // let end = req.query.end
    //     // if(req.query.end<1 ){
    //     //     end = 1
    //     // } else if(req.query.end>posts.length){
    //     //     end = posts.length
    //     // } else {
    //     //     end = parseInt(req.query.end)
    //     // }
    //     // console.log(start>end,start,end)
    //     if(start>end){
    //         return res.status(400).send("Start can't be greater than end")
    //     }
    //     const finalPosts = []
    //     for (let i = start-1; i < end; i++) {
    //         const element = posts[i];
    //         finalPosts.push(element)
    //     } 
    //     res.send(finalPosts)
    // })
    Post.find(function(err,data){
        if(err){
            return res.status(500).send("Failed to fetch data")
        }
        res.send(data)
    })
})

app.get("/post/:id", function(req,res){
    console.log(req.params)
    Post.findOne({ id: parseInt(req.params.id) },(err,data)=>{
        if(err){
            return res.status(500).send("Failed to find post")
        }
        if(data==null){
            return res.status(404).send("Post doesn't exist")
        }
        res.send(data)
    })
    // fs.readFile("posts.json","utf-8",(err,data)=>{
    //     if(err){
    //         return res.status(404).send("can't read file")
    //     }
    //     const posts = JSON.parse(data)
    //     const id = req.params.id;
    //     if(id == null || id<1 || id> posts.length){
    //         return res.status(404).send(`Can't find post with id: ${id}`)
    //     }
    //     const post = posts[id-1]
    //     res.send(post)
    // })
})

app.post("/posts",async function(req,res){
    console.log(req.body)
    const title = req.body.title;
    const userId = req.body.userId;
    const body = req.body.body;
    if(title==null || title.match(/^( {1,50})?$/)){
        return res.status(400).send({"msg": "missing title field"})
    }
    if(userId==null || userId.match(/^( {1,50})?$/)){
        return res.status(400).send({"msg": "missing user field"})
    }
    if(body==null || body.match(/^( {1,50})?$/)){
        return res.status(400).send({"msg": "missing content field"})
    }
    const posts = await Post.count()//JSON.parse(fs.readFileSync("posts.json","utf-8"));
    const id = posts+1
    const post = {
        userId: parseInt(userId),
        id: parseInt(id),
        title,
        body
    }
        
    console.log(post)
    // writeToFileDb("posts.json",post)
    // const data = new Post(post)
    // console.log(data)
    // data.save()

    Post.create(post,function(err,data){
        if(err){
            return res.status(500).send("Failed DB entry")
        }
        console.log(data)
        res.send("post created successfully")
    })
})

app.get("/posts/search", (req,res)=>{
    // const title = req.query.title
    Post.find({title: req.query.title}, (err,data)=>{
        if(err){
            return res.status(500).send("DB error")
        }
        res.send(data)
    })
})

app.post("/register",async function(req,res){
    console.log(req.body)
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    let gender = String(req.body.gender)
    gender = gender.toLowerCase()
    const phone = req.body.phone;
    const countryCode = req.body.countryCode;
    let email = String(req.body.email);
    email = email.toLowerCase()
    const password =  req.body.password;
    const dob = req.body.dob;
    if(firstname==null || firstname.match(/^( {1,50})?$/)){
        return res.status(400).send({"msg": "Invalid firstname field"})
    }
    if(lastname==null || lastname.match(/^( {1,50})?$/)){
        return res.status(400).send({"msg": "Invalid lastname field"})
    }
    if(gender==null || (gender!="male" && gender!="female")){
        return res.status(400).send({"msg": "Invalid gender field"})
    }
    if(password==null || password.match(/^( {1,50})?$/)){
        return res.status(400).send({"msg": "Invalid password field"})
    }
    if(email==null || !email.match(/^[a-z][a-z0-9\.\_]{1,50}@[a-z]{5,20}\.[a-z]{2}/)){
        return res.status(400).send({"msg": "Invalid email field"})
    }
    if(phone==null || !phone.match(/^[0-9]{10}$/)){
        return res.status(400).send({"msg": "Invalid phone no field"})
    }
    if(countryCode==null || !countryCode.match(/^[0-9]{3}$/)){
        return res.status(400).send({"msg": "Invalid country code field"})
    }
    if(dob==null || !dob.match(/^[0-9]{4}\-[0-9]{2}\-[0-9]{2}/)){
        return res.status(400).send({"msg": "Invalid DOB field"})
    }
    const users = await User.count()
    const id = users+1
    const user = {
        firstname: firstname,
        id: parseInt(id),
        lastname: lastname,
        gender: gender,
        phone:phone,
        password: bcrypt.hashSync(password,10),
        email: email,
        countryCode: countryCode,
        dob: dob
    }
        
    console.log(user)


    User.create(user,async function(err,data){
        if(err){
            console.log(err)
            return res.status(500).send(err.message)
        }
        console.log(data)
        const token = crypto.randomBytes(32).toString("hex")
        sendRegistrationMail(data.email,token)
        const dbToken = {
            token: token,
            email: data.email,
        }

        RegistrationToken.create(dbToken,(err,data)=>{
            if(err){
                return res.send("Account Created but token failed to save")
            }
            
            res.send("User created successfully")
        })
    })
})

app.post("/login",function(req,res){
    const email = req.body.email;
    const password = req.body.password;
    if(email==null ){
        return res.status(400).send("Email is required")
    }
    if(password==null ){
        return res.status(400).send("Password is required")
    }
    User.findOne({email: email},(err,data)=>{
        if(err){
            return res.status(500).send(err.message)
        }
        if(data==null){
            return res.status(401).send("Invalid email or password")
        }
        if(!bcrypt.compareSync(password,data.password)){
            return res.status(401).send("Invalid email or password")
        }
        console.log(data.email)
        res.cookie("user",data.email,{
            maxAge: 10*60*1000,
            secure: false,
            httpOnly: true,
            sameSite: "strict"
        })
        //send mail
        sendLoginMail(email)
        
        return res.send("Successful")
    })

})

//browser login
app.get("/login",function(req,res){
    const email = req.query.email;
    const password = req.query.password;
    if(email==null ){
        return res.status(400).send("Email is required")
    }
    if(password==null ){
        return res.status(400).send("Password is required")
    }
    User.findOne({email: email},(err,data)=>{
        if(err){
            return res.status(500).send(err.message)
        }
        if(data==null){
            return res.status(401).send("Invalid email or password")
        }
        if(!bcrypt.compareSync(password,data.password)){
            return res.status(401).send("Invalid email or password")
        }
        res.cookie("user",data.email,{
            maxAge: 10*60*1000,
            secure: false,
            httpOnly: true,
            sameSite: "strict"
        })
        //send login mail
        sendLoginMail(email)

        return res.send("successful")
    })

})

app.get("/users",(req,res)=>{
    User.find(function(err,data){
        if(err){
            return res.send("failed to fetch users")
        }
        res.send(data)
    })
})

app.get("/user/verify",(req,res)=>{
    if(!req.query.token || req.query.token==""){
        return res.status(403).send("token required")
    }
    const token = req.query.token
    console.log(token)
    RegistrationToken.find({token: token},(err,data)=>{
        if(err){
            return res.send("Failed to retrieve data")
        }
        if(!data){
            return res.send("can't find token")
        }
        if(data.length<1){
            return res.send("can't find token")
        }
        console.log(data)
        //Write logic to fetch out the email from the data
        // and find the user by email on the token
        // then update the active field to true
        //set the token used field to true 

        return res.send("successful")
    })
})

app.listen(8082, ()=>{
    console.log("express server started")
})