import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST,
	port: process.env.EMAIL_PORT,
	secure: process.env.EMAIL_SECURE === 'true',
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS
	}
});

export default async function sendEmail(to, subject, body) {

	const mailOptions = {
		from: process.env.EMAIL_FROM, //noreply, same as email_user atm
		to,
		subject,
		text: body
	};

	try {
		await transporter.sendMail(mailOptions);
	} catch (error) {
		console.error('Error sending email:', error);
	}

}
