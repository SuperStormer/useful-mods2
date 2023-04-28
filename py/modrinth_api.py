import requests

def modrinth_api(endpoint: str, params=None, **kwargs):
	kwargs = {
		"method": "GET",
		"url": "https://api.modrinth.com/v2/" + endpoint.removeprefix("/"),
		"params": params,
		"headers": {
		"User-Agent": "SuperStormer123/useful-mods",
		"accept": "application/json"
		},
		"timeout": 5,
		**kwargs
	}
	return requests.request(**kwargs).json()
