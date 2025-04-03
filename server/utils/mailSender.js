const nodemailer = require("nodemailer")
const fs = require("fs");

const mailSender = async (email, subject, message, file, cc, bcc) => {
  try {
    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      secure: false,
    })

    // let info = await transporter.sendMail({
    //   from: `"Vali" <${process.env.MAIL_USER}>`, // sender address
    //   to: `${email}`, // list of receivers
    //   subject: `${title}`, // Subject line
    //   html: `${body}`, // html body
    // })
    // console.log(info.response)
    // return info

    const fileBuffer = fs.readFileSync(file.tempFilePath);

    
      let mailOptions = {
        from: "vikasmaheshwari6267@gmail.com",
        to: email,
        cc: cc || "", // Optional
        bcc: bcc || "", // Optional
        subject: subject,
        html: message,
        attachments: [
          {
            filename: file.name,
            content: fileBuffer,
            contentType: file.mimetype || "application/pdf",
          },
        ],
      };
    
      let info = await transporter.sendMail(mailOptions);
      console.log("Email sent: " + info.response);
 
    

  } catch (error) {
    console.log(error.message)
    return error.message
  }
}

module.exports = mailSender
