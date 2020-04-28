function responseJSON(res, obj, status) {
	res.status(status);
	res.json(obj);
	res.send();
}

function responseError(res, err, status) {
	if (typeof(status) == 'undefined') {
		status = 400;
	}
	res.status(status);
	res.json({error: err});
	res.send();
}

function responseInt(cb, err, data, code) {
	cb.call(this, err, data, code);
	return false;
}

module.exports = {
	responseJSON: responseJSON,
	responseError: responseError,
	responseInt: responseInt
}
