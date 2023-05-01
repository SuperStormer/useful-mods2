(async function () {
	let mods = await (await fetch("mods.json")).json();
	let sides_map = {
		all: ["Client", "Server", "Either", "Server Optional", "Client Optional", "Both"],
		clientonly: ["Client", "Either", "Server Optional"],
		serveronly: ["Server", "Either", "Client Optional"],
	};
	let modloader_dropdown = document.getElementById("modloader");
	let version_dropdown = document.getElementById("version");
	let type_dropdown = document.getElementById("type");
	let side_dropdown = document.getElementById("side");
	let status_dropdown = document.getElementById("status");
	let dropdowns = [
		modloader_dropdown,
		version_dropdown,
		type_dropdown,
		side_dropdown,
		status_dropdown,
	];
	let results_body = document.getElementById("results-body");
	let version_search = document.getElementById("advanced-version");
	function update_params(modloader, version, type, side, status) {
		history.pushState(
			{},
			"",
			"?" + new URLSearchParams({ modloader, version, type, side, status })
		);
	}
	function update_table(modloader, version, type, sides, status) {
		results_body.innerHTML = "";

		let results = mods
			.filter(
				(mod) =>
					mod.versions.some((v) => v[0] === version && v[1] === modloader) &&
					mod.type.includes(type) &&
					sides.includes(mod.side) &&
					(mod.status === 0 || mod.status >= status)
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
			if (result["status"] === 1 || result["status"] === 2) {
				let img = document.createElement("img");
				img.title = result["status"] === 1 ? "Replaced by other mods" : "Not recommended";
				img.src = "images/error.svg";
				name_container.append(img);
			} else if (result["status"] === 3) {
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

	function get_dropdown_values() {
		return dropdowns.map((dropdown) => dropdown.selectedOptions[0]?.value ?? dropdown.value);
	}

	function set_dropdown_values(...values) {
		if (values.length !== dropdowns.length) {
			throw new Error(
				`values.length (${values.length}) !== dropdowns.length (${dropdowns.length})`
			);
		}
		for (let i = 0; i < dropdowns.length; i++) {
			dropdowns[i].value = values[i];
		}
	}

	function on_dropdown_change() {
		let [modloader, version, type, side, status] = get_dropdown_values();
		let sides = sides_map[side];
		status = parseInt(status, 10);

		update_table(modloader, version, type, sides, status);
		update_params(modloader, version, type, side, status);
	}

	function main() {
		let params = new URLSearchParams(window.location.search);
		let modloader = params.get("modloader") || "Forge";
		let version = params.get("version") || "1.19.3";
		let type = params.get("type") || "performance";
		let side = params.get("side") || "all";
		let status = parseInt(params.get("status") || 3, 10);

		set_dropdown_values(modloader, version, type, side, status);

		let sides = sides_map[side] || side;
		update_table(modloader, version, type, sides, status);

		for (let dropdown of dropdowns) {
			dropdown.addEventListener("change", on_dropdown_change);
		}

		version_search.addEventListener("change", function () {
			let [modloader, _, type, side, status] = get_dropdown_values();
			let sides = sides_map[side];

			let version = version_search.value;
			version_dropdown.value = version;

			update_table(modloader, version, type, sides, status);
			update_params(modloader, version, type, side, status);
		});
	}
	main();
})();
