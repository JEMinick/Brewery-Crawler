
let bDebugging = false;

const locStorageKey = "BrewerySearchInfo";
const locStorageZipKey = "BrewerySearchZip";

let aBreweries = [];
let sLastZipSearched = "";
let sLastBreweryType = "";

mapboxgl.accessToken = 'pk.eyJ1IjoiYWxlcGUyMSIsImEiOiJja250ZnpoeW4wMjZ1Mm5vM3J3eG5iYjhqIn0.Jq0X-ynV1cZgyuhuSph0dA';
var map = new mapboxgl.Map({ 
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-117.161087,  32.715736],
    zoom: 10
});

// variables to keep track of quiz state
// let currentQuestionIndex = 0;
// let time = questions.length * 15;
// let timerId;
document.addEventListener('DOMContentLoaded', function() {
    var options = "col s12 m5";
    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems, options);
    if ( bDebugging )
      console.log( "[select] initialization completed..." );
});

// ----------------------------------------------------------

// by_postal response:
// https://api.openbrewerydb.org/breweries?by_postal=92101

// [
//     {
//         "id":8041,
//         "obdb_id":"10-barrel-brewing-co-san-diego",
//         "name":"10 Barrel Brewing Co",
//         "brewery_type":"large",
//         "street":"1501 E St",
//         "address_2":null,
//         "address_3":null,
//         "city":"San Diego",
//         "state":"California",
//         "county_province":null,
//         "postal_code":"92101-6618",
//         "country":"United States",
//         "longitude":"-117.129593",
//         "latitude":"32.714813",
//         "phone":"6195782311",
//         "website_url":"http://10barrel.com",
//         "updated_at":"2018-08-23T23:23:42.000Z",
//         "created_at":"2018-07-24T01:32:51.000Z"
//     },

function generateSource(detailResultsArray, sourceExist){
  /*
  {
                    id : response.data[i].id,
                    name : response.data[i].name,
                    street : response.data[i].street,
                    city : response.data[i].city,
                    state : response.data[i].state,
                    zip : response.data[i].postal_code,
                    phone : response.data[i].phone,
                    longitude: response.data[i].longitude,
                    latitude: response.data[i].latitude,
                    websiteURL : response.data[i].website_url
                }
  
  */
  if ( bDebugging )
    console.log(detailResultsArray)
  
  var featuresArray =[]
  for (let index = 0; index< detailResultsArray.length; index++){
    const element = detailResultsArray[index];

   // var link = new URL(element.result.recBreweryInfo)
   // var params = new URLSearchParams(link.search)
    var coordinates =[Number(element.longitude), Number(element.latitude)]

    //console.log(coordinates)
   // console.log(element.recBreweryInfo)
    //console.log(element)
    var featureObject = {
      'type': 'Feature',
      'properties': {
      'description':`<strong>${element.name}</strong>`
      },
      'geometry': {
      'type' : 'Point',
      'coordinates': coordinates
      }
    }
    featuresArray.push(featureObject)

  }

  if (sourceExist) {
    if ( bDebugging )
      console.log(featuresArray)
    return {
      'type': 'FeatureCollection',
      'features': featuresArray
    }
  }else {
    
  var sourceGeojson = {
    'type': 'geojson',
    'data': {
    'type': 'FeatureCollection',
   features: featuresArray
    }
  }
  

  return sourceGeojson


  }
}

function locateBreweryInfo( sBreweryName )
{
    var iBreweryIndex=-1;
    for( var i=0; ( i < aBreweries.length ) && ( iBreweryIndex < 0 ) ; i++ )
    {
        if ( aBreweries[i].name === sBreweryName )
            iBreweryIndex = i;
    }
    return( iBreweryIndex );
}

