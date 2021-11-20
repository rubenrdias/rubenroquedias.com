import Utilities from "../scripts/utilities.js";

export default class LocalStorage {
	
	constructor() {}

	save(key, value) {
		window.localStorage.setItem(key, value);
	}

	get(key) {
		return window.localStorage.getItem(key);
	}

	getInt(key) {
		return parseInt(window.localStorage.getItem(key));
	}

	saveObject(key, object) {
		const json = Utilities.objectToJSON(object);
		window.localStorage.setItem(key, json);
	}

	getObject(key) {
		const json = window.localStorage.getItem(key);
		return Utilities.jsonToObject(json);
	}

	saveMap(key, map) {
		const json = Utilities.mapToJSON(map);
		window.localStorage.setItem(key, json);
	}

	getMap(key, keyType = 'string') {
		const json = window.localStorage.getItem(key);
		return Utilities.jsonToMap(json, keyType);
	}

	saveMapOfSet(key, map) {
		const mapOfSetJSON = Utilities.mapOfSetToJSON(map);
		window.localStorage.setItem(key, mapOfSetJSON);
	}

	getMapOfSet(key, keyType = 'string', setKeyType = 'string') {
		const mapJSON = window.localStorage.getItem(key);
		return Utilities.jsonToMapOfSet(mapJSON, keyType, setKeyType);
	}

	delete(key) {
		window.localStorage.delete(key);
	}

	deleteAll() {
		window.localStorage.clear();
	}
}