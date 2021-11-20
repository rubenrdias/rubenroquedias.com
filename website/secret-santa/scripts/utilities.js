export default class Utilities {
	
	static shuffle(array) {
		for (let i = array.length - 1; i > 0; i--) {
			let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i

			// swap elements array[i] and array[j]
			// we use "destructuring assignment" syntax to achieve that
			// you'll find more details about that syntax in later chapters
			// same can be written as:
			// let t = array[i]; array[i] = array[j]; array[j] = t
			[array[i], array[j]] = [array[j], array[i]];
		}
	}

	static sleep(milliseconds) {
		return new Promise(resolve => setTimeout(resolve, milliseconds));
	}

	static waitForMinimumTime(minimumTimeRequired, startTime) {
		const endTime = new Date();
		const elapsedTime = endTime - startTime;
		const requiredWaitTime = minimumTimeRequired - elapsedTime;

		return this.sleep(requiredWaitTime);
	}

	static objectToJSON(object) {
		return JSON.stringify(object);
	}

	static jsonToObject(json) {
		return JSON.parse(json);
	}

	static setToJSON(set) {
		return JSON.stringify([...set]);
	}

	static jsonToSet(json, type) {
		var jsonObject = this.jsonToObject(json);

		if (type === 'int') {
			jsonObject = jsonObject.map( v => { return parseInt(v) });
		}

		return new Set(jsonObject);
	}

	static mapToJSON(map) {
		return JSON.stringify(Object.fromEntries(map));
	}

	static jsonToMap(json, keyType = 'string') {
		const obj = JSON.parse(json);
		var entries = Object.entries(obj);

		if (keyType !== 'string') {
			entries = entries.map( e => { return this.convertEntryKey(e, keyType) });
		}

		return new Map(entries);
	}

	static jsonToMapOfSet(json, keyType = 'string', setKeyType = 'string') {
		var map = Utilities.jsonToMap(json, keyType);

		map.forEach( (setJSON, mapKey) => {
			const set = Utilities.jsonToSet(setJSON, setKeyType);
			map.set(mapKey, set);
		});

		return map;
	}

	static mapOfSetToJSON(map) {
		var mapCopy = new Map();

		map.forEach( (entryValue, entryKey) => {
			const setJSON = Utilities.setToJSON(entryValue);
			mapCopy.set(entryKey, setJSON);
		});
		
		return Utilities.mapToJSON(mapCopy);
	}

	static convertEntryKey(entry, format) {
		if (format === 'int') {
			entry[0] = parseInt(entry[0]);
			return entry;
		}
		else {
			throw `Unsupported conversion of entry key. (${format})`
		}
	}

}