function getBreweryInfo( sBreweryName )
{
    if ( bDebugging )
        console.log( "getBreweryInfo("+sBreweryName+")" );
    var iIdx = locateBreweryInfo(sBreweryName);
    
    if ( iIdx >= 0 )
    {
        if ( bDebugging )
            console.log( "Brewery [" + sBreweryName + "] clicked! : Index: [" + iIdx + "]" );
        
        // var recBreweryInfo = {
        //     id : response.data[i].id,
        //     name : response.data[i].name,
        //     street : response.data[i].street,
        //     city : response.data[i].city,
        //     state : response.data[i].state,
        //     zip : response.data[i].zip,
        //     phone : response.data[i].phone,
        //     longitude: response.data[i].longitude,
        //     latitude: response.data[i].latitude,
        //     websiteURL : response.data[i].websiteURL
        // }
        
        var elBreweryNameEl = document.getElementById( "idBreweryName" );
        if ( aBreweries[iIdx].name.length > 0 ) {
            elBreweryNameEl.textContent = aBreweries[iIdx].name;
        }
        
        // idStreet
        var elBreweryStreetEl = document.getElementById( "idStreet" );
        if ( aBreweries[iIdx].street.length > 0 ) {
            elBreweryStreetEl.textContent = aBreweries[iIdx].street;
        }
        
        // idCityStateZip
        var elBreweryCityStateZipEl = document.getElementById( "idCityStateZip" );
        if ( aBreweries[iIdx].city && (aBreweries[iIdx].city.length > 0) )
        {
            var sCityStateZip = aBreweries[iIdx].city;
            if ( aBreweries[iIdx].state && (aBreweries[iIdx].state.length > 0) )
            {
                sCityStateZip += ", " + aBreweries[iIdx].state;
                if ( aBreweries[iIdx].zip && (aBreweries[iIdx].zip.length > 0) )
                {
                    sCityStateZip += "  " + aBreweries[iIdx].zip;
                }
            }
            elBreweryCityStateZipEl.textContent = sCityStateZip;
        }
        
        // idBreweryWebLink
        var elBreweryWebUrlEl = document.getElementById( "idBreweryWebLink" );
        elBreweryWebUrlEl.innerHTML = "";
        if ( aBreweries[iIdx].websiteURL && (aBreweries[iIdx].websiteURL.length > 0) )
        {
            // <a id="idBreweryWebLink" href="#">Link to brewery website</a>
            var elWebsiteURL = document.createElement( "a" );
            elWebsiteURL.setAttribute( "id", "idBrewerySite" );
            elWebsiteURL.setAttribute( "href", aBreweries[iIdx].websiteURL );
            elWebsiteURL.textContent = "Display " + elBreweryNameEl.textContent+" website";
            elBreweryWebUrlEl.appendChild( elWebsiteURL );
        }
    }
}

function displayBrewerySearch( sZip2Search )
{
    var elBreweryListEl = document.getElementById( "zipCodeSearch" );
    elBreweryListEl.innerHTML = "";
    
    var elBreweryListBtnEl = document.getElementById( "btnClearList" );
    elBreweryListBtnEl.innerHTML = "Clear"
                                    + ( (sZip2Search && sZip2Search.length > 0) ? " "+sZip2Search : "" )
                                    + " search:";
    
    if ( (aBreweries.length > 0) )
    {
        if ( bDebugging ) {
            console.log( "displaySearch(length=="+aBreweries.length+")" );
            console.log( aBreweries );
        }
        
        if ( sZip2Search.length > 0 )
            sLastZipSearched = sZip2Search;
        
        // Locate the zipCodeSearch form element so we can populate it with all breweries
        // found within that zip-code:

        var sLastBreweryName = "";
        var iDuplicateCount = 0;
        
        for( var i=0; i < aBreweries.length; i++ )
        {
            let elBrewery = document.createElement( "a" );
            elBrewery.setAttribute( "href", "#idBreweryCard" ); // add hyperlink to jump to the top...
            elBrewery.setAttribute( "class", "col s12 waves-effect waves-teal btn-large brewery-button" );
            
            if ( (sLastBreweryName.length === 0) && (iDuplicateCount === 0) ) {
                sLastBreweryName = aBreweries[i].name;
            }
            else if ( aBreweries[i].name === sLastBreweryName ) {
                iDuplicateCount++;
                var iBreweryNo = iDuplicateCount+1;
                aBreweries[i].name += " ("+iBreweryNo+")";
            }
            else {
                // reset:
                iDuplicateCount = 0;
                sLastBreweryName = aBreweries[i].name;
            }
            
            elBrewery.textContent = aBreweries[i].name;
            
            elBrewery.addEventListener( "click", function()
            {
                getBreweryInfo( elBrewery.textContent ); //.value );
            })
            elBreweryListEl.append( elBrewery );
        }
    
    } // endIf ( aBreweries.length > 0 )
    
} // endFunction: displayBrewerySearch()

