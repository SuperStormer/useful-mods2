#!/usr/bin/env python3
import csv
from modrinth_api import modrinth_api

def main():
	with open("../mods.csv") as f:
		reader = csv.DictReader(f)
		for row in reader:
			if row["modrinth_url"]:
				slug = row["modrinth_url"].split("/")[-1]
				project_data = modrinth_api(f"/project/{slug}")
				try:
					client_side = project_data["client_side"]
					server_side = project_data["server_side"]
				except KeyError as e:
					print(f"{row['name']} is missing a key {e}")
					continue
				valid = False
				match row["side"]:
					case "Both":
						if client_side == "required" and server_side == "required":
							valid = True
					case "Server":
						if client_side =="unsupported" and server_side == "required":
							valid = True
					case "Client":
						if client_side == "required" and server_side == "unsupported":
							valid = True
					case "Client Optional":
						if client_side == "optional" and server_side == "required":
							valid = True
					case "Server Optional":
						if client_side == "required" and server_side == "optional":
							valid = True
					case "Either":
						if client_side == "optional" and server_side == "optional":
							valid = True
				if not valid:
					print(f"{row['name']} - Listed: {row['side']}; Actual: Client {client_side} Server {server_side}")
				
if __name__ == "__main__":
	main()
