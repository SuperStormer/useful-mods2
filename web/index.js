(async function () {
	let mods = await (
		await fetch("mods.json", {
			credentials: "include",
			mode: "no-cors",
		})
	).json();
	let SIDES_MAP = {
		all: ["Client", "Server", "Either", "Server Optional", "Client Optional", "Both"],
		clientonly: ["Client", "Either", "Server Optional"],
		serveronly: ["Server", "Either", "Client Optional"],
	};
	const CF_REMOVED = [
		"Sodium",
		"Iris Shaders",
		"Mod Menu",
		"More Culling",
		"Lithium",
		"MemoryLeakFix",
	];

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
	let settings_container = document.getElementById("settings-container");
	let settings_checkboxes = settings_container.querySelectorAll("input[type=checkbox]");
	let settings_button = document.getElementById("settings-button");
	let settings = JSON.parse(localStorage.getItem("settings")) ?? {
		modrinth_url: false,
		legacy_cf_url: false,
	};

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
			if (settings["legacy_cf_url"]) {
				let cf_url = new URL(result["cf_url"]);
				cf_url.hostname = "legacy.curseforge.com";
				result["cf_url"] = cf_url.toString();
			}

			let row = document.createElement("tr");

			let name_cell = document.createElement("td");
			let name_container = document.createElement("div");
			name_container.className = "name-container";

			let name_link = document.createElement("a");
			name_link.textContent = result["name"];
			let url;
			if (settings["modrinth_url"]) {
				url = result["modrinth_url"] || result["cf_url"] || result["github_url"];
			} else if (result["cf_url"] && !CF_REMOVED.includes(result["name"])) {
				url = result["cf_url"];
			} else {
				url = result["modrinth_url"] || result["github_url"];
			}
			if (!url) {
				console.warn(`${result["name"]} has no URL`);
				console.log(result["cf_url"]);
			}
			name_link.href = url;
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

			// 1 = replaced by other mods, 2 = strongly not recommended, 3 = not recommended, 4 = use with caution
			if (result["status"] === 4) {
				let img = document.createElement("img");
				img.title = "Use with caution";
				img.src = "images/warning.svg";
				name_container.append(img);
			} else if (result["status"] > 0) {
				let img = document.createElement("img");
				img.title = {
					1: "Replaced by other mods",
					2: "Strongly not recommended",
					3: "Not recommended",
				}[result["status"]];
				img.src = "images/error.svg";
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

	function on_dropdown_change(event) {
		let [modloader, version, type, side, status] = get_dropdown_values();
		let sides = SIDES_MAP[side];
		status = parseInt(status, 10);

		if (event.target !== version_dropdown) {
			version = version_search.value || version;
		} else {
			version_search.value = "";
		}

		update_table(modloader, version, type, sides, status);
		update_params(modloader, version, type, side, status);
	}

	function main() {
		let params = new URLSearchParams(window.location.search);
		let modloader = params.get("modloader") || "Forge";
		let version = params.get("version") || "1.20.1";
		let type = params.get("type") || "performance";
		let side = params.get("side") || "all";
		let status = parseInt(params.get("status") || 4, 10);

		set_dropdown_values(modloader, version, type, side, status);

		let sides = SIDES_MAP[side] || side;
		update_table(modloader, version, type, sides, status);

		for (let dropdown of dropdowns) {
			dropdown.addEventListener("change", on_dropdown_change);
		}

		version_search.addEventListener("change", function () {
			let [modloader, version, type, side, status] = get_dropdown_values();
			let sides = SIDES_MAP[side];

			version = version_search.value;
			version_dropdown.value = version;

			update_table(modloader, version, type, sides, status);
			update_params(modloader, version, type, side, status);
		});

		settings_button.addEventListener("click", function () {
			settings_container.classList.toggle("settings-visible");
		});

		for (let checkbox of settings_checkboxes) {
			checkbox.checked = settings[checkbox.name];
			checkbox.addEventListener("change", function (event) {
				settings[event.target.name] = event.target.checked;
				localStorage.setItem("settings", JSON.stringify(settings));
			});
		}
	}
	main();
})();