function runQuery( sZip2Query )
{
    if ( bDebugging )
        console.log( "runQuery("+sZip2Query+")" );
    var sZipToQuery = ( sZip2Query ? sZip2Query.trim() : "" );
    if ( sZipToQuery.length > 0 )
    {
        var elBreweryTypeEl = document.getElementById( "breweryType" );
        var sBreweryType = elBreweryTypeEl.value;
        if ( bDebugging )
            console.log( "breweryType: [" + sBreweryType + "]" );
        var sUrlBreweryType = "";
        if ( sBreweryType !== "all_types" ) {
            sUrlBreweryType = "&by_type="+sBreweryType;
        }
        
        sLastBreweryType = sBreweryType;
        sLastZipSearched = sZip2Query;
        
        // elStateList
        var elBreweryByStateEl = document.getElementById( "idBreweryState" );
        if ( elBreweryByStateEl )
        {
            var sBreweryState = elBreweryByStateEl.value;
            console.log( "State filter: [" + sBreweryState + "]" );
        }
        
        sURL = "https://api.openbrewerydb.org/breweries"
                + "?"
                // + "by_city=san%20diego"
                // + "&by_state=california"
                + "&by_postal=" + sZipToQuery
                + sUrlBreweryType
                ;
        
        if ( bDebugging ) {
            console.log( "===========================================================================" );
            console.log( "Search URL: " + sURL );
        }
        
        axios.get( sURL )
        .then( function(response)
        {
            aBreweries = [];
            
            if ( bDebugging ) {
                console.log( "------------------------------------------------" );
                console.log( " OpenBreweryDB response: " );
                console.log( response );
            }
            
            // ---------------------------------------------------------------------------------------------------------------------
            
            var elCurrentPicEl = document.getElementById( "beerPic" );
            elCurrentPicEl.setAttribute( "src", "./assets/images/BeerMug(xSmall).jpg" );
            elCurrentPicEl.setAttribute ("alt", "Beer Mug" );

            if ( bDebugging )
                console.log( "Search found [" + response.data.length + "] breweries! " );
            
            for( var i=0; i < response.data.length; i++ )
            {
                //-----------------------------------------------------------
                //         "id":8041,
                //         "obdb_id":"10-barrel-brewing-co-san-diego",
                //         "name":"10 Barrel Brewing Co",
                //         "brewery_type":"large",
                //         "street":"1501 E St",
                //         "address_2":null,
                //         "address_3":null,
                //         "city":"San Diego",
                //         "state":"California",
                //         "county_province":null,
                //         "postal_code":"92101-6618",
                //         "country":"United States",
                //         "longitude":"-117.129593",
                //         "latitude":"32.714813",
                //         "phone":"6195782311",
                //         "website_url":"http://10barrel.com",
                //         "updated_at":"2018-08-23T23:23:42.000Z",
                //         "created_at":"2018-07-24T01:32:51.000Z"
                //-----------------------------------------------------------
                var recBreweryInfo = {
                    id : response.data[i].id,
                    name : response.data[i].name,
                    street : response.data[i].street,
                    city : response.data[i].city,
                    state : response.data[i].state,
                    zip : response.data[i].postal_code,
                    phone : response.data[i].phone,
                    longitude: response.data[i].longitude,
                    latitude: response.data[i].latitude,
                    websiteURL : response.data[i].website_url
                }
                aBreweries.push( recBreweryInfo );
            }
            
            if ( bDebugging ) {
                console.log( "Saving brewery info:" );
                console.log( aBreweries );
            }
            localStorage.setItem( locStorageKey, JSON.stringify(aBreweries) );
            
            displayBrewerySearch( sZipToQuery );
          
            if ( map.getSource("places") )
            {
                map.getSource('places').setData(generateSource(aBreweries, true))
            }
            else
            {
                map.addSource( 'places', generateSource(aBreweries) );
                map.addLayer({
                    'id': 'places',
                    'type': 'circle',
                    'source': 'places',
                    'paint': {
                        'circle-color': '#4264fb',
                        'circle-radius': 6,
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#ffffff'
                    }
                });
            }

            // ---------------------------------------------------------------------------------------------------------------------
            
        }) // endThen axios.get response for a zip-code
        .catch( function(error) {
            if ( bDebugging ) {
                console.log( "------------------------------------------------" );
                console.log( error );
            }
            if ( sZip2Query === "" )
                alert( "Please enter a Zip Code to locate breweries for!" );
            else
                alert( "Problem encountered!  Unable to locate \"" + sZip2Query + "\"\n"
                        + "Error received: " + "[" + error + "]" );
        });
        
    }

} // endFunction: runQuery()

