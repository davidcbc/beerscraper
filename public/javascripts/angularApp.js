var app = angular.module('beerScraper', ['ui.router']);
app.factory('bars', ['$http', function($http) {
    var o = {
        bars: []
    };
    o.getAll = function() {
        return $http.get('/bars').success(function(data){
            angular.copy(data, o.bars);
        });
    };
    o.create = function(bar) {
        return $http.post('/bars', bar).success(function(data){
            o.bars.push(data);
        });
    };
    o.get = function(id) {
        return $http.get('/bars/' + id).then(function(res) {
           return res.data;
        });
    };
    return o;
}]);

app.factory('categories', ['$http', function($http) {
    var o = {
        categories: []
    };
    o.getAll = function(barId) {
        return $http.get('/bars/'+barId+'/categories').success(function(data){
            angular.copy(data, o.categories);
        });
    };
    o.get = function(barId, id) {
        return $http.get('/bars/' + barId + '/categories/' + id).then(function(res) {
            return res.data;
        });
    };
    return o;
}]);
app.controller('MainCtrl', [
    '$scope', 'bars',
    function($scope, bars) {
        $scope.bars = bars.bars;
        $scope.addBar = function() {
            if (!$scope.title || $scope.title === '') {
                return;
            }
            bars.create({
                name: $scope.title,
                link: $scope.link
            });
            $scope.title = '';
            $scope.link = '';
        };
    }
]);

app.controller('barsCtrl', [
    '$scope',
    'bars',
    'bar',
    function($scope, bars, bar) {
        $scope.bar = bar;
    }
]);
app.controller('categoryCtrl', [
    '$scope',
    'categories',
    'category',
    function($scope, categories, category) {
        $scope.category = category;
    }
]);
app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: '/home.html',
                controller: 'MainCtrl',
                resolve: {
                    barPromise: ['bars', function(bars) {
                        return bars.getAll();
                    }]
                }
            }).state('bars', {
                url: '/bars/:id',
                templateUrl: '/bar.html',
                controller: 'barsCtrl',
                resolve: {
                    bar: ['bars', '$stateParams', function(bars,$stateParams) {
                        return bars.get($stateParams.id);
                    }]
                }
            }).state('categories', {
                url: '/bars/:barid/categories/:categoryid',
                templateUrl: '/category.html',
                controller: 'categoryCtrl',
                resolve: {
                    category: ['categories', '$stateParams', function(categories, $stateParams) {
                        return categories.get($stateParams.barid, $stateParams.categoryid);
                    }]
                }
            });

        $urlRouterProvider.otherwise('home');
    }
]);
