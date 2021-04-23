
/* globals google*/
import React, { useState, useCallback, useEffect,Fragment, useRef } from 'react';
import './App.css';
import { withScriptjs, withGoogleMap, GoogleMap, Marker, Circle } from "react-google-maps"
import MarkerWithLabel from "react-google-maps/lib/components/addons/MarkerWithLabel";
const circleOptions = { strokeColor: '#f44336'}
const labelAnchor = {x:0 , y:0}
const labelStyle = {
  backgroundColor: "rgba(244,67,54,0.75)",
  color: 'white',
  textAlign: 'center',
  fontSize: "20px", 
  padding: "32px 32px",
  borderTopLeftRadius: '100%',
  borderTopRightRadius: '100%',
  borderBottomRightRadius: '100%',
  transform: 'translateY(-100%)',
  maxWidth: '200px'
  
}


const MyMapComponent = withScriptjs(withGoogleMap((props) =>{

  const mapRef = useRef(null)
  const [ zoom, setZoom ] = useState(3)
  const [ bounds, setBounds ] = useState(null)

  const handleRef = useCallback(ref => {
mapRef.current = ref

  }, [])

  const handleZoom = useCallback( () => {
      if(mapRef.current){
        setZoom(mapRef.current.getZoom())
      }

  }, [] )

  const handleBounds = useCallback( () => {
    if(mapRef.current){
      setBounds(mapRef.current.getBounds())
    }

}, [] )






  return(
  <GoogleMap
  ref={handleRef}
  onZoomChanged ={handleZoom}
  onBoundsChanged={handleBounds}


    defaultZoom={3}
    defaultCenter={{ lat: 47.1430185, lng: 17.26265 }}
  >
    {props.locations.map(location => {

      const { id,coords , state, country, confirmed, deaths, recovered} = location;
      const name = `${state} ${country}`.trim()
     
      const inBounds = bounds && bounds.contains(coords)
      const inBoundsAndZoom = zoom > 6 && inBounds
      return (
        <Fragment key={id}>
          { inBounds && confirmed > 0 && <Circle 
          
            center={coords} 
            radius={Math.log(confirmed) * 10000}
            options={circleOptions}
          />
          }

          {(confirmed > 0 || deaths > 0 || recovered > 0) && <MarkerWithLabel
          
              position={coords}
              labelAnchor={labelAnchor}
              labelStyle={labelStyle}
              icon=' '
            >
              <div><span style={{ fontSize: '1.2em', fontWeight: 'bold'}}>{name}</span><br /><br/>Confirmed: {confirmed} <br/>Deaths: {deaths}<br/>Recovered: {recovered}</div>
            </MarkerWithLabel>
    }
        </Fragment>
)
    })}
    
  </GoogleMap>
  )
  }))


function App() {
  const [ locations, setLocations] = useState([])
  const [timeSeries, setTimeSeries] = useState([])

  useEffect(()=> {
    fetch('https://benjoe1412.github.io/korona-virus-api/data')
    .then(res => res.json())
    .then(locations => { 
      const locationsGrouped = {};
      locations.forEach(location => {
        const id = `${location.state} ${location.country}`  
        const coords = {lat: location.latitude, lng: location.longitude}
        if(locationsGrouped[id]){
          locationsGrouped[id] = {
            ...locationsGrouped[id],
            confirmed: locationsGrouped[id].confirmed + location.confirmed,
            deaths: locationsGrouped[id].deaths + location.deaths,
            recovered: locationsGrouped[id].recovered + location.recovered,
          }
        }else{
          locationsGrouped[id] = location
          locationsGrouped[id].id = id
          locationsGrouped[id].coords = coords
        }
      });

      const newLocations = Object.values(locationsGrouped).filter(({ latitude, longitude}) => latitude && longitude)
      setLocations(newLocations)
    })
  }, [])

  useEffect(()=> {
    fetch('https://benjoe1412.github.io/korona-virus-api/time-series')
    .then(res => res.json())
    .then(locations => { 

      const newLocations = Object.values(locations).filter(({ latitude, longitude}) => latitude && longitude)
      setTimeSeries(newLocations)
    })
  }, [])
const [playIndex, setPlayIndex] = useState(-1);


useEffect(() => {
if(playIndex < 0){
  return;
}
setLocations(timeSeries.map(location => ({
  ...location,
  coords: {lat: location.latitude, lng: location.longitude},
  confirmed: location.confirmed[playIndex],
  deaths: location.deaths[playIndex],
  recovered: location.recovered[playIndex]
})))

})
  const handlePlayClick = useCallback(() => {
    if(playIndex !== -1){
      return;
    }
   const interval =  setInterval(() => {
      setPlayIndex(prev => {
        if(prev === timeSeries[0].confirmed.length -1){
          clearInterval(interval);
          return -1;
        }
       return prev +1;
      });
    }, 10)
      
  }, [timeSeries, playIndex]);

  return (
    <div className="App">
      <button style= {{padding: '8px 16px', position: 'absolute', top: 0, left: 0, zIndex: 10000}} onClick={handlePlayClick} >Play</button>
        <MyMapComponent
          locations={locations}
          googleMapURL="https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places"
          loadingElement={<div style={{ height: `100%` }} />}
          containerElement={<div style={{ height: `100vh` }} />}
          mapElement={<div style={{ height: `100%` }} />}
        />

    </div>
  );
}

export default App;
