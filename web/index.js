(async function () {
	let mods = await (await fetch("mods.json")).json();
	let sides_map = {
		all: ["Client", "Server", "Either", "Server Optional", "Client Optional", "Both"],
		clientonly: ["Client", "Either", "Server Optional"],
		serveronly: ["Server", "Either", "Client Optional"],
	};
	let version_dropdown = document.getElementById("version");
	let modloader_dropdown = document.getElementById("modloader");
	let type_dropdown = document.getElementById("type");
	let side_dropdown = document.getElementById("side");
	let results_body = document.getElementById("results-body");
	let version_search = document.getElementById("advanced-version");
	function update_params(modloader, version, type, side) {
		history.pushState({}, "", "?" + new URLSearchParams({ modloader, version, type, side }));
	}
	function update_table(modloader, version, type, sides) {
		results_body.innerHTML = "";

		let results = mods
			.filter(
				(mod) =>
					mod.versions.some((v) => v[0] === version && v[1] === modloader) &&
					mod.type.includes(type) &&
					sides.includes(mod.side)
			)
			.sort((a, b) => a.name.localeCompare(b.name));

		for (let result of results) {
			let row = document.createElement("tr");

			let name_cell = document.createElement("td");
			let name_container = document.createElement("div");
			name_container.className = "name-container";
			let name_link = document.createElement("a");
			name_link.textContent = result["name"];
			name_link.href = result["cf_url"] || result["modrinth_url"];
			name_container.append(name_link);
			if (result["cf_url"]) {
				let link = document.createElement("a");
				link.href = result["cf_url"];
				let img = document.createElement("img");
				img.src = "images/curseforge.png";
				link.append(img);
				name_container.append(link);
			}
			if (result["modrinth_url"]) {
				let link = document.createElement("a");
				link.href = result["modrinth_url"];
				let img = document.createElement("img");
				img.src = "images/modrinth.png";
				link.append(img);
				name_container.append(link);
			}

			// 1 = replaced by other mods, 2 = not recommended, 3 = use with caution
			if (result["bad"] === 1) {
				// TODO option for showing all, regardless of status
				continue;
			} else if (result["bad"] === 2) {
				let img = document.createElement("img");
				img.title = "Not recommended";
				img.src = "images/error.svg";
				name_container.append(img);
			} else if (result["bad"] === 3) {
				let img = document.createElement("img");
				img.title = "Use with caution";
				img.src = "images/warning.svg";
				name_container.append(img);
			}
			name_cell.append(name_container);
			row.append(name_cell);

			for (let key of ["description", "side", "incompat", "notes"]) {
				let cell = document.createElement("td");
				cell.textContent = result[key];
				row.append(cell);
			}
			results_body.append(row);
		}
	}

	function on_dropdown_change() {
		let modloader = modloader_dropdown.value;
		let version = version_dropdown.value;
		let type = type_dropdown.selectedOptions[0].value;
		let side = side_dropdown.selectedOptions[0].value;
		let sides = sides_map[side];

		update_table(modloader, version, type, sides);
		update_params(modloader, version, type, side);
	}
	function main() {
		let params = new URLSearchParams(window.location.search);
		let modloader = params.get("modloader") || "Forge";
		let version = params.get("version") || "1.19.3";
		let type = params.get("type") || "performance";
		let side = params.get("side") || "all";
		modloader_dropdown.value = modloader;
		version_dropdown.value = version;
		type_dropdown.value = type;
		side_dropdown.value = side;
		let sides = sides_map[side] || side;
		update_table(modloader, version, type, sides);

		version_dropdown.addEventListener("change", on_dropdown_change);
		modloader_dropdown.addEventListener("change", on_dropdown_change);
		type_dropdown.addEventListener("change", on_dropdown_change);
		side_dropdown.addEventListener("change", on_dropdown_change);
		version_search.addEventListener("change", function () {
			let modloader = modloader_dropdown.value;
			let version = version_search.value;
			let type = type_dropdown.selectedOptions[0].value;
			let side = side_dropdown.selectedOptions[0].value;
			let sides = sides_map[side];

			version_dropdown.value = version;
			update_table(modloader, version, type, sides);
			update_params(modloader, version, type, side);
		});
	}
	main();
})();
