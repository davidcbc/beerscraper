'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	request = require('request'),
	cheerio = require('cheerio'),
	errorHandler = require('./errors.server.controller'),
	Bar = mongoose.model('Bar'),
	Beer = mongoose.model('Beer'),
	_ = require('lodash');

/**
 * Create a Bar
 */
exports.create = function(req, res) {
	var bar = new Bar(req.body);
	bar.user = req.user;

	request(bar.url, function(error,response, html) {
		if(!error) {
			var $ = cheerio.load(html);
			$('.on_tap').find('a').each(function(idx,li) {
				var newBeer = new Beer({name:$(li).text()});
				var untappdSearchString = newBeer.name.replace(/ /g,'+');
				var untappdUrl = 'https://untappd.com/search?q=' + untappdSearchString;
				request(untappdUrl, function(error,response,html) {
					if (!error) {
						var $ = cheerio.load(html);
						var rating = $('.results-container').find('.rating').find('.num').first().text();
						rating = rating.substr(1, rating.length - 2);
						newBeer.rating = rating;
						newBeer.save();
					}
				});

			});

		}
	});
	bar.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(bar);
		}
	});
};

/**
 * Show the current Bar
 */
exports.read = function(req, res) {
	res.jsonp(req.bar);
};

/**
 * Update a Bar
 */
exports.update = function(req, res) {
	var bar = req.bar ;

	bar = _.extend(bar , req.body);

	bar.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(bar);
		}
	});
};

/**
 * Delete an Bar
 */
exports.delete = function(req, res) {
	var bar = req.bar ;

	bar.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(bar);
		}
	});
};

/**
 * List of Bars
 */
exports.list = function(req, res) { 
	Bar.find().sort('-created').populate('user', 'displayName').exec(function(err, bars) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(bars);
		}
	});
};

/**
 * Bar middleware
 */
exports.barByID = function(req, res, next, id) { 
	Bar.findById(id).populate('user', 'displayName').exec(function(err, bar) {
		if (err) return next(err);
		if (! bar) return next(new Error('Failed to load Bar ' + id));
		req.bar = bar ;
		next();
	});
};

/**
 * Bar authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.bar.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
