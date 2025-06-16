import httpx
from authlib.integrations.httpx_client import AsyncOAuth2Client
from ..config import settings

class GitHubOAuth:
    def __init__(self):
        self.client_id = settings.GITHUB_CLIENT_ID
        self.client_secret = settings.GITHUB_CLIENT_SECRET
        self.redirect_uri = f"{settings.BASE_URL}/auth/github/callback"
        self.authorize_url = "https://github.com/login/oauth/authorize"
        self.token_url = "https://github.com/login/oauth/access_token"
        self.user_url = "https://api.github.com/user"
        self.user_emails_url = "https://api.github.com/user/emails"

    def get_authorize_url(self, state: str = None):
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "user:email",
        }
        if state:
            params["state"] = state
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{self.authorize_url}?{query_string}"

    async def get_access_token(self, code: str):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "redirect_uri": self.redirect_uri,
                },
                headers={"Accept": "application/json"}
            )
            return response.json()

    async def get_user_info(self, access_token: str):
        headers = {
            "Authorization": f"token {access_token}",
            "Accept": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            # Get user info
            user_response = await client.get(self.user_url, headers=headers)
            user_data = user_response.json()
            
            # Get user emails
            emails_response = await client.get(self.user_emails_url, headers=headers)
            emails_data = emails_response.json()
            
            # Find primary email
            primary_email = None
            for email in emails_data:
                if email.get("primary") and email.get("verified"):
                    primary_email = email["email"]
                    break
            
            return {
                "id": str(user_data["id"]),
                "username": user_data["login"],
                "email": primary_email,
                "provider": "github"
            }

class DiscordOAuth:
    def __init__(self):
        self.client_id = settings.DISCORD_CLIENT_ID
        self.client_secret = settings.DISCORD_CLIENT_SECRET
        self.redirect_uri = f"{settings.BASE_URL}/auth/discord/callback"
        self.authorize_url = "https://discord.com/api/oauth2/authorize"
        self.token_url = "https://discord.com/api/oauth2/token"
        self.user_url = "https://discord.com/api/users/@me"

    def get_authorize_url(self, state: str = None):
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "identify email",
        }
        if state:
            params["state"] = state
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{self.authorize_url}?{query_string}"

    async def get_access_token(self, code: str):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": self.redirect_uri,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            return response.json()

    async def get_user_info(self, access_token: str):
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.user_url, headers=headers)
            user_data = response.json()
            
            return {
                "id": str(user_data["id"]),
                "username": user_data["username"],
                "email": user_data.get("email"),
                "provider": "discord"
            }

# Initialize OAuth clients
github_oauth = GitHubOAuth()
discord_oauth = DiscordOAuth()
