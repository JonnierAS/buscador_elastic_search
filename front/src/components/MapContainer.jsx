import { useEffect, useRef } from "react";
import Map, {NavigationControl } from 'react-map-gl/maplibre';
import maplibregl from "maplibre-gl";
import AddressSearchModal from "./buscador/AddressSearchModal";
import { useLocalState } from "../context/GlobalState";

export const MapContainer = () => {
  const {setMapRef} = useLocalState()
    const mapRef = useRef(null);

    const onLoad=()=>{
      setMapRef(mapRef.current)
    }

  return (
    <div>
        <Map
        ref={mapRef}
        // onClick={handleclickSelect}  
        onLoad={onLoad}             
        // onStyleData={onStyleData}
        attributionControl={false}
        initialViewState={{longitude: -77.0428, latitude: -12.0464, zoom: 10}}
        mapLib={maplibregl}  interactive={true}
        mapStyle={"https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"}
        style={{width:  '100vw', height: '100vh'}}

      > 
        <NavigationControl position='top-left' />  
        <AddressSearchModal />
      </Map>
    </div>
  )
}
