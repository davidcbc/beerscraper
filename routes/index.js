var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Bar = mongoose.model('Bar');
var Beer = mongoose.model('Beer');
var Category = mongoose.model('Category');
var request = require('request');
var	cheerio = require('cheerio');
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
router.get('/bars/:bar', function(req, res, next) {
    req.bar.populate('categories', function(err,bar) {
        if(err) {return next(err);}
        res.json(bar);
    });
});
router.get('/bars/:bar/categories/:category', function(req, res) {
    res.json(req.category);
});
module.exports = router;
