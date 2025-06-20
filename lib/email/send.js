import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST,
	port: process.env.EMAIL_PORT,
	secure: process.env.EMAIL_SECURE === 'true',
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS
	}
});

export default async function sendEmail (to, subject, body) {

	if (!process.env.EMAIL_HOST) {
		return console.warn('process.env.EMAIL_HOST not set, skipping email send');
	}

	const mailOptions = {
		from: process.env.EMAIL_FROM, //noreply, same as email_user atm
		to,
		subject: `${process.env.EMAIL_SUBJECT_PREFIX || ''}${subject}`,
		text: body
	};

	try {
		if (process.env.EMAIL_ENABLED === 'true') {
			await transporter.sendMail(mailOptions);
		} else {
			console.warn('process.env.EMAIL_ENABLED !== "true" email not sent. mailOptions:', mailOptions);
		}
	} catch (error) {
		console.error('Error sending email:', error);
	}

}
