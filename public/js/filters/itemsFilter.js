angular
	.module('ngItems')
	.filter('itemsFilter', function() {

		return function(listings, priceInfo) {
			var filtered = [];

			var min = priceInfo.min;
			var max = priceInfo.max;

			angular.forEach(listings, function(listing) {
				if(min == ""){
					min = "0";
				} else if(max == ""){
					max == "1000"
				} else if(min <= listing.price && max == "1000") {
					filtered.push(listing);
				} else if(min <= listing.price && listing.price <= max) {
			 		filtered.push(listing);
			 	}
			});
			
			return filtered;
		}
	});