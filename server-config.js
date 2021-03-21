const express = require('express');
const cookieParser = require('cookie-parser')
const User = require('./models/user-model');
const tokens = require('./utils/tokens');
const mongoose = require('mongoose');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const xssClean = require('xss-clean');
require('dotenv').config();

const serverOptions = (app) => {
	
	app.use(helmet());
	app.use(express.json({ limit: '10kb' }));
	app.use(express.urlencoded({ extended: false }));
	app.use(mongoSanitize());
	app.use(xssClean());
    app.use(morgan('dev'));
	app.use(cookieParser());
	app.use(validateTokens);
}; 

/**
	Checks token validity on each request to the server
 	@param {object} req - the request object
	@param {object} res - the response object
 	@param {function} next - call the next middleware function
**/
const validateTokens = async(req, res, next) => {
	const accessToken = req.cookies['access-token'];
	const refreshToken = req.cookies['refresh-token'];	
	// Unauthorized request
	if(!accessToken && !refreshToken) { 
		req.userId = null;
		return next(); 
	}
	// Check for access token
	try {
		const validAccess = tokens.verifyAccessToken(accessToken);
		req.userId = validAccess.id;
		return next();
	} 
	catch(e) { 
		console.log('access token not found')
	}
	// Check for valid refresh token if access is invalid
	try {
		const validRefresh = tokens.verifyRefreshToken(refreshToken);
		let user;

		// Check if request comes from a registered user
		if(validRefresh.id !== null) {
			const id = new mongoose.Types.ObjectId(validRefresh.id);
			user = await User.findOne(id);
			if(!user) {
				// Invalidate response tokens if user is not found in the db
				res.clearCookie('refresh-token');
				res.clearCookie('access-token');
				return next();
			}
		}
		// Set valid tokens on the response object and set user data on the 
		// request object to validate authenticity. 
		const access = tokens.generateAccessToken(user);
		const refresh = tokens.generateRefreshToken(user);
		res.cookie('refresh-token', refresh, { httpOnly: true , sameSite: 'None', secure: true}); 
		res.cookie('access-token', access, { httpOnly: true , sameSite: 'None', secure: true}); 
		req.userId = user.id;
		req.user = user;
	} 
	catch(e) { return next(); }
	next();
};

module.exports = serverOptions;
