// Global Variables
var brookfood = {}; 
brookfood.webdb = {};
var webappurl = ''; // http://brookfood.clientsee.co.uk
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
    brookfood.webdb.getAllProducts(loadProducts);
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

// Initialise the angular app module
var Module = angular.module('brooks', ['onsen']);
Module.controller('BrooksController', function($scope){

	// define the add image source and initialise the image source placeholder for the uploaded image
	$scope.originalImageSource = 'img/add-photo.png';
	$scope.imageSource = 'img/add-photo.png';

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

	// WEBDB error handling
	brookfood.webdb.onError = function(tx, e) {
	    alert("There has been an error: " + e.message);
	}
	// WEBDB 
	brookfood.webdb.onSuccess = function(uploadData){
		// DO THE ANIMATION AND REFRESH THE UPLOAD SCREEN
		
	}
	// delete product from the local database
	brookfood.webdb.deleteProduct = function(id){
	    var db = brookfood.webdb.db;
	    
	    db.transaction(function(tx){
	       tx.executeSql("DELETE FROM products WHERE id=?",[id],
	                     brookfood.webdb.onSuccessDelete(),
	                     brookfood.webdb.onError);
	       });
	}

	brookfood.webdb.onSuccessDelete = function() {
		// do when product has been deleted
		alert('Product Deleted.');
	}
	
	$scope.doUpload = function(title, sku, imageSource){
		// Upload to live database
		// create timestamp to append to filename
	    $scope.timeInMs = Date.now();
	    
	    //set upload options
	    $scope.options = new FileUploadOptions();
	    $scope.options.fileKey = "file";
	    $scope.options.fileName = timeInMs + imageSource.substr(imageSource.lastIndexOf('/')+1);
	    $scope.options.mimeType = "image/jpeg";
	    $scope.options.chunkedMode = false;

	    $scope.options.params = {
	        title: title,
	        sku: sku,
	        refid: "upload",
	        file: $scope.options.fileName
    	}
    	alert($scope.options.fileName);
    	$scope.ft = new FileTransfer();
    	$scope.ft.upload(imageSource, encodeURI(webappurl + '/app'), $scope.uploadSuccess, $scope.uploadFail, $scope.options);		
	}

	$scope.uploadSuccess = function(){
		alert('Uploaded Product.');
		resetProductAddPage();
	}

	$scope.uploadFail = function(){
		alert('Upload Failed.');
	}


	/* ~~~~~~~~~~~~~~~~~~~~~~~~~~ Stored Products Page ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

	// when the button at the bottom of the stored products page is clicked to add a new product
	$scope.sendToUploadNew = function(){
		navigation.replacePage('add-product.html', {animation: 'slide'});
	}

	// when all items in the stored products are uploaded
	$scope.uploadAllProducts = function(){
		// do upload all products
	}

	$scope.removeProduct = function(product){
		//  specified product
		alert('removing product:' + product.id);
    	brookfood.webdb.deleteProduct(product.id);
    	$scope.index = $scope.productList.indexOf(product);
    	$scope.productList.splice($scope.index, 1);
    	brookfood.webdb.getAllProducts(loadProducts);
	}

	// Pass all the products into a list to be accesed by angular
	$scope.getAllProducts =function(){
		// get all products
		// create a list of all of the products
		brookfood.webdb.getAllProducts(loadProducts);
		$scope.productList = [];
		$scope.products = products;
		// pass all of the product objects into the list
		for(var i=0; i< $scope.products.rows.length; i++){
			$scope.productList.push($scope.products.rows.item(i));
		}
		// check if the product list is empty
		if($scope.productList == ''){
			$scope.isEmpty = true;
		}
		else{
			$scope.isEmpty = false;
		}
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
			// Have a way to hide the photoselection alert dialog.
		});
	}

	$scope.onFail = function(){
		// do stuff when the photo is not captured
		alert('Error: ' + message);	
	}

	$scope.resetProductAddPage = function(){
		$scope.imageSource = $scope.originalImageSource;
		$('#title-input').val('');
		$('#sku-input').val('');
	}

	$scope.getUploadData = function(ProductTitle, sku, when){
		$scope.ProductTitle = angular.copy(ProductTitle);
		$scope.sku = angular.copy(sku);
		// Verifiy an image has been uploaded and is not the original
		if($scope.imageSource == $scope.originalImageSource && $scope.sku == undefined && $scope.ProductTitle== undefined){
    		ons.notification.alert({title: 'Warning', message: 'Nothing was entered.'});
		}
		else if($scope.imageSource == $scope.originalImageSource){
		 	ons.notification.alert({title: 'Warning', message: 'Image not uploaded.'});
		 }
		else if($scope.sku == undefined){
			ons.notification.alert({title: 'Warning', message: 'Product sku was not entered.'});
		}
		else if($scope.ProductTitle==undefined){
			ons.notification.alert({title: 'Warning', message: 'Product title was entered.'});
		}
		else{
			if(when == 'now'){
			$scope.doUpload($scope.ProductTitle, $scope.sku, $scope.imageSource);
    	}

	    	else if(when == 'later'){
				// Upload To Local Database Now
				alert($scope.imageSource);
				brookfood.webdb.saveProduct($scope.ProductTitle, $scope.sku, $scope.imageSource);
	    		brookfood.webdb.getAllProducts(loadProducts); // get all the localy stored products
	    		ons.notification.alert({title: 'Success', message: 'Product Uploaded'});
				navigation.popPage(); // Go back to the home page
			}
		}
	 }	
});