function start( sZip2Query )
{
    // https://api.openbrewerydb.org/breweries?by_postal=92101&by_type=micro
    
    let elSelectedBreweryType = document.getElementById( "breweryType" );
    let elSelectedZipcode = document.getElementById( "btnZipSearch" );
    let elClearBreweries = document.getElementById( "btnClearList" );
    
    aBreweries = JSON.parse( localStorage.getItem(locStorageKey) ) || [];
    if ( bDebugging )
        console.log( "START: Found a list of [" + aBreweries.length + "] breweries from the last search!" );
    if ( aBreweries.length > 0 )
        displayBrewerySearch(sZip2Query);
    
    // Create a drop-down list of states to choose from:
    // Objective:
    //     <select name="breweryState" id="breweryState">
    //         <option value="california">California</option>
    //     </select>
    // let elSearchByStateDiv = document.getElementById( "searchByState" );
    // if ( elSearchByStateDiv )
    // {
    //     // <p class="mt-2 my-1"><strong>State:</strong></p>
    //     var elStatePrefix = document.createElement( "p" );
    //     elStatePrefix.setAttribute( "class", "mt-2 my-2" );
    //     elStatePrefix.textContent = "State:";
    //     elSearchByStateDiv.appendChild( elStatePrefix );

    //     var elStateList = document.createElement( "select" );
    //     elStateList.setAttribute( "name", "breweryState" );
    //     elStateList.setAttribute( "id", "idBreweryState" );
    //     // elStateList.setAttribute( "class", "form-control d-block bg-white" );
    //     elSearchByStateDiv.appendChild( elStateList );
        
    //         var elState = document.createElement( "option" );
    //         elState.setAttribute( "value", "california" );
    //         elState.textContent = "California";
    //         elStateList.appendChild( elState );

    //         elState = document.createElement( "option" );
    //         elState.setAttribute( "value", "texas" );
    //         elState.textContent = "Texas";
    //         elStateList.appendChild( elState );
    // }

    // =====================================================================================================
    // When the search button is clicked, 
    // locate all breweries associated to the zip code typed by the user:
    elSelectedZipcode.addEventListener( "click", function()
    {
        let elZipCodeInput = document.getElementById( "zipCodeInput" );
        let sZipCode2Query = "";
        var sZipCodeInput = elZipCodeInput.value; // retrieve the user zip code input
        sZipCode2Query = sZipCodeInput.trim(); // remove any leading/trailing white space
        if ( bDebugging )
            console.log( "Zip2Search: [" + sZipCode2Query + "]" );
        
        elZipCodeInput.value = "";  // clear the user input...
        elZipCodeInput.focus(); // place the cursor input back on the primary input field...
        
        if ( sZipCode2Query && (sZipCode2Query.length > 0) )
        {
            if ( bDebugging )
                console.log( "Obtaining breweries for: [" + sZipCode2Query + "]" );
            
            sLastZipSearched = sZipCode2Query; // save in case we need to re-query...
            localStorage.setItem( locStorageZipKey, JSON.stringify(sLastZipSearched) );

            runQuery( sLastZipSearched );
        }
    })
    // =====================================================================================================
    
    elSelectedBreweryType.onchange = 
    function()
    {
        var sBreweryType = elSelectedBreweryType.value;
        if ( bDebugging )
        {
            console.log( "Brewery Type change detected!" );
            console.log( "New brewery type [" + sBreweryType + "] chosen for zip-code: [" + sLastZipSearched + "]" );
        }
        
        if ( sLastZipSearched.length > 0 )
        {
            runQuery( sLastZipSearched );
        }
    
    };
    
    // =====================================================================================================
    elClearBreweries.addEventListener( "click",function()
    {
        console.log( "Clearing the search list!" );
        aBreweries = [];
        localStorage.clear();
        displayBrewerySearch();
        sLastZipSearched = "";
        sLastBreweryType = "";
        window.location.replace( "./index.html" );
    })
    // =====================================================================================================

}

