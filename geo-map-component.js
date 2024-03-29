import 'https://api.mapbox.com/mapbox-gl-js/v2.9.2/mapbox-gl.js';
import 'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v4.7.0/mapbox-gl-geocoder.min.js';

import { getURLValues, ready } from './helpers.js';

class GeoMapComponent extends HTMLElement {
  constructor() {
    super();
    if(typeof(mapboxgl) === 'undefined'){
      return console.error('Geo Map component requires Mapbox to work');
    }
    const URLvalues = getURLValues();

    this.access_token = this.getAttribute('accesstoken');
    if(this.access_token === null){
      return console.error('Geo Map component requires a MapBox access token');
    }
    this.removeAttribute('accesstoken');
    mapboxgl.accessToken = this.access_token;

    this.styleurl = this.getAttribute('styleurl');
    if(this.styleurl === null || this.styleurl === ""){
      console.warn('could not find style url, using the default');
      this.styleurl = 'mapbox://styles/mapbox/streets-v11';
    }
    this.removeAttribute('styleurl');

    this.latitude = this.getAttribute('latitude');
    if(this.latitude === null) this.latitude = 0;
    this.latitude = URLvalues.latitude ? URLvalues.latitude : this.latitude;

    this.longitude = this.getAttribute('longitude');
    if(this.longitude === null) this.longitude = 0;
    this.longitude = URLvalues.longitude ? URLvalues.longitude : this.longitude;

    this.zoom = this.getAttribute('zoom');
    if(this.zoom === null) this.zoom = 1;
    this.zoom = URLvalues.zoom ? URLvalues.zoom : this.zoom;

    this.bearing = this.getAttribute('bearing');
    if(this.bearing === null) this.bearing = 0;
    this.bearing = URLvalues.bearing ? URLvalues.bearing : this.bearing;

    this.pitch = this.getAttribute('pitch');
    if(this.pitch === null) this.pitch = 0;
    this.pitch = URLvalues.pitch ? URLvalues.pitch : this.pitch;

    this.locked = this.getAttribute('locked');
    if(this.locked === null){
      this.locked = false;
    } else {
      this.locked = true;
    };

    this.slideshow = this.getAttribute('slideshow');
  }

  showLayer(){
    // this function will show a specific layer
    // in a neat, useable manner
    return console.error('FEATURE NOT IMPLEMENTED')
  }

  hideLayer(){
    // this function will hide a specific layer
    // in a neat, useable manner
    return console.error('FEATURE NOT IMPLEMENTED')
 
  }

  getLayers(){
    // this function will list the layers
    // the map has
    // in a neat, useable manner
    return console.error('FEATURE NOT IMPLEMENTED')
  }

  connectedCallback() {
    ready(() => this.initialize())
  }

  async initialize(){
    const el = document.createElement('map-container')
    this.appendChild(el)
    this.map = await new mapboxgl.Map({
      container: el, // container ID
      style: this.styleurl, // style URL
      center: [this.longitude, this.latitude],
      zoom: this.zoom,
      bearing: this.bearing,
      projection: 'globe',
      pitch: this.pitch,
      interactive: !this.locked
    })

    this.initialized = true;
    this.map.on('load', () => {this.mapLoaded()})
  }

  initializeGeoCoder(){
    let bbox = this.getAttribute('search-bounds');
    if(bbox !== null){
      bbox = bbox.split(',').map(d => {
        return Number(d.trim());
      });
    }

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      zoom: 18,
      marker: false,
      bbox:bbox,
      placeholder: 'Search for an Address'
    })

    this.map.addControl( geocoder )
   
  }

  initializeGeoLocate(){
    const geolocate = new mapboxgl.GeolocateControl({
      showAccuracy: false,
      showUserLocation: false
    });

    this.map.addControl(geolocate);
  }

  handleMoveEnd(e){
    let coords = this.map.getCenter();
    const bounds = this.map.getBounds();
    const zoom = this.map.getZoom();
    this.handleZoom(zoom);
    this.dispatchEvent(
      new CustomEvent('MAP MOVED', 
        {
          detail: {
            coords,
            bounds,
            zoom
          }
        }
      )
    );
  }

  handleZoom(zoom = 0){
    let mid_zoom_breakpoint = 15;
    let far_zoom_breakpoint = 10; 
    const zoom_breakpoints = this.getAttribute('zoom-breakpoints');
    if(zoom_breakpoints !== null){
      [mid_zoom_breakpoint, far_zoom_breakpoint] = zoom_breakpoints.split(',').map(n => Number(n));
    }
    if(zoom < far_zoom_breakpoint){
        this.classList.add('far');
        this.classList.remove('middle');
        this.classList.remove('near');
    } else if(zoom >= far_zoom_breakpoint && zoom <= mid_zoom_breakpoint){
        this.classList.add('middle')
        this.classList.remove('far')
        this.classList.remove('near')
    } else {
        this.classList.add('near')
        this.classList.remove('middle')
        this.classList.remove('far')
    }
  }

  showPopup(content){
    const popup = new mapboxgl.Popup({ 
      closeOnClick: false, 
      closeOnMove: true,
       offset: {
            'bottom': [-60, -10]
          },
    })
    .setLngLat(geo_map.map.getCenter())
    .setHTML(content)
    .addTo(this.map)
  }

  mapLoaded(){

    if(this.geocoder !== null){   
      if(typeof(MapboxGeocoder) === 'undefined'){
        this.innerHTML = `If you would like to use the geocoder element, 
        you must include the geocoder plugin in your HTML: 
        https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-geocoder/`
        return
      } 

      this.initializeGeoCoder()
    }

    this.geolocate_attribute = this.getAttribute('geolocate')
    if(this.geolocate_attribute !== null){
      this.initializeGeoLocate()
    }

    this.map.on('moveend', (e) => {
      this.handleMoveEnd(e)
    })

    this.map.on('click', (e) => {
      this.map.flyTo({center:e.lngLat, zoom:18.5});
      [...document.querySelectorAll('geo-map-modal')].forEach( modal => {
        modal.hideModal();
      })
    })

    this.style.opacity = 1;
    this.handleZoom(this.zoom);

    /*
    // This emits an even when the map is loaded. 
    // you can attach a function to this like
    //  geo_map.addEventListener('loaded', () => {
    //    your function here
    //  });
    */

    this.dispatchEvent(new Event('loaded'))
  }
}

customElements.define('geo-map', GeoMapComponent)


