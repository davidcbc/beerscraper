var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Bar = mongoose.model('Bar');
var Beer = mongoose.model('Beer');
var Category = mongoose.model('Category');
var request = require('request');
var	cheerio = require('cheerio');
var config = require('../config');
var async = require('async');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/bars', function(req, res, next) {
  Bar.find(function(err, bars){
    if(err){ return next(err); }

    res.json(bars);
  });
});
router.get('/untappd', function(req, res, next) {
    var code = req.query.code;
    console.log(req.query);
    var loginUrl = 'https://untappd.com/oauth/authorize/?client_id=' +
        config.untappd.clientid + '&client_secret=' +
        config.untappd.clientsecret + '&response_type=code&redirect_url=http://localhost:3000/untappd&code=' +
        code;
    console.log(loginUrl);
    request.get(loginUrl, function(error,response, data) {
        var respData = JSON.parse(data);
        //var accessToken = respData.response.access_token;
        console.log(data);
        res.redirect('/');
    });
});
router.post('/bars', function(req, res, next) {
    var bar = new Bar(req.body);
    request(bar.link, function(error,response, html) {
		if(!error) {

			var $ = cheerio.load(html);
            $('#beer_menu').find('.beeronmenu').each(function(idx,li) {
                var newCategory = new Category({name:$(li).text().trim()});
                var test = $(li).parent().parent().parent().find('a').each(function(idx,li) {
                    var newBeer = new Beer({name:$(li).text().trim()});
                    newBeer.save();
                    newCategory.beers.push(newBeer);
                });
                newCategory.save();
                bar.categories.push(newCategory);
            });
            bar.save(function(err, bar){
                if(err){ return next(err); }
                res.json(bar);
            });
//			$('.on_tap').find('a').each(function(idx,li) {
//                console.log($(li).text());
//				var newBeer = new Beer({name:$(li).text()});
//				var untappdSearchString = newBeer.name.replace(/ /g,'+');
//				var untappdUrl = 'https://untappd.com/search?q=' + untappdSearchString;
//				request(untappdUrl, function(error,response,html) {
//					if (!error) {
//						var $ = cheerio.load(html);
//						var rating = $('.results-container').find('.rating').find('.num').first().text();
//						rating = rating.substr(1, rating.length - 2);
//						newBeer.rating = rating;
//						newBeer.save();
//					}
//				});

//			});

		}
        else {
            console.log("Error retrieving URL");
        }
	});
});
router.param('bar', function(req, res, next, id) {
  var query = Bar.findById(id);

  query.exec(function (err, bar){
    if (err) { return next(err); }
    if (!bar) { return next(new Error('can\'t find bar')); }

    req.bar = bar;
    return next();
  });
});
router.param('category', function(req,res,next,id) {
    var query = Category.findById(id);

    query.exec(function (err, category) {
        if (err) { return next(err); }
        if (!category) { return next(new Error('can\'t find category')); }

        req.category = category;
        return next();
    });
});
router.get('/bars/:bar', function(req, res, next) {
    req.bar.populate('categories', function(err,bar) {
        if(err) {return next(err);}
        res.json(bar);
    });
});
router.get('/bars/:bar/categories/:category', function(req, res) {
    req.category.populate('beers', function(err, category) {
        if(err) {return next(err);}
        var untappdCallbacks = [];
        category.beers.forEach(function(beer) {
            console.log(beer.name);
            if(beer.brewery == '') {
                console.log('Retrieving data for ' + beer.name);

                untappdCallbacks.push(function (callback) {
                    var untappdSearchString = beer.name.replace(/ /g, '+');
                    untappdSearchString = beer.brewery.replace(/ /g, '+') + '+' + untappdSearchString;
                    var untappdUrl = 'https://api.untappd.com/v4/search/beer?access_token=' + config.untappd.myaccesstoken + '&q=' + untappdSearchString;
                    console.log(untappdUrl);
                    request(untappdUrl, function (error, response, html) {
                        if (!error) {
                            var untappdSearchResults = JSON.parse(html);
                            var firstSearchResult = untappdSearchResults.response.beers.items[0];
                            if(firstSearchResult && firstSearchResult.beer) {
                                var untappdBeer = firstSearchResult.beer;
                                var untappdBeerName = untappdBeer.beer_name;
                                var untappdBrewery = firstSearchResult.brewery;
                                var untappdBreweryName = untappdBrewery.brewery_name;
                                var untappdHaveHad = firstSearchResult.have_had;
                                beer.name = untappdBeerName;
                                beer.brewery = untappdBreweryName;
                                beer.haveHad = untappdHaveHad;
                                beer.rating = untappdBeer.auth_rating;
                                console.log('I made it here for ' + beer.name)
                                beer.save();
                            }
                            else {
                                beer.brewery = 'UNABLE TO FIND';
                            }
                            callback(false);
                        }
                    });
                });
            }
        });
        console.log(untappdCallbacks);
        async.parallel(untappdCallbacks, function(err) {
            if(err) { console.log(err); res.send(500,"Server Error"); return; }
            console.log('I\'m in here');
            res.json(category);
        });
    });
});
module.exports = router;
