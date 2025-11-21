const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendPriceAlert(email, product) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Price Alert: ${product.name}`,
      html: `
        <h2>Price Drop Alert!</h2>
        <p><strong>${product.name}</strong> has dropped to <strong>$${product.currentPrice}</strong></p>
        <p>Your target price: $${product.targetPrice}</p>
        <p><a href="${product.url}">View on Amazon</a></p>
        <img src="${product.imageUrl}" alt="${product.name}" style="max-width: 200px;" />
      `
    });
    console.log(`Alert sent to ${email} for ${product.name}`);
  } catch (error) {
    console.error('Email error:', error.message);
  }
}

module.exports = { sendPriceAlert };