function loadMap()
{
  	// TO MAKE THE MAP APPEAR YOU MUST
	// ADD YOUR ACCESS TOKEN FROM
	// https://account.mapbox.com
    
    /*
        mapboxgl.accessToken = 'pk.eyJ1IjoiYWxlcGUyMSIsImEiOiJja250ZnpoeW4wMjZ1Mm5vM3J3eG5iYjhqIn0.Jq0X-ynV1cZgyuhuSph0dA';
        map = new mapboxgl.Map({ 
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-117.161087,  32.715736],
            zoom: 10
        });
    */

    /* Given a query in the form "lng, lat" or "lat, lng"
     * returns the matching geographic coordinate(s)
     * as search results in carmen geojson format,
     * https://github.com/mapbox/carmen/blob/master/carmen-geojson.md
    */

    map.on( 'load', function()
    {
        // Add a GeoJSON source with 2 points
        /*
            map.loadImage('https://png.pngtree.com/element_pic/17/01/05/07dcdf530dd354f88c26f64a5ef71e8a.jpg'),
            function (error, loadImage) {
                if (error) throw error; 
                map.addImage('custom-marker', image);
            }
        */

        map.addSource('places', generateSource(aBreweries) );

        // Add a layer showing the places.
        map.addLayer({
            'id': 'places',
            'type': 'circle',
            'source': 'places',
            'paint': {
                'circle-color': '#4264fb',
                'circle-radius': 6,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });

        // Create a popup, but don't add it to the map yet.
        var popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });

        map.on( 'mouseenter', 'places', function(e)
        {
            // Change the cursor style as a UI indicator.
            map.getCanvas().style.cursor = 'pointer';

            var coordinates = e.features[0].geometry.coordinates.slice();
            var description = e.features[0].properties.description;

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            // Populate the popup and set its coordinates
            // based on the feature found.
            popup.setLngLat(coordinates).setHTML(description).addTo(map);
        });
        
        map.on( 'mouseleave', 'places', function()
        {
            map.getCanvas().style.cursor = '';
            popup.remove();
            map.on('load', function() {

            });
        });

    })

} // endFunction: loadMap()

loadMap();

var sZip2Locate = JSON.parse( localStorage.getItem(locStorageZipKey) ) || "";
if ( bDebugging )
    if ( sZip2Locate.length > 0 )
        console.log( "START: Found a previous zip-code to search (" + sZip2Locate + ")!" );
start(sZip2Locate);
