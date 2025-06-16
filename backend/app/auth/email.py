import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import settings
import secrets
from datetime import datetime, timedelta

class EmailService:
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL

    def send_verification_email(self, to_email: str, verification_token: str, username: str):
        verification_url = f"{settings.BASE_URL}/auth/verify-email?token={verification_token}"
        
        html_content = f"""
        <html>
        <body>
            <h2>Welcome to Luminara Systems, {username}!</h2>
            <p>Thank you for signing up. Please verify your email address by clicking the link below:</p>
            <p><a href="{verification_url}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">Verify Email Address</a></p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>{verification_url}</p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account with us, please ignore this email.</p>
            <br>
            <p>Best regards,<br>The Luminara Systems Team</p>
        </body>
        </html>
        """
        
        text_content = f"""
        Welcome to Luminara Systems, {username}!
        
        Thank you for signing up. Please verify your email address by visiting:
        {verification_url}
        
        This verification link will expire in 24 hours.
        
        If you didn't create an account with us, please ignore this email.
        
        Best regards,
        The Luminara Systems Team
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Verify Your Email - Luminara Systems"
        msg["From"] = self.from_email
        msg["To"] = to_email

        text_part = MIMEText(text_content, "plain")
        html_part = MIMEText(html_content, "html")

        msg.attach(text_part)
        msg.attach(html_part)

        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

email_service = EmailService()
