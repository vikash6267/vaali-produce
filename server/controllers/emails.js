const mailSender = require("../utils/mailSender");


exports.priceListSend = async (req, res) => {
  try {
      console.log(req.body);
      
      const { data, subject, message, cc, bcc } = req.body;
      const file = req.files?.attachments;

      const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background: #ffffff;">
        <h2 style="color: #333; text-align: center;">📜 Your Price List is Ready!</h2>
        <p style="color: #555; text-align: center; font-size: 16px;">Hello, we have attached the latest price list for you. You can download the PDF or check our online store.</p>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="http://localhost:3000/store/template?storeId=1234&templateId=${message}" 
             style="display: inline-block; background: #007bff; color: white; padding: 12px 20px; font-size: 16px; border-radius: 5px; text-decoration: none;">
            View Online
          </a>
        </div>

       

       

        <p style="color: #666; font-size: 14px; text-align: center;">If you have any questions, feel free to contact us.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

        <p style="color: #888; font-size: 12px; text-align: center;">This is an automated email, please do not reply.</p>
      </div>
    `;

      const response = await mailSender(data, subject, html, file, cc, bcc);

      console.log(response);
      return res.status(200).json({
          success: true,
          message: "Message Sent Successfully!"
      });
  } catch (error) {
      console.log(error);
      return res.status(500).json({
          success: false,
          message: "Error in sending email"
      });
  }
}
