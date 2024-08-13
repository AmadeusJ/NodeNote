export function sanitizeNodeName(string) {
	let entityMap = {
	'&': '',
	'<': '',
	'>': '',
	'"': '',
	"'": '',
	'`': '',
	'=': ''
	};
	return String(string).replace(/[&<>"'`=]/g, function fromEntityMap (s) {
		return entityMap[s];
	});
}

