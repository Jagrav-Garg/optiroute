from .openrouter import OpenRouterClient


class ClineClient(OpenRouterClient):
    api_url = "https://api.cline.bot/api/v1"
    catalog_path = "/ai/cline/models"
    provider_name = "Cline"
    api_key_setting = "cline_api_key"

    def normalize_completion(self, result: dict) -> dict:
        if result.get("success") is True and isinstance(result.get("data"), dict):
            return result["data"]
        if result.get("success") is False:
            return {"error": result.get("error", result.get("message", "Cline request failed"))}
        return result

    async def key_info(self) -> dict:
        return {"configured": bool(self.settings.cline_api_key.get_secret_value()),
                "note": "Cline key validity is checked on the first completion; this command does not query account credit."}


def create_model_client(settings, ledger, client) -> OpenRouterClient:
    return ClineClient(settings, ledger, client) if settings.model_provider == "cline" else OpenRouterClient(settings, ledger, client)
