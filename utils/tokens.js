const jwt = require("jsonwebtoken");
require('dotenv').config();
const { REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET } = process.env;

const generateAccessToken = (user) => {
	return jwt.sign(
		{ id: user.id },
		ACCESS_TOKEN_SECRET,
		{ expiresIn: "1h" }
	);
};

 const generateRefreshToken = (user) => {
	return jwt.sign(
		{ id: user.id },
		REFRESH_TOKEN_SECRET,
		{ expiresIn: "7d" }
	);
};

const verifyAccessToken = (token) => {
	try {
		return jwt.verify(token, ACCESS_TOKEN_SECRET);
	}
	catch(e) {
		return null;
	}
};

 const verifyRefreshToken = (token) => {
	try {
		return jwt.verify(token, REFRESH_TOKEN_SECRET);
	}
	catch(e) {
		return null;
	}
};
module.exports = {generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken}