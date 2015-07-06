// Global Variables
var brookfood = {}; 
brookfood.webdb = {};
var webappurl = 'http://brookfood.clientsee.co.uk';
var pictureSource;   // picture source
var destinationType; // sets the format of returned value


// device APIs are available
var onDeviceReady = function (){
    pictureSource=navigator.camera.PictureSourceType; // define the camera picture source
    destinationType=navigator.camera.DestinationType; // define where the photo will be stored

    brookfood.webdb.open(); // open the local database connection
    brookfood.webdb.createTable(); // create the local database table if it is not already made

    // define the global objects to be used in the angular scope
    open = brookfood.webdb.open();
    create = brookfood.webdb.createTable();
}

// Wait for device API libraries to load
document.addEventListener("deviceready",onDeviceReady,false);

// defined global objects
var open, create;
var products = {}; // products array
// /* ~~~~~~~~~~~~~~~~~~~~~~~~~~ WEBSQL Functions ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

brookfood.webdb.db = null;

brookfood.webdb.open = function() {
    // create database. Name, version, description, expected size (5MB)
    brookfood.webdb.db = openDatabase('BrookFood', '1.0', 'Brook Food uploader', 5242880);
}

brookfood.webdb.createTable = function() {
	// create the table if not already made 
    var db = brookfood.webdb.db;
    db.transaction(function(tx){
        tx.executeSql("CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY ASC, title TEXT, sku TEXT, imagePath TEXT)",[]);
    });
}

// Initialise the angualr app module
var Module = angular.module('brooks', ['onsen']);
Module.controller('BrooksController', function($scope){
	// WEBDB error handling
	brookfood.webdb.onError = function(tx, e) {
	    alert("There has been an error: " + e.message);
	}
	// WEBDB 
	brookfood.webdb.onSuccess = function(uploadData){
		// DO THE ANIMATION AND REFRESH THE UPLOAD SCREEN
	}

	// save a product to the local database
	brookfood.webdb.saveProduct = function(title, sku, imagePath){
	    var db = brookfood.webdb.db;
	    	// define the data uploaded 
	    	uploadData = {
	    		title: title,
	    		sku: sku,
	    		imagePath: imagePath
	    	};   
	    db.transaction(function(tx){
	       // Insert into the local database query
	       tx.executeSql("INSERT INTO products(id, title, sku, imagePath) VALUES (null,?,?,?)",
	                     [title, sku, imagePath],
	                     brookfood.webdb.onSuccess(uploadData),
	                     brookfood.webdb.onError);              
	    });
	}

	// get all products in database
	brookfood.webdb.getAllProducts = function(renderFunc){
	    var db = brookfood.webdb.db;
	    db.transaction(function(tx){
	    	// select all the products from the database
	        tx.executeSql("SELECT * FROM products",[], renderFunc, brookfood.webdb.onError);
	    });
	}

	function loadProducts(tx, r){
	 	products = r;
	}

	$scope.originalImageSource = 'img/add-photo.png';
	$scope.imageSource = 'img/add-photo.png';
		
	/* ~~~~~~~~~~~~~~~~~~~~~~~~~~ Stored Products Page ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

	// when the button at the bottom of the stored products page is clicked to add a new product
	$scope.sendToUploadNew = function(){
		navigation.replacePage('add-product.html', {animation: 'slide'});
		//onTransitionEnd: function(){ navigation.popPage();}
	}

	// when all items in the stored products are uploaded
	$scope.uploadAllProducts = function(){
		// do upload all products
	}

	$scope.removeProduct = function(){
		// remove specified product
	}

	$scope.getAllProducts =function(){
		// get all products
		brookfood.webdb.getAllProducts(loadProducts);
		$scope.productList = [];
		$scope.products = products;

		for(var i=0; i< $scope.products.rows.length; i++){
			$scope.productList.push($scope.products.rows.item(i));
		}
		// return each product  and assign to a scoped variable to be accessed in html*
	}

	/* ~~~~~~~~~~~~~~~~~~~~~~~~~~ Add Product Page ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

	// Method of photo selection prompt 
	$scope.photoSelection = function(){
			ons.createAlertDialog('photo-selection.html').then(function(alertDialog) {
	  		alertDialog.show();
		  });
	}

	$scope.getPhoto = function(){
	// Retrieve image file location from specified source
	navigator.camera.getPicture($scope.onPhotoURISuccess, $scope.onFail, {
	                            quality: 20,
	                            destinationType: destinationType.FILE_URI,
	                            sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
	                            });

	}

	$scope.capturePhoto = function(){
	// Take picture using device camera, allow edit, and retrieve image as base64-encoded string
	navigator.camera.getPicture($scope.onPhotoURISuccess, $scope.onFail, {
	    allowEdit: true,
	    quality: 20,
	    targetWidth: 512,
	    targetHeight: 512,
	    destinationType: destinationType.FILE_URI,
	    saveToPhotoAlbum: true,
	    correctOrientation: true
	    });
	}

	$scope.onPhotoURISuccess = function(imageURI){
		// do stuff when the photo is captured
		$scope.$apply( function(){
			$scope.imageSource = imageURI;
			// hide image *
		});

		// after it has been uploaded then replace the image to the add-photo one 
		// $scope.imageSource = 'img/add-photo.png';
	}

	$scope.onFail = function(){
		// do stuff when the photo is not captured
		alert('Error: ' + message);	
	}

	$scope.success = function(){
	}
	$scope.getUploadData = function(ProductTitle, sku, when){
		// // Verifiy an image has been uploaded and is not the original
		 if($scope.imageSource != $scope.originalImageSource){
		 	$scope.ProductTitle = angular.copy(ProductTitle);
		 	$scope.sku = angular.copy(sku);
		 }
		 else{
		 	// ERROR CONTROL
		 	alert('Image Not Uploaded.');
		 }

		if(when == 'now'){
			// Upload to live database
			// create timestamp to append to filename
		    $scope.timeInMs = Date.now();
		    
		    //set upload options
		    $scope.options = new FileUploadOptions();
		    $scope.options.fileKey = "file";
		    $scope.options.fileName = $scope.timeInMs + $scope.imageSource.substr($scope.imageSource.lastIndexOf('/')+1);
		    $scope.options.mimeType = "image/jpeg";
		    $scope.options.chunkedMode = false;

		    $scope.options.params = {
		        title: $scope.ProductTitle,
		        sku: $scope.sku,
		        refid: "upload",
		        file: $scope.options.fileName
	    	}
	    	$scope.ft = new FileTransfer();
	    	$scope.ft.upload($scope.imageSource, encodeURI(webappurl + '/app'), $scope.uploadSuccess, $scope.uploadFail, $scope.options);
		}
		if(when == 'later'){
			// Upload To Local Database Now
			brookfood.webdb.saveProduct($scope.ProductTitle, $scope.sku, $scope.imageSource);
			navigation.replacePage('stored-products.html', {animation: 'slide'});
		}
	}

	$scope.uploadSuccess = function(){
		alert('Uploaded Product.');
	}
	$scope.uploadFail = function(){
		alert('Upload Failed.');
	}
});


