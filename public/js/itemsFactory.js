angular
    .module('ngItems')
    .factory('itemsFactory', function ($http) {

        function getItems() {
            return $http.get('data/data.json');
        }

        return {
            getItems: getItems
        }
    });