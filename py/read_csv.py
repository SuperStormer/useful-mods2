#!/usr/bin/env python3
import csv
import json
from cf_api import GAME_ID, CLASS_ID, MODLOADERS as CF_MODLOADERS, cf_api
from modrinth_api import modrinth_api, MODLOADERS as MODRINTH_MODLOADERS

# list of mods that removed files or no longer push updates to CF but still have a CF page
# so that we can fetch version data from Modrinth instead
CF_REMOVED = ["Sodium", "Iris Shaders", "Mod Menu", "More Culling", "Lithium", "MemoryLeakFix"]

def get_cf_versions(row):
	"""fetches version data from CF API"""
	slug = row["cf_url"].split("/")[-1]
	search_data = cf_api(
		"/v1/mods/search", params={
		"gameId": GAME_ID,
		"classId": CLASS_ID,
		"slug": slug
		}
	)
	if not search_data:
		warn(f"{row['name']!r} has no CF data")
		return None
	else:
		mod_data = search_data[0]
		# If a file has multiple supported versions, there's an entry for each version in latestFilesIndexes
		versions = list(
			set(
			(file["gameVersion"], CF_MODLOADERS[file.get("modLoader", 1)])
			for file in mod_data["latestFilesIndexes"]
			)
		)
	return versions

def warn(s, *args, **kwargs):
	print(f"\033[33;1m{s}\033[0m", *args, **kwargs)

def get_modrinth_versions(row):
	"""fetches version data from Modrinth API"""
	slug = row["modrinth_url"].split("/")[-1]
	version_data = modrinth_api(f"/project/{slug}/version")
	versions = list(
		set(
		(mc_version, loader.title()) for mod_version in version_data
		for mc_version in mod_version["game_versions"]
		for loader in mod_version["loaders"] if loader in MODRINTH_MODLOADERS
		)
	)
	return versions

def main():
	with open("../mods.csv") as f:
		reader = csv.DictReader(f)
		out = []
		unique_mods = set()
		for row in reader:
			print(row["name"])
			if row["cf_url"] == "none":
				row["cf_url"] = ""
			if row["modrinth_url"] == "none":
				row["modrinth_url"] = ""
			
			if (row["cf_url"], row["modrinth_url"], row["github_url"]) in unique_mods:
				warn(f"{row['name']} is duplicated")
			
			# fetch version/author data
			if row["manual_versions"]:
				try:
					versions = json.loads(row["manual_versions"])
					url = row["github_url"]
				except ValueError:
					warn(
						f"{row['name']!r} has invalid manual_versions data: {row['manual_versions']!r}"
					)
					versions = []
					url = ""
			elif row["cf_url"] and row["name"] not in CF_REMOVED:
				versions = get_cf_versions(row)
				url = row["cf_url"]
				if versions is None:
					if row["modrinth_url"]:
						versions = get_modrinth_versions(row)
						url = row["modrinth_url"]
					else:
						warn(f"{row['name']!r} has no CF or Modrinth data")
						versions = []
						url = ""
			elif row["modrinth_url"]:
				versions = get_modrinth_versions(row)
				url = row["modrinth_url"]
			else:
				warn(f"{row['name']!r} has no CF or Modrinth url")
				versions = []
				url = ""
			row["versions"] = versions
			row["url"] = url
			
			row["type"] = row["type"].split(",")
			row["status"] = 0 if not row["status"] else int(row["status"])
			
			unique_mods.add((row["cf_url"], row["modrinth_url"], row["github_url"]))
			out.append(row)
	
	with open("../web/mods.json", "w") as f:
		json.dump(out, f, separators=(',', ':'))

if __name__ == "__main__":
	main()
