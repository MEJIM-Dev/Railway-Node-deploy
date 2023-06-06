const nodemailer = require("nodemailer")

function currentTimestamp(){
    return new Date();
}

const mailer = nodemailer.createTransport({
    //mailtrap.io
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "e9a64b4fa7f77f",
        pass: "93d06803ea49c9"
    }
})

function sendLoginMail(email){
    const mail = {
        from: "MyApp@mail.com",
        to: String(email),
        subject: "Login Notifcation",
        text: `Someone logged into your mail at: ${new Date()}`,
        // html: "<img src="asjhsajajsash"/>"
    }
    mailer.sendMail(mail,(err,data)=>{
        if(err){
            console.log("failed to send mail",err)
            return
        }
        if(!data.accepted || data.accepted.length<1){
            console.log("failed to deliver mail",data)
            return
        }
        console.log(data)                
    })
}

async function sendRegistrationMail(email,token){
    console.log(token)
    const mail = {
        from: "MyApp@mail.com",
        to: String(email),
        subject: "Complete your Registration",
        // text: `Someone logged into your mail at: ${new Date()}`,
        html: `
            <html>
                <head>
                </head>
                <body>
                    <h1 >Click on the link below to complete your Registration</h1>
                    <a href="http://localhost:8082/user/verify?token=${token}">Click here</a>
                </body>
            </html>
        `
    }
    mailer.sendMail(mail,(err,data)=>{
        if(err){
            console.log("failed to send mail",err)
            return
        }
        if(!data.accepted || data.accepted.length<1){
            console.log("failed to deliver mail",data)
            return
        }
        console.log(data)             
    })
}

module.exports = {
    currentTimestamp,
    sendLoginMail,
    sendRegistrationMail
}