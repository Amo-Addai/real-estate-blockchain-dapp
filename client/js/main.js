(function ($) {
  "use strict";
	
	
	// IMAGES TO UPDATE - logo-*, about-*, agent-*, author-*, mini-testimonial-*, plan*, 
	// post-*, post-single-*, property-*, slide-*, slide-about-*, testimonial-*, 

	// FOR STARTERS, HAVE ALL data OVER HERE, AND STORED WITHIN THE WINDOW'S LOCAL STORAGE ..
	var data = {

		limits: {
			carousel: 5,
			latestProperties: 5
		},

		properties: [
			{
				name: "MEST",
				full_name: "Meltwater Entrepreneurial School of Technology",
				details: "",
				// 
				type: "",
				project: "",
				stage: "",
				slots: {
					total: 100,
					available: 100,
					slot_price: 1
				},
				value: {
					value: 100, currency: "USD"
				},
				price: {
					price: 120, currency: "USD"
				},
				investors: [],
				waitlist: [],
				asset: {},
				data: {
					property_details: {
						area: {
							value: 240,
							unit: "square metres"
						},
						beds: 4,
						baths: 4,
						garages: 1
					}
				},
				// 
				location: {
					country: "Ghana", 
					region: "Greater Accra",
					city: "Accra",
					town: "East Legon",
					street: "Abelemkpe St",
					number: "20",
					address: "Abelemkpe St 20, East Legon - Accra, Ghana",
					zip: "",
					postal: "",
					geolocation: {
						lat: 0, lng: 0
					}
				},
				images: [
					{ stub: "slide-1", format: "jpg" }, 
					{ stub: "property-1", format: "jpg" }, 
				],

			},
			{
				name: "MINC",
				full_name: "Meltwater Entrepreneurial School of Technology Incubator",
				details: "",
				// 
				type: "",
				project: "",
				stage: "",
				slots: {
					total: 100,
					available: 100,
					slot_price: 1
				},
				value: {
					value: 100, currency: "USD"
				},
				price: {
					price: 120, currency: "USD"
				},
				investors: [],
				waitlist: [],
				asset: {},
				data: {
					property_details: {
						area: {
							value: 240,
							unit: "square metres"
						},
						beds: 4,
						baths: 4,
						garages: 1
					}
				},
				// 
				location: {
					country: "Ghana", 
					region: "Greater Accra",
					city: "Accra",
					town: "East Legon",
					street: "Banana Street",
					number: "20",
					address: "Banana Street 20, East Legon - Accra, Ghana",
					zip: "",
					postal: "",
					geolocation: {
						lat: 0, lng: 0
					}
				},
				images: [
					{ stub: "slide-2", format: "jpg" }, 
					{ stub: "property-2", format: "jpg" }, 
				],

			},
			{
				name: "Star Heights",
				full_name: "StarBoy Real Estate Property",
				details: "",
				// 
				type: "",
				project: "",
				stage: "",
				slots: {
					total: 100,
					available: 100,
					slot_price: 1
				},
				value: {
					value: 100, currency: "USD"
				},
				price: {
					price: 120, currency: "USD"
				},
				investors: [],
				waitlist: [],
				asset: {},
				data: {
					property_details: {
						area: {
							value: 240,
							unit: "square metres"
						},
						beds: 4,
						baths: 4,
						garages: 1
					}
				},
				// 
				location: {
					country: "Ghana", 
					region: "Greater Accra",
					city: "Accra",
					town: "East Legon",
					street: "Lagos Avenue",
					number: "30",
					address: "Lagos Avenue 30, East Legon - Accra, Ghana",
					zip: "",
					postal: "",
					geolocation: {
						lat: 0, lng: 0
					}
				},
				images: [
					{ stub: "slide-3", format: "jpg" }, 
					{ stub: "property-3", format: "jpg" }, 
				],

			},
		]

	};

	//	FIRST, HAVE A STANDARD content OBJECT TO BE USED WITHIN THE ENTIRE WEBSITE
	var content = {
		// FOR THE SEARCH FORM ..
		propertyTypes: [
			{"text": "All Types", "value": ""},
			{"text": "For Sale", "value": ""}, 
			{"text": "For Rent", "value": ""}, 
			{"text": "For Investment", "value": ""}, 
			{"text": "Open House", "value": ""},
		],
		countries: [
			{"text": "Ghana", "value": ""},
			{"text": "Nigeria", "value": ""},
		],
		cities: [
			{"text": "Accra", "value": ""},
			{"text": "Tema", "value": ""},
			{"text": "Kumasi", "value": ""},
			{"text": "Cape Coast", "value": ""},
		],
		prices: [
			{"text": "Unlimited", "value": ""},
			{"text": "$50,000", "value": ""},
			{"text": "$100,000", "value": ""},
			{"text": "$150,000", "value": ""},
			{"text": "$200,000", "value": ""},
		],

		/////////////////////////////////////////////////////////////////////////////
		// INDEX PAGE CONTENT property-carousel
		carouselContent: [],


	};


  // Preloader
  $(window).on('load', function () {
    if ($('#preloader').length) {
      $('#preloader').delay(100).fadeOut('slow', function () {
        $(this).remove();
      });
    }
  });

  // Back to top button
  $(window).scroll(function() {
    if ($(this).scrollTop() > 100) {
      $('.back-to-top').fadeIn('slow');
    } else {
      $('.back-to-top').fadeOut('slow');
    }
  });
  $('.back-to-top').click(function(){
    $('html, body').animate({scrollTop : 0},1500, 'easeInOutExpo');
    return false;
  });
  
	var nav = $('nav');
	var navHeight = nav.outerHeight();

	/*--/ ScrollReveal /Easy scroll animations for web and mobile browsers /--*/
	window.sr = ScrollReveal();
	sr.reveal('.foo', { duration: 1000, delay: 15 });

	
	//	SEARCH SIDE-NAV BAR

	var mapIdToContent = {
		"type": content.propertyTypes, "country": content.countries, "city": content.cities, "price": content.prices,
	}
	for(var k in mapIdToContent) {
		$.each(mapIdToContent[k], function (i, item) {
			$("select#"+k).append(new Option(item.text, item.value));
		}); // OR YOU CAN RATHER USE THIS INSTEAD .. 
		// $.each(mapIdToContent[k], function (i, item) {
		//   $("select#"+k).append($('<option>', { 
		//       value: item.value,
		//       text : item.text 
		//   }));
		// });
	}
 

	// GETTING DATA FOR CAROUSEL CONTENT ..

	if(data && data.properties && data.properties.length > 0){
		var carI = 0, property = null; 
		content.carouselContent = JSON.parse(JSON.stringify([]));
		// YOU MIGHT END UP NOT EVEN USING content.carouselContent ..
		for(carI = 0; carI < data.properties.length; carI++){
			try {
				if(carI == data.limits.carousel) break;
				// UPDATE content.carouselContent
				// OR, JUST GO STRAIGHT AHEAD TO UPDATING THE #carousel ELEMENT IN THE UI
				property = data.properties[carI];
				if(!property || (property == undefined)) continue;
				// 
				$("#carousel").append(' \
				<div class="carousel-item-a intro-item bg-image" style="background-image: url(img/' + 
				property.images[0].stub + '.' + property.images[0].format + ')"> \
					<div class="overlay overlay-a"></div> \
					<div class="intro-content display-table"> \
						<div class="table-cell"> \
							<div class="container"> \
								<div class="row"> \
									<div class="col-lg-8"> \
										<div class="intro-body"> \
											<p class="intro-title-top">' + property.location.town + ', ' + property.location.city + ' \
											<br> 78345</p>  \
											<h1 class="intro-title mb-4"> \
												<span class="color-b">204 </span> ' + property.name + ' \
												<br> ' + property.location.street + ' ' + property.location.number + ' </h1> \
											<p class="intro-subtitle intro-price"> \
												<a href="#"><span class="price-a price-a-hover">' + property.slots.available + ' slots left</span></a> \
											</p> \
										</div> \
									</div> \
								</div> \
							</div> \
						</div> \
					</div> \
				</div> \
				');
			} catch (e){
				console.log("ERROR -> " + JSON.stringify(e));
				continue;
			}
		}
	}
	 

	/*--/ Carousel owl /--*/
	$('#carousel').owlCarousel({
		loop: true,
		margin: -1,
		items: 1,
		nav: true,
		navText: ['<i class="ion-ios-arrow-back" aria-hidden="true"></i>', '<i class="ion-ios-arrow-forward" aria-hidden="true"></i>'],
		autoplay: true,
		autoplayTimeout: 3000,
		autoplayHoverPause: true
	});

	/*--/ Animate Carousel /--*/
	$('.intro-carousel').on('translate.owl.carousel', function () {
		$('.intro-content .intro-title').removeClass('zoomIn animated').hide();
		$('.intro-content .intro-price').removeClass('fadeInUp animated').hide();
		$('.intro-content .intro-title-top, .intro-content .spacial').removeClass('fadeIn animated').hide();
	});

	$('.intro-carousel').on('translated.owl.carousel', function () {
		$('.intro-content .intro-title').addClass('zoomIn animated').show();
		$('.intro-content .intro-price').addClass('fadeInUp animated').show();
		$('.intro-content .intro-title-top, .intro-content .spacial').addClass('fadeIn animated').show();
	});

	/*--/ Navbar Collapse /--*/
	$('.navbar-toggle-box-collapse').on('click', function () {
		$('body').removeClass('box-collapse-closed').addClass('box-collapse-open');
	});
	$('.close-box-collapse, .click-closed').on('click', function () {
		$('body').removeClass('box-collapse-open').addClass('box-collapse-closed');
		$('.menu-list ul').slideUp(700);
	});

	/*--/ Navbar Menu Reduce /--*/
	$(window).trigger('scroll');
	$(window).bind('scroll', function () {
		var pixels = 50;
		var top = 1200;
		if ($(window).scrollTop() > pixels) {
			$('.navbar-default').addClass('navbar-reduce');
			$('.navbar-default').removeClass('navbar-trans');
		} else {
			$('.navbar-default').addClass('navbar-trans');
			$('.navbar-default').removeClass('navbar-reduce');
		}
		if ($(window).scrollTop() > top) {
			$('.scrolltop-mf').fadeIn(1000, "easeInOutExpo");
		} else {
			$('.scrolltop-mf').fadeOut(1000, "easeInOutExpo");
		}
	});

	
	//	LATEST PROPERTY SECTION 

	
	// GETTING DATA FOR CAROUSEL CONTENT ..
	if(data && data.properties && data.properties.length > 0){
		var pI = 0, property = null, propertyUnit = ''; 
		// YOU MIGHT END UP NOT EVEN USING content.carouselContent ..
		for(pI = 0; pI < data.properties.length; pI++){
			try {
				if(pI == data.limits.latestProperties) break;
				// UPDATE content.carouselContent
				// OR, JUST GO STRAIGHT AHEAD TO UPDATING THE #carousel ELEMENT IN THE UI
				property = data.properties[pI];
				if(!property || (property == undefined)) continue;
				
				// 1ST, HANDLE SOME STUFF HERE ..
				switch(property.data.property_details.area.unit){
					case "square metres": 
						propertyUnit = 'm<sup>2</sup>';
						break;
					default:
						propertyUnit = '';
				}
				// 
				$("#property-carousel").append(' \
				<div class="carousel-item-b"> \
          <div class="card-box-a card-shadow"> \
            <div class="img-box-a"> \
              <img src="img/' + property.images[1].stub + '.' + property.images[1].format + '" alt="" class="img-a img-fluid"> \
            </div> \
            <div class="card-overlay"> \
              <div class="card-overlay-a-content"> \
                <div class="card-header-a"> \
								<p class="card-title-top">' + property.location.town + ', ' + property.location.city + '</p> \
                  <h2 class="card-title-a"> \
                    <a href="property-single.html">' + property.name + ' \
                      <br /> ' + property.location.street + ' ' + property.location.number + ' </a> \
                  </h2> \
                </div> \
                <div class="card-body-a"> \
                  <div class="price-box d-flex"> \
                    <span class="price-a">' + property.slots.available + ' slots left</span> \
                  </div> \
                  <a href="property-single.html" class="link-a">Click here to view \
                    <span class="ion-ios-arrow-forward"></span> \
                  </a> \
                </div> \
                <div class="card-footer-a"> \
                  <ul class="card-info d-flex justify-content-around"> \
                    <li> \
                      <h4 class="card-info-title">Area</h4> \
                      <span>' + property.data.property_details.area.value + propertyUnit + ' \
                      </span> \
                    </li> \
                    <li> \
                      <h4 class="card-info-title">Beds</h4> \
                      <span>' + property.data.property_details.beds + '</span> \
                    </li> \
                    <li> \
                      <h4 class="card-info-title">Baths</h4> \
                      <span>' + property.data.property_details.baths + '</span> \
                    </li> \
                    <li> \
                      <h4 class="card-info-title">Garages</h4> \
                      <span>' + property.data.property_details.garages + '</span> \
                    </li> \
                  </ul> \
                </div> \
              </div> \
            </div> \
          </div> \
        </div> \
				');
			} catch (e){
				console.log("ERROR -> " + JSON.stringify(e));
				continue;
			}
		}
	}
	 

	/*--/ Property owl /--*/
	$('#property-carousel').owlCarousel({
		loop: true,
		margin: 30,
		responsive: {
			0: {
				items: 1,
			},
			769: {
				items: 2,
			},
			992: {
				items: 3,
			}
		}
	});

	/*--/ Property owl owl /--*/
	$('#property-single-carousel').owlCarousel({
		loop: true,
		margin: 0,  
		nav: true,
		navText: ['<i class="ion-ios-arrow-back" aria-hidden="true"></i>', '<i class="ion-ios-arrow-forward" aria-hidden="true"></i>'],
		responsive: {
			0: {
				items: 1,
			}
		}
	});

	/*--/ News owl /--*/
	$('#new-carousel').owlCarousel({
		loop: true,
		margin: 30,
		responsive: {
			0: {  
				items: 1,
			},
			769: {
				items: 2,
			},
			992: {
				items: 3,
			}
		}
	});

	/*--/ Testimonials owl /--*/
	$('#testimonial-carousel').owlCarousel({
		margin: 0,
		autoplay: true,
		nav: true,
		loop: true,
		animateOut: 'fadeOut',
		animateIn: 'fadeInUp',
		navText: ['<i class="ion-ios-arrow-back" aria-hidden="true"></i>', '<i class="ion-ios-arrow-forward" aria-hidden="true"></i>'],
		autoplayTimeout: 4000,
		autoplayHoverPause: true,
		responsive: {
			0: {
				items: 1,
			}
		}
	});












})(jQuery);
