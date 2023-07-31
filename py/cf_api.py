import requests

# I'm assuming this is safe because ferium does it ¯\_(ツ)_/¯
# https://github.com/gorilla-devs/ferium/blob/0304b528b4654dfc920ed7105f9e1c2ee8e507a1/src/main.rs#L117
API_KEY = "$2a$10$3kFa9lBWciEK.lsp7NyCSupZ3XmlAYixZQ9fTczqsz1/.W9QDnLUy"
GAME_ID = 432
CLASS_ID = 6
MODLOADERS = {0: "Any", 1: "Forge", 4: "Fabric", 5: "Quilt", 6: "NeoForge"}

def cf_api(endpoint: str, params=None, **kwargs):
	kwargs = {
		"method": "GET",
		"url": "https://api.curseforge.com/" + endpoint.removeprefix("/"),
		"params": params,
		"headers": {
		"x-api-key": API_KEY,
		"accept": "application/json"
		},
		"timeout": 5,
		**kwargs
	}
	return requests.request(**kwargs).json()["data"]
