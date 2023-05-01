# fills in CF/Modrinth URLs in the CSV
import csv
from cf_api import GAME_ID, CLASS_ID, cf_api
from modrinth_api import modrinth_api

def main():
	with open("../mods.csv") as f:
		reader = csv.DictReader(f)
		fieldnames = reader.fieldnames
		assert fieldnames is not None
		out = []
		for row in reader:
			name = row["name"]
			if not row["cf_url"]:
				search_data = cf_api(
					"/v1/mods/search", {
					"gameId": GAME_ID,
					"classId": CLASS_ID,
					"searchFilter": name,
					"sortField": 6,
					"sortOrder": "desc"
					}
				)
				if len(search_data) > 0:
					try:
						mod_data = next(mod for mod in search_data if name in mod["name"])
						row["cf_url"] = mod_data["links"]["websiteUrl"]
					except StopIteration:
						print(f"{name!r} is missing CF url")
				else:
					print(f"{name!r} is missing CF url")
			if not row["modrinth_url"]:
				search_data = modrinth_api(
					"/search", {
					"query": name,
					"facets": '[["project_type:mod"]]',
					"index": "relevance"
					}
				)["hits"]
				if len(search_data) > 0:
					try:
						mod_data = next(mod for mod in search_data if name in mod["title"])
						row["modrinth_url"] = f"https://modrinth.com/mod/{mod_data['slug']}"
					except StopIteration:
						print(f"{name!r} is missing Modrinth url")
				else:
					print(f"{name!r} is missing Modrinth url")
			out.append(row)
	
	with open("../output.csv", "w") as f:
		writer = csv.DictWriter(f, fieldnames=fieldnames)
		writer.writeheader()
		writer.writerows(out)

if __name__ == "__main__":
	main()