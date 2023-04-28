import csv
import json
from cf_api import GAME_ID, CLASS_ID, MODLOADERS, cf_api
from modrinth_api import modrinth_api

CF_REMOVED = ["Sodium", "Iris"]

def get_cf_data(row):
	"""fetches version/author data from CF API"""
	slug = row["cf_url"].split("/")[-1]
	print(slug)
	search_data = cf_api(
		"/v1/mods/search", params={
		"gameId": GAME_ID,
		"classId": CLASS_ID,
		"slug": slug
		}
	)
	if not search_data:
		print(f"{row['name']!r} has no CF data")
		return None
	else:
		mod_data = search_data[0]
		# If a file has multiple supported versions, there's an entry for each version in latestFilesIndexes
		versions = list(
			set(
			(file["gameVersion"], MODLOADERS[file.get("modLoader", 1)])
			for file in mod_data["latestFilesIndexes"]
			)
		)
		author = mod_data["authors"][0]["name"]
	return (versions, author)

def get_modrinth_data(row):
	"""fetches version/author data from Modrinth API"""
	slug = row["modrinth_url"].split("/")[-1]
	version_data = modrinth_api(f"/project/{slug}/version")
	versions = list(
		set(
		(mc_version, loader) for mod_version in version_data
		for mc_version in mod_version["game_versions"] for loader in mod_version["loaders"]
		)
	)
	author = modrinth_api("/user/" + version_data[0]["author_id"])["name"]
	return (versions, author)

with open("../mods.csv") as f:
	reader = csv.DictReader(f)
	out = []
	unique_mods = set()
	for row in reader:
		
		if (row["cf_url"], row["modrinth_url"]) in unique_mods:
			print(f"{row['name']} is duplicated")
		
		# fetch version/author data
		if row["cf_url"] and row["name"] not in CF_REMOVED:
			data = get_cf_data(row)
			if data is None:
				if row["modrinth_url"]:
					data = get_modrinth_data(row)
				else:
					print(f"{row['name']!r} has no CF or Modrinth url")
					data = ([], "")
		elif row["modrinth_url"]:
			data = get_modrinth_data(row)
		else:
			print(f"{row['name']!r} has no CF or Modrinth url")
			data = ([], "")
		row["versions"], row["author"] = data
		
		row["type"] = row["type"].split(",")
		row["bad"] = 0 if not row["bad"] else int(row["bad"])
		
		unique_mods.add((row["cf_url"], row["modrinth_url"]))
		out.append(row)

with open("../mods.json", "w") as f:
	json.dump(out, f, separators=(',', ':'